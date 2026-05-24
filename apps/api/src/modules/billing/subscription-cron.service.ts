import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleTrialExpiry() {
    this.logger.log('Running daily trial expiry sweep...');

    const now = new Date();

    const expiredOrgs = await this.prisma.organization.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.TRIALING,
        trialEndsAt: { lt: now },
      },
      select: { id: true },
    });

    if (expiredOrgs.length === 0) {
      this.logger.log('No expired trials found.');
      return;
    }

    this.logger.log(`Found ${expiredOrgs.length} expired trials. Expiring them now...`);

    for (const org of expiredOrgs) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.organization.update({
            where: { id: org.id },
            data: { subscriptionStatus: SubscriptionStatus.EXPIRED },
          });

          // Create audit log for system action
          await tx.auditLog.create({
            data: {
              orgId: org.id,
              actorId: 'SYSTEM',
              action: 'SUBSCRIPTION_EXPIRED',
              entity: 'Organization',
              entityId: org.id,
              beforeJson: { subscriptionStatus: SubscriptionStatus.TRIALING },
              afterJson: { subscriptionStatus: SubscriptionStatus.EXPIRED },
            },
          });
        });
        this.logger.log(`Org ${org.id} trial expired.`);
      } catch (err) {
        this.logger.error(`Failed to expire trial for org ${org.id}: ${(err as Error).message}`);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDunningSweep() {
    this.logger.log('Running daily dunning sweep for PAST_DUE subscriptions...');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Any org PAST_DUE where the currentPeriodEnd was more than 7 days ago
    const overdueOrgs = await this.prisma.organization.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.PAST_DUE,
        currentPeriodEnd: { lt: sevenDaysAgo },
      },
      select: { id: true, subscriptionStatus: true },
    });

    if (overdueOrgs.length === 0) {
      this.logger.log('No subscriptions past 7-day grace period.');
      return;
    }

    this.logger.log(`Found ${overdueOrgs.length} orgs exceeding grace period. Suspending...`);

    for (const org of overdueOrgs) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.organization.update({
            where: { id: org.id },
            data: { subscriptionStatus: SubscriptionStatus.EXPIRED },
          });

          await tx.auditLog.create({
            data: {
              orgId: org.id,
              actorId: 'SYSTEM',
              action: 'SUBSCRIPTION_SUSPENDED_DUNNING',
              entity: 'Organization',
              entityId: org.id,
              beforeJson: { subscriptionStatus: org.subscriptionStatus },
              afterJson: { subscriptionStatus: SubscriptionStatus.EXPIRED },
            },
          });
        });
        this.logger.log(`Org ${org.id} suspended due to dunning failure.`);
      } catch (err) {
        this.logger.error(`Failed to suspend org ${org.id}: ${(err as Error).message}`);
      }
    }
  }
}
