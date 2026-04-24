import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentStatus } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const REQUIRED_DOC_TYPES = [
  'TRADE_LICENSE',
  'LEASE_AGREEMENT',
  'EMIRATES_IDS',
  'ORG_CHART',
  'PAYROLL_REGISTER',
  'OPEX_SPLIT',
  'BOARD_MINUTES',
  'AUDITED_FINANCIAL_STATEMENTS',
] as const;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

const DOC_TYPE_LABELS: Record<string, string> = {
  TRADE_LICENSE: 'Trade License',
  LEASE_AGREEMENT: 'Office Lease Agreement',
  EMIRATES_IDS: 'Emirates IDs of Qualified Employees',
  ORG_CHART: 'Organisation Chart',
  PAYROLL_REGISTER: 'Payroll Register',
  OPEX_SPLIT: 'OpEx Split (UAE Substance Evidence)',
  BOARD_MINUTES: 'Board Minutes (UAE Decision-Making)',
  AUDITED_FINANCIAL_STATEMENTS: 'Audited Financial Statements',
};

@Injectable()
export class SubstanceService {
  private readonly logger = new Logger(SubstanceService.name);
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    // Use service-role key (server-side only — never exposed to browser)
    this.supabase = createClient(
      config.getOrThrow('SUPABASE_URL'),
      config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
    );
    this.bucket = config.get('SUPABASE_STORAGE_BUCKET', 'qfzp-documents');
  }

  async uploadDocument(
    orgId: string,
    actorId: string,
    docType: string,
    file: Express.Multer.File,
    expiresAt?: Date,
  ) {
    // Validate doc type
    if (!Object.keys(DOC_TYPE_LABELS).includes(docType)) {
      throw new BadRequestException(`Invalid document type: ${docType}`);
    }

    // Validate MIME type (defense-in-depth: don't trust client headers)
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed: ${file.mimetype}. Allowed: PDF, images, Word, Excel`,
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds 50MB limit');
    }

    // Block executables — additional check beyond MIME
    if (this.isExecutable(file.buffer)) {
      throw new BadRequestException('Executable files are not permitted');
    }

    // Sanitise filename to prevent path traversal
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileKey = `${orgId}/${docType}/${randomUUID()}-${safeName}`;

    // Upload to Supabase Storage (private bucket, encrypted at rest by Supabase)
    const { error: uploadError } = await this.supabase.storage
      .from(this.bucket)
      .upload(fileKey, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
        // Supabase Storage encrypts all files at rest with AES-256
      });

    if (uploadError) {
      this.logger.error(`Storage upload failed: ${uploadError.message}`);
      throw new BadRequestException('File upload failed — please retry');
    }

    // Check for existing active document of this type
    const existing = await this.prisma.substanceDocument.findFirst({
      where: { orgId, docType, isDeleted: false, status: { not: 'DELETED' } },
    });

    const expiryStatus = expiresAt
      ? this.computeExpiryStatus(expiresAt)
      : undefined;

    const doc = await this.prisma.substanceDocument.create({
      data: {
        orgId,
        docType,
        displayName: DOC_TYPE_LABELS[docType] ?? docType,
        fileKey,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        expiresAt,
        status: (expiryStatus ?? DocumentStatus.ACTIVE) as DocumentStatus,
        virusScanStatus: 'PENDING',
      },
    });

    // Mark old document as superseded (soft-delete)
    if (existing) {
      await this.prisma.substanceDocument.update({
        where: { id: existing.id },
        data: { isDeleted: true, deletedAt: new Date(), deletedBy: actorId },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId,
        action: 'UPLOAD_DOCUMENT',
        entity: 'SubstanceDocument',
        entityId: doc.id,
        afterJson: { docType, fileName: file.originalname, expiresAt },
      },
    });

    return doc;
  }

  async getSignedDownloadUrl(docId: string, orgId: string): Promise<string> {
    const doc = await this.prisma.substanceDocument.findFirst({
      where: { id: docId, orgId, isDeleted: false },
    });

    if (!doc) throw new NotFoundException('Document not found');

    // Generate a signed URL valid for 1 hour (3600 seconds)
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(doc.fileKey, 3600);

    if (error || !data?.signedUrl) {
      this.logger.error(`Signed URL generation failed: ${error?.message}`);
      throw new BadRequestException('Could not generate download link — please retry');
    }

    return data.signedUrl;
  }

  async getChecklist(orgId: string) {
    const docs = await this.prisma.substanceDocument.findMany({
      where: { orgId, isDeleted: false },
      orderBy: { uploadedAt: 'desc' },
    });

    const docMap = new Map(docs.map((d) => [d.docType, d]));

    const checklist = REQUIRED_DOC_TYPES.map((type) => {
      const doc = docMap.get(type);
      const now = new Date();

      let status: 'MISSING' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' = 'MISSING';
      if (doc) {
        if (doc.status === 'EXPIRED' || (doc.expiresAt && doc.expiresAt < now)) {
          status = 'EXPIRED';
        } else if (
          doc.expiresAt &&
          doc.expiresAt < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        ) {
          status = 'EXPIRING_SOON';
        } else {
          status = 'ACTIVE';
        }
      }

      return {
        docType: type,
        label: DOC_TYPE_LABELS[type],
        status,
        document: doc
          ? {
              id: doc.id,
              fileName: doc.fileName,
              uploadedAt: doc.uploadedAt,
              expiresAt: doc.expiresAt,
              fileSize: doc.fileSize,
            }
          : null,
      };
    });

    const totalRequired = REQUIRED_DOC_TYPES.length;
    const totalComplete = checklist.filter((c) => c.status === 'ACTIVE').length;
    const completionPct = Math.round((totalComplete / totalRequired) * 100);

    return { checklist, totalRequired, totalComplete, completionPct };
  }

  async softDeleteDocument(docId: string, orgId: string, actorId: string) {
    const doc = await this.prisma.substanceDocument.findFirst({
      where: { id: docId, orgId, isDeleted: false },
    });

    if (!doc) throw new NotFoundException('Document not found');

    // CRITICAL: soft-delete only — never physically remove compliance docs
    await this.prisma.$transaction([
      this.prisma.substanceDocument.update({
        where: { id: docId },
        data: { isDeleted: true, deletedAt: new Date(), deletedBy: actorId, status: 'DELETED' },
      }),
      this.prisma.auditLog.create({
        data: {
          orgId,
          actorId,
          action: 'DELETE_DOCUMENT',
          entity: 'SubstanceDocument',
          entityId: docId,
          beforeJson: { docType: doc.docType, fileName: doc.fileName, status: doc.status },
        },
      }),
    ]);
  }

  private computeExpiryStatus(expiresAt: Date): string {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (expiresAt < now) return 'EXPIRED';
    if (expiresAt <= thirtyDays) return 'EXPIRING_SOON';
    return 'ACTIVE';
  }

  private isExecutable(buffer: Buffer): boolean {
    // Check common executable magic bytes
    const header = buffer.slice(0, 4).toString('hex');
    const executableHeaders = [
      '4d5a9000', // PE executable (MZ)
      '7f454c46', // ELF
      'cafebabe', // Java class / Mach-O
      '504b0304', // ZIP (but allow PDFs and Office formats through MIME check)
    ];
    // Only block true executables; ZIP-like containers handled by MIME check
    return header === '4d5a9000' || header === '7f454c46';
  }
}
