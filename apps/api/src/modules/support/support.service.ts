import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupportCategory } from '@prisma/client';

interface SubmitSupportDto {
  category: SupportCategory;
  subject: string;
  description: string;
  priority?: string;
}

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(orgId: string, userId: string | undefined, dto: SubmitSupportDto) {
    // Generate reference number: SR-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const referenceNo = `SR-${dateStr}-${rand}`;

    const request = await this.prisma.supportRequest.create({
      data: {
        orgId,
        userId,
        category: dto.category,
        subject: dto.subject,
        description: dto.description,
        priority: dto.priority ?? 'NORMAL',
        referenceNo,
      },
    });

    // Audit trail
    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId ?? null,
        action: 'SUPPORT_REQUEST_SUBMITTED',
        entity: 'SupportRequest',
        entityId: request.id,
        afterJson: { category: dto.category, subject: dto.subject, referenceNo },
      },
    }).catch(() => {});

    return request;
  }

  async listRequests(orgId: string) {
    return this.prisma.supportRequest.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        category: true,
        subject: true,
        priority: true,
        status: true,
        referenceNo: true,
        createdAt: true,
        resolvedAt: true,
      },
    });
  }

  async getRequest(orgId: string, id: string) {
    const req = await this.prisma.supportRequest.findFirst({
      where: { id, orgId },
    });
    if (!req) throw new NotFoundException('Support request not found');
    return req;
  }
}
