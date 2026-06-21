import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaxPeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPeriods(orgId: string) {
    return this.prisma.taxPeriod.findMany({
      where: { orgId },
      orderBy: { startDate: 'desc' },
    });
  }

  async createPeriod(orgId: string, userId: string, dto: { startDate: string; endDate: string }) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (end <= start) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const overlapping = await this.prisma.taxPeriod.findFirst({
      where: {
        orgId,
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });

    if (overlapping) {
      throw new ConflictException(
        `Date range overlaps with existing tax period (${overlapping.startDate.toISOString().slice(0, 10)} – ${overlapping.endDate.toISOString().slice(0, 10)})`,
      );
    }

    const period = await this.prisma.taxPeriod.create({
      data: {
        orgId,
        startDate: start,
        endDate: end,
        status: 'OPEN',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'TAX_PERIOD_CREATED',
        entity: 'TaxPeriod',
        entityId: period.id,
        afterJson: { startDate: dto.startDate, endDate: dto.endDate, status: 'OPEN' },
      },
    });

    return period;
  }

  async lockPeriod(orgId: string, userId: string, periodId: string) {
    const period = await this.prisma.taxPeriod.findFirst({
      where: { id: periodId, orgId },
    });

    if (!period) throw new NotFoundException('Tax period not found');

    if (period.status === 'LOCKED' || period.status === 'FILED') {
      throw new BadRequestException(`Tax period is already ${period.status.toLowerCase()}`);
    }

    const updated = await this.prisma.taxPeriod.update({
      where: { id: periodId },
      data: {
        status: 'LOCKED',
        lockedAt: new Date(),
        lockedByUserId: userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'TAX_PERIOD_LOCKED',
        entity: 'TaxPeriod',
        entityId: periodId,
        afterJson: { status: 'LOCKED', lockedAt: updated.lockedAt },
      },
    });

    return updated;
  }

  async filePeriod(orgId: string, userId: string, periodId: string) {
    const period = await this.prisma.taxPeriod.findFirst({
      where: { id: periodId, orgId },
    });

    if (!period) throw new NotFoundException('Tax period not found');

    if (period.status !== 'LOCKED') {
      throw new BadRequestException(
        'Tax period must be locked before filing. Current status: ' + period.status,
      );
    }

    const updated = await this.prisma.taxPeriod.update({
      where: { id: periodId },
      data: {
        status: 'FILED',
        filedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'TAX_PERIOD_FILED',
        entity: 'TaxPeriod',
        entityId: periodId,
        afterJson: { status: 'FILED', filedAt: updated.filedAt },
      },
    });

    return updated;
  }

  async createNextPeriod(orgId: string, userId: string, currentPeriodId: string) {
    const current = await this.prisma.taxPeriod.findFirst({
      where: { id: currentPeriodId, orgId },
    });

    if (!current) throw new NotFoundException('Tax period not found');

    const durationMs = current.endDate.getTime() - current.startDate.getTime();
    const nextStart = new Date(current.endDate.getTime() + 24 * 60 * 60 * 1000);
    const nextEnd = new Date(nextStart.getTime() + durationMs);

    const existing = await this.prisma.taxPeriod.findFirst({
      where: {
        orgId,
        startDate: { lte: nextEnd },
        endDate: { gte: nextStart },
      },
    });

    if (existing) {
      throw new ConflictException(
        `A tax period already exists that overlaps the next period (${nextStart.toISOString().slice(0, 10)} – ${nextEnd.toISOString().slice(0, 10)})`,
      );
    }

    const period = await this.prisma.taxPeriod.create({
      data: {
        orgId,
        startDate: nextStart,
        endDate: nextEnd,
        status: 'OPEN',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'TAX_PERIOD_CREATED',
        entity: 'TaxPeriod',
        entityId: period.id,
        afterJson: {
          startDate: nextStart.toISOString().slice(0, 10),
          endDate: nextEnd.toISOString().slice(0, 10),
          status: 'OPEN',
          createdFromPeriodId: currentPeriodId,
        },
      },
    });

    return period;
  }
}
