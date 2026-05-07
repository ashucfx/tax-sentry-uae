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

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds 50MB limit');
    }

    // Detect actual MIME type from magic bytes — never trust client Content-Type header
    const detectedMime = this.detectMimeFromBuffer(file.buffer);
    if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
      throw new BadRequestException(
        `File type not allowed. Allowed: PDF, JPEG, PNG, WebP, Word (.doc/.docx), Excel (.xls/.xlsx)`,
      );
    }

    // Sanitise filename to prevent path traversal; use detected mime for storage
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileKey = `${orgId}/${docType}/${randomUUID()}-${safeName}`;

    // Upload to Supabase Storage (private bucket, encrypted at rest by Supabase)
    const { error: uploadError } = await this.supabase.storage
      .from(this.bucket)
      .upload(fileKey, file.buffer, {
        contentType: detectedMime, // Use magic-byte-detected type, not client header
        upsert: false,
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
        mimeType: detectedMime, // verified type, not client-supplied
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

  /**
   * Derive the actual MIME type from the file's magic bytes.
   * Returns null for unknown or explicitly blocked types (executables, scripts).
   * Never trusts the client-supplied Content-Type header.
   */
  private detectMimeFromBuffer(buffer: Buffer): string | null {
    if (buffer.length < 4) return null;

    const b = buffer;
    const hex4 = b.slice(0, 4).toString('hex');
    const hex8 = b.slice(0, 8).toString('hex');

    // Executables and scripts — always reject
    if (hex4 === '4d5a9000' || hex4.startsWith('4d5a')) return null; // PE (.exe, .dll)
    if (hex4 === '7f454c46') return null;                             // ELF
    if (hex4 === 'cafebabe') return null;                             // Java class / Mach-O

    // Block common script signatures
    const textStart = b.slice(0, 20).toString('utf8').toLowerCase();
    if (textStart.startsWith('<?php') || textStart.startsWith('#!')) return null;
    if (textStart.startsWith('<html') || textStart.startsWith('<!doctype')) return null;
    if (textStart.startsWith('<svg')) return null; // SVG can contain embedded JS

    // PDF: %PDF
    if (hex4 === '25504446') return 'application/pdf';

    // JPEG: FF D8 FF
    if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (hex8 === '89504e470d0a1a0a') return 'image/png';

    // WebP: RIFF....WEBP
    if (hex4 === '52494646' && b.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';

    // Old Office formats (OLE2): D0 CF 11 E0
    if (hex4 === 'd0cf11e0') return 'application/msword'; // .doc or .xls — both allowed

    // ZIP-based formats (Office Open XML: .docx, .xlsx, .pptx)
    if (hex4 === '504b0304') {
      // Peek into the ZIP central directory to distinguish Office types
      const content = b.slice(0, Math.min(buffer.length, 512)).toString('utf8', 0, 512);
      if (content.includes('word/')) {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
      if (content.includes('xl/') || content.includes('worksheets/')) {
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }
      // ZIP with unknown interior — reject (could be arbitrary archive)
      return null;
    }

    return null; // Unknown type — reject
  }
}
