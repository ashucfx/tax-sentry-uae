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
}
