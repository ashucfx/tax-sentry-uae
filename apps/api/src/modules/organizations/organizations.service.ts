import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FreeZone } from '@prisma/client';

interface CreateOrgDto {
  name: string;
  tradeLicenseNo: string;
  freeZone: FreeZone;
  taxRegistrationNo?: string;
  taxPeriodStart: string;
  taxPeriodEnd: string;
  primaryActivityCode?: string;
}

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrgDto) {
    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        tradeLicenseNo: dto.tradeLicenseNo,
        freeZone: dto.freeZone,
        taxRegistrationNo: dto.taxRegistrationNo,
        primaryActivityCode: dto.primaryActivityCode,
        taxPeriods: {
          create: {
            startDate: new Date(dto.taxPeriodStart),
            endDate: new Date(dto.taxPeriodEnd),
            status: 'OPEN',
            ruleVersionId: 'CD100-2023-v1',
          },
        },
      },
      include: { taxPeriods: true },
    });

    return org;
  }

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        taxPeriods: { orderBy: { startDate: 'desc' } },
        activityDeclarations: { include: { activityCatalog: true } },
        integrations: { select: { provider: true, isActive: true, lastSyncAt: true } },
      },
    });

    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(id: string, updates: Partial<CreateOrgDto>) {
    return this.prisma.organization.update({
      where: { id },
      data: {
        name: updates.name,
        taxRegistrationNo: updates.taxRegistrationNo,
        primaryActivityCode: updates.primaryActivityCode,
      },
    });
  }

  async getActivityDeclarations(orgId: string) {
    return this.prisma.activityDeclaration.findMany({
      where: { orgId },
      include: { activityCatalog: true },
    });
  }

  async declareActivity(orgId: string, activityCode: string) {
    return this.prisma.activityDeclaration.upsert({
      where: { orgId_activityCode: { orgId, activityCode } },
      update: {},
      create: { orgId, activityCode },
    });
  }
}
