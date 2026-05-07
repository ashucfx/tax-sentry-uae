import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsEngine } from './alerts.engine';
import { DeMinimisEngine } from '../deminimis/deminimis.engine';
import { RiskEngine } from '../risk/risk.engine';

@Injectable()
export class AlertsScheduler {
  private readonly logger = new Logger(AlertsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsEngine: AlertsEngine,
    private readonly deMinimisEngine: DeMinimisEngine,
    private readonly riskEngine: RiskEngine,
  ) {}

  /**
   * Daily: run de-minimis checks for all organizations with open periods
   * Fires at 8:00 AM UAE time (GST = UTC+4 → 04:00 UTC)
   */
  @Cron('0 4 * * *', { timeZone: 'UTC' })
  async runDailyAlertChecks() {
    this.logger.log('Running daily alert checks...');

    const orgs = await this.prisma.organization.findMany({
      where: {
        isActive: true,
        taxPeriods: { some: { status: 'OPEN' } },
      },
      select: {
        id: true,
        taxPeriods: {
          where: { status: 'OPEN' },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    });

    let processed = 0;
    let errors = 0;

    for (const org of orgs) {
      const period = org.taxPeriods[0];
      if (!period) continue;

      try {
        const breakdown = await this.deMinimisEngine.calculate({
          orgId: org.id,
          taxPeriodId: period.id,
          periodStart: period.startDate,
          periodEnd: period.endDate,
        });

        await this.alertsEngine.evaluateDeMinimisAlerts(org.id, breakdown);
        await this.alertsEngine.evaluateSubstanceAlerts(org.id);
        processed++;
      } catch (err) {
        this.logger.error(`Alert check failed for org ${org.id}: ${(err as Error).message}`);
        errors++;
      }
    }

    this.logger.log(`Daily alerts: ${processed} orgs processed, ${errors} errors`);

    // Expire trials that have passed their end date
    const expiredTrials = await this.prisma.organization.updateMany({
      where: {
        subscriptionStatus: 'TRIALING',
        trialEndsAt: { lt: new Date() },
      },
      data: { subscriptionStatus: 'EXPIRED' },
    });
    if (expiredTrials.count > 0) {
      this.logger.log(`Expired ${expiredTrials.count} trial(s)`);
    }
  }

  /**
   * Weekly: snapshot risk scores for trend line
   * Fires Monday 7:00 AM UAE time (03:00 UTC)
   */
  @Cron('0 3 * * 1', { timeZone: 'UTC' })
  async snapshotWeeklyRiskScores() {
    this.logger.log('Snapshotting weekly risk scores...');

    const orgs = await this.prisma.organization.findMany({
      where: { isActive: true },
      select: {
        id: true,
        taxPeriods: {
          where: { status: 'OPEN' },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    });

    for (const org of orgs) {
      const period = org.taxPeriods[0];
      if (!period) continue;

      try {
        const priorSnapshot = await this.prisma.riskSnapshot.findFirst({
          where: { orgId: org.id },
          orderBy: { snapshotDate: 'desc' },
        });

        const breakdown = await this.riskEngine.calculate({
          orgId: org.id,
          taxPeriodId: period.id,
          periodStart: period.startDate,
          periodEnd: period.endDate,
          priorScore: priorSnapshot?.score ?? null,
        });
        const deMinimis = await this.deMinimisEngine.calculate({
          orgId: org.id,
          taxPeriodId: period.id,
          periodStart: period.startDate,
          periodEnd: period.endDate,
        });

        await this.prisma.riskSnapshot.create({
          data: {
            orgId: org.id,
            snapshotDate: new Date(),
            score: breakdown.total,
            bandColor: breakdown.band,
            deMinimisScore: breakdown.components.deMinimis.score,
            substanceScore: breakdown.components.substance.score,
            auditReadinessScore: breakdown.components.auditReadiness.score,
            relatedPartyScore: breakdown.components.relatedParty.score,
            classificationScore: breakdown.components.classificationConfidence.score,
            breakdownJson: breakdown.components as object,
            explanationText: breakdown.plainEnglishSummary,
            deltaVsPrior: breakdown.deltaVsPrior,
            nqrAmount: deMinimis.nqrAmount.toFixed(2),
            totalRevenue: deMinimis.totalRevenue.toFixed(2),
            nqrPercentage: deMinimis.nqrPercentage.toFixed(4),
            projectedNqrAmount: deMinimis.projectedNqrAmount?.toFixed(2) ?? null,
            projectedNqrPct: deMinimis.projectedNqrPct?.toFixed(4) ?? null,
          },
        });
      } catch (err) {
        this.logger.error(`Risk snapshot failed for org ${org.id}: ${(err as Error).message}`);
      }
    }
  }

  /**
   * Daily: purge expired and long-revoked sessions to keep the table lean.
   * Runs at 1:00 AM UTC — before the alert checks at 2:00 AM.
   */
  @Cron('0 1 * * *', { timeZone: 'UTC' })
  async cleanExpiredSessions() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },                           // token TTL elapsed
          { isRevoked: true, revokedAt: { lt: thirtyDaysAgo } },       // revoked > 30 days ago
        ],
      },
    });

    if (result.count > 0) {
      this.logger.log(`Session cleanup: removed ${result.count} expired/revoked sessions`);
    }
  }

  /**
   * Daily: update substance document expiry statuses
   */
  @Cron('0 2 * * *', { timeZone: 'UTC' })
  async updateDocumentExpiryStatuses() {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Mark expired
    await this.prisma.substanceDocument.updateMany({
      where: { expiresAt: { lt: now }, isDeleted: false, status: { not: 'EXPIRED' } },
      data: { status: 'EXPIRED' },
    });

    // Mark expiring soon
    await this.prisma.substanceDocument.updateMany({
      where: {
        expiresAt: { gte: now, lte: thirtyDays },
        isDeleted: false,
        status: 'ACTIVE',
      },
      data: { status: 'EXPIRING_SOON' },
    });

    this.logger.log('Document expiry statuses updated');
  }
}
