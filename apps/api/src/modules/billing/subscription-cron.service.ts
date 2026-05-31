import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cfg: ConfigService,
  ) {}

  private async sendEmail(orgId: string, subject: string, html: string): Promise<void> {
    try {
      const owner = await this.prisma.user.findFirst({
        where: { orgId, role: 'OWNER' },
        select: { email: true },
      });

      if (!owner?.email) return;

      const { Resend } = await import('resend');
      const apiKey = this.cfg.get<string>('RESEND_API_KEY');
      if (!apiKey) {
         this.logger.warn('No RESEND_API_KEY configured. Skipping email.');
         return;
      }
      const resend = new Resend(apiKey);
      
      await resend.emails.send({
        from: this.cfg.get<string>('EMAIL_FROM', 'hello@gettaxsentry.com'),
        to: owner.email,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to org ${orgId}: ${(err as Error).message}`);
    }
  }

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

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handlePreExpiryWarnings() {
    this.logger.log('Running daily pre-expiry warning sweep...');

    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    // 1. Trial ending in exactly 3 days
    // We check for trials that end between 2 and 3 days from now
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const endingTrials = await this.prisma.organization.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.TRIALING,
        trialEndsAt: {
          gt: twoDaysFromNow,
          lt: inThreeDays,
        },
      },
      select: { id: true, trialEndsAt: true },
    });

    for (const org of endingTrials) {
      this.logger.log(`Sending trial warning to org ${org.id}`);
      await this.sendEmail(
        org.id,
        'Your TaxSentry free trial ends in 3 days',
        '<p>Your free trial of TaxSentry will expire in 3 days. Please upgrade to a paid plan to ensure uninterrupted access to your compliance dashboard.</p>'
      );
    }

    // 2. Cancelled subscriptions (ACTIVE but cancelAtPeriodEnd) ending in exactly 3 days
    const endingSubscriptions = await this.prisma.organization.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: {
          gt: twoDaysFromNow,
          lt: inThreeDays,
        },
      },
      select: { id: true },
    });

    for (const org of endingSubscriptions) {
      this.logger.log(`Sending cancellation warning to org ${org.id}`);
      await this.sendEmail(
        org.id,
        'Your TaxSentry subscription ends in 3 days',
        '<p>Your TaxSentry subscription is scheduled to be cancelled in 3 days. To restore access, please reactivate your plan from the billing dashboard.</p>'
      );
    }
  }
}
