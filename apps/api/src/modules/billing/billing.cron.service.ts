import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BillingCronService {
  private readonly logger = new Logger(BillingCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDunningManagement() {
    this.logger.log('Starting daily dunning management check...');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find organizations that are PAST_DUE and the grace period has ended
    // We assume period end date + 7 days is the absolute limit
    const expiredOrgs = await this.prisma.organization.findMany({
      where: {
        subscriptionStatus: 'PAST_DUE',
        currentPeriodEnd: {
          lt: sevenDaysAgo,
        },
      },
    });

    for (const org of expiredOrgs) {
      this.logger.warn(`Organization ${org.id} (${org.name}) has exceeded the 7-day grace period. Moving to EXPIRED.`);

      await this.prisma.$transaction([
        this.prisma.organization.update({
          where: { id: org.id },
          data: {
            subscriptionStatus: 'EXPIRED',
          },
        }),
        this.prisma.auditLog.create({
          data: {
            orgId: org.id,
            action: 'DUNNING_EXPIRED',
            entity: 'Organization',
            entityId: org.id,
            beforeJson: { status: 'PAST_DUE' },
            afterJson: { status: 'EXPIRED' },
          },
        }),
      ]);
    }

    this.logger.log(`Completed dunning management check. Suspended ${expiredOrgs.length} accounts.`);
  }
}
