/**
 * Risk Scoring Engine
 * Composite score 0–100 (higher = safer)
 * This is the single number the CFO shows the founder
 *
 * BANDS: 85+ Green | 60–84 Amber | <60 Red
 * INVARIANT: Improving substance NEVER lowers score (monotonicity)
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { DeMinimisEngine, DeMinimisBreakdown } from '../deminimis/deminimis.engine';
import Decimal from 'decimal.js';
import { SimulateRiskDto } from './dto/simulate-risk.dto';

export type RiskBand = 'GREEN' | 'AMBER' | 'RED';

export interface RiskScoreBreakdown {
  total: number;
  band: RiskBand;
  bandLabel: string;

  components: {
    deMinimis: {
      score: number;
      maxPenalty: 40;
      penalty: number;
      reason: string;
    };
    substance: {
      score: number;
      maxPenalty: 25;
      penalty: number;
      reason: string;
      missingDocs: string[];
    };
    auditReadiness: {
      score: number;
      maxPenalty: 15;
      penalty: number;
      reason: string;
    };
    relatedParty: {
      score: number;
      maxPenalty: 10;
      penalty: number;
      reason: string;
    };
    classificationConfidence: {
      score: number;
      maxPenalty: 10;
      penalty: number;
      reason: string;
    };
  };

  plainEnglishSummary: string;
  topRiskFactors: string[];
  recommendations: string[];
  deltaVsPrior: number | null;
}

export interface RiskScoreInput {
  orgId: string;
  taxPeriodId: string;
  periodStart: Date;
  periodEnd: Date;
  priorScore?: number | null;
}

// Required substance document types for QFZP
const REQUIRED_SUBSTANCE_DOCS = [
  { type: 'TRADE_LICENSE', label: 'Trade License' },
  { type: 'LEASE_AGREEMENT', label: 'Office Lease Agreement' },
  { type: 'EMIRATES_IDS', label: 'Emirates IDs of Qualified Employees' },
  { type: 'ORG_CHART', label: 'Organisation Chart' },
  { type: 'PAYROLL_REGISTER', label: 'Payroll Register' },
  { type: 'OPEX_SPLIT', label: 'OpEx Split Demonstrating UAE Substance' },
  { type: 'BOARD_MINUTES', label: 'Board Minutes (UAE Decision-Making)' },
];

import { Resend } from 'resend';

@Injectable()
export class RiskEngine {
  private readonly logger = new Logger(RiskEngine.name);
  private readonly resend: Resend;

  constructor(
    private readonly prisma: PrismaService,
    private readonly deMinimisEngine: DeMinimisEngine,
  ) {
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');
  }

  async calculate(input: RiskScoreInput): Promise<RiskScoreBreakdown> {
    const [deMinimisData, substanceData, auditData, relatedPartyData, classificationData] =
      await Promise.all([
        this.computeDeMinimisComponent(input),
        this.computeSubstanceComponent(input.orgId),
        this.computeAuditReadinessComponent(input.orgId),
        this.computeRelatedPartyComponent(input.orgId, input.taxPeriodId),
        this.computeClassificationConfidenceComponent(input.orgId, input.taxPeriodId),
      ]);

    const totalPenalty =
      deMinimisData.penalty +
      substanceData.penalty +
      auditData.penalty +
      relatedPartyData.penalty +
      classificationData.penalty;

    const total = Math.max(0, Math.min(100, 100 - totalPenalty));
    const band = this.getBand(total);
    const deltaVsPrior = input.priorScore != null ? total - input.priorScore : null;

    const topRiskFactors = this.extractTopRisks([
      deMinimisData,
      substanceData,
      auditData,
      relatedPartyData,
      classificationData,
    ]);

    const recommendations = this.generateRecommendations(
      deMinimisData,
      substanceData,
      auditData,
      relatedPartyData,
      classificationData,
    );

    const plainEnglishSummary = this.buildSummary(
      total,
      band,
      deltaVsPrior,
      topRiskFactors,
    );

    return {
      total,
      band,
      bandLabel: this.getBandLabel(band),
      components: {
        deMinimis: {
          score: 40 - deMinimisData.penalty,
          maxPenalty: 40,
          penalty: deMinimisData.penalty,
          reason: deMinimisData.reason,
        },
        substance: {
          score: 25 - substanceData.penalty,
          maxPenalty: 25,
          penalty: substanceData.penalty,
          reason: substanceData.reason,
          missingDocs: substanceData.missingDocs,
        },
        auditReadiness: {
          score: 15 - auditData.penalty,
          maxPenalty: 15,
          penalty: auditData.penalty,
          reason: auditData.reason,
        },
        relatedParty: {
          score: 10 - relatedPartyData.penalty,
          maxPenalty: 10,
          penalty: relatedPartyData.penalty,
          reason: relatedPartyData.reason,
        },
        classificationConfidence: {
          score: 10 - classificationData.penalty,
          maxPenalty: 10,
          penalty: classificationData.penalty,
          reason: classificationData.reason,
        },
      },
      plainEnglishSummary,
      topRiskFactors,
      recommendations,
      deltaVsPrior,
    };
  }

  // ─── COMPONENT: DE-MINIMIS (0–40 pts penalty) ──────────────────────────────
  private async computeDeMinimisComponent(input: RiskScoreInput): Promise<{
    penalty: number;
    reason: string;
  }> {
    const dm = await this.deMinimisEngine.calculate({
      orgId: input.orgId,
      taxPeriodId: input.taxPeriodId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    });

    // penalty = min(40, (projected_NQR / threshold) × 40)
    const thresholdForRatio = Decimal.min(
      new Decimal(5_000_000),
      dm.totalRevenue.mul(5).div(100),
    );

    let ratio = new Decimal(0);
    if (!thresholdForRatio.isZero() && dm.projectedNqrAmount) {
      ratio = dm.projectedNqrAmount.div(thresholdForRatio);
    } else if (!thresholdForRatio.isZero()) {
      ratio = dm.nqrAmount.div(thresholdForRatio);
    }

    const penalty = Math.min(40, Math.round(ratio.mul(40).toNumber()));
    const pct = dm.nqrPercentage.toFixed(2);
    const threshold = dm.alertThresholdPct;

    let reason: string;
    if (dm.isBreached) {
      reason = `BREACHED: NQI at ${pct}% of total revenue. Entity has lost QFZP status for this period.`;
      await this.sendAlertEmail(input.orgId, 'CRITICAL: De-Minimis Breach', reason);
    } else if (threshold >= 80) {
      reason = `AT RISK: NQI at ${pct}% of threshold (${dm.alertThresholdPct}% consumed). Projected breach likely.`;
      await this.sendAlertEmail(input.orgId, 'WARNING: De-Minimis Threshold Approaching 80%', reason);
    } else {
      reason = `De-minimis at ${pct}% NQI ratio. ${dm.alertThresholdPct}% of threshold consumed.`;
    }

    return { penalty, reason };
  }

  private async sendAlertEmail(orgId: string, subject: string, message: string) {
    const owner = await this.prisma.user.findFirst({
      where: { orgId, role: 'OWNER', isActive: true },
      select: { email: true },
    });

    if (!owner?.email) {
      this.logger.warn(`No active OWNER found for org ${orgId} — cannot send alert: ${subject}`);
      return;
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === 're_placeholder' || apiKey.startsWith('re_dummy')) {
      this.logger.warn(`Resend not configured — would have sent "${subject}" to ${owner.email}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'hello@gettaxsentry.com',
        to: owner.email,
        subject,
        text: message,
      });
      this.logger.log(`Alert email sent to ${owner.email} for org ${orgId}`);
    } catch (e) {
      this.logger.error(`Failed to send alert email to ${owner.email}: ${(e as Error).message}`);
    }
  }

  // ─── COMPONENT: SUBSTANCE (0–25 pts penalty) ───────────────────────────────
  private async computeSubstanceComponent(orgId: string): Promise<{
    penalty: number;
    reason: string;
    missingDocs: string[];
  }> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const docs = await this.prisma.substanceDocument.findMany({
      where: { orgId, isDeleted: false },
      select: { docType: true, status: true, expiresAt: true },
    });

    const docMap = new Map(docs.map((d) => [d.docType, d]));
    const missingDocs: string[] = [];
    let missingOrExpiredCount = 0;

    for (const required of REQUIRED_SUBSTANCE_DOCS) {
      const doc = docMap.get(required.type);
      if (!doc) {
        missingDocs.push(`${required.label} — MISSING`);
        missingOrExpiredCount++;
      } else if (doc.status === 'EXPIRED') {
        missingDocs.push(`${required.label} — EXPIRED`);
        missingOrExpiredCount++;
      } else if (
        doc.expiresAt &&
        doc.expiresAt <= thirtyDaysFromNow
      ) {
        missingDocs.push(`${required.label} — EXPIRING SOON`);
        missingOrExpiredCount += 0.5; // partial penalty for expiring
      }
    }

    const total = REQUIRED_SUBSTANCE_DOCS.length;
    const penalty = Math.round((missingOrExpiredCount / total) * 25);

    const reason =
      missingOrExpiredCount === 0
        ? 'All substance documents are current and valid.'
        : `${missingDocs.length} document(s) missing, expired, or expiring soon.`;

    return { penalty, reason, missingDocs };
  }

  // ─── COMPONENT: AUDIT READINESS (0–15 pts) ─────────────────────────────────
  private async computeAuditReadinessComponent(orgId: string): Promise<{
    penalty: number;
    reason: string;
  }> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const auditedFS = await this.prisma.substanceDocument.findFirst({
      where: {
        orgId,
        docType: 'AUDITED_FINANCIAL_STATEMENTS',
        isDeleted: false,
        uploadedAt: { gte: oneYearAgo },
      },
    });

    if (!auditedFS) {
      return {
        penalty: 15,
        reason:
          'No audited financial statements uploaded in the last 12 months. ' +
          'Audited FS are mandatory for QFZP status — automatic disqualification risk.',
      };
    }

    return {
      penalty: 0,
      reason: `Audited financial statements on file (uploaded ${auditedFS.uploadedAt.toISOString().slice(0, 10)}).`,
    };
  }

  // ─── COMPONENT: RELATED-PARTY (0–10 pts) ───────────────────────────────────
  private async computeRelatedPartyComponent(
    orgId: string,
    taxPeriodId: string,
  ): Promise<{ penalty: number; reason: string }> {
    const flaggedCount = await this.prisma.revenueTransaction.count({
      where: {
        orgId,
        taxPeriodId,
        counterpartyType: 'RELATED',
        isDeleted: false,
        // No TP note = no override documenting arm's length
        overrides: { none: {} },
      },
    });

    // min(10, flagged_RP_transactions_without_TP_note × 2)
    const penalty = Math.min(10, flaggedCount * 2);

    return {
      penalty,
      reason:
        flaggedCount === 0
          ? 'No unflagged related-party transactions.'
          : `${flaggedCount} related-party transaction(s) without Transfer Pricing documentation.`,
    };
  }

  // ─── COMPONENT: CLASSIFICATION CONFIDENCE (0–10 pts) ───────────────────────
  private async computeClassificationConfidenceComponent(
    orgId: string,
    taxPeriodId: string,
  ): Promise<{ penalty: number; reason: string }> {
    const unclassifiedCount = await this.prisma.revenueTransaction.count({
      where: {
        orgId,
        taxPeriodId,
        classification: 'UNCLASSIFIED',
        isDeleted: false,
      },
    });

    // unclassified_transactions × 0.5, capped at 10
    const penalty = Math.min(10, Math.round(unclassifiedCount * 0.5));

    return {
      penalty,
      reason:
        unclassifiedCount === 0
          ? 'All transactions are classified.'
          : `${unclassifiedCount} unclassified transaction(s) — review required.`,
    };
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  private getBand(score: number): RiskBand {
    if (score >= 85) return 'GREEN';
    if (score >= 60) return 'AMBER';
    return 'RED';
  }

  private getBandLabel(band: RiskBand): string {
    return { GREEN: 'Safe', AMBER: 'At Risk', RED: 'Critical' }[band];
  }

  private extractTopRisks(
    components: Array<{ penalty: number; reason: string }>,
  ): string[] {
    return components
      .filter((c) => c.penalty > 0)
      .sort((a, b) => b.penalty - a.penalty)
      .slice(0, 3)
      .map((c) => c.reason);
  }

  private generateRecommendations(
    deMinimis: { penalty: number; reason: string },
    substance: { penalty: number; missingDocs: string[]; reason: string },
    audit: { penalty: number; reason: string },
    relatedParty: { penalty: number; reason: string },
    classification: { penalty: number; reason: string },
  ): string[] {
    const recs: string[] = [];

    if (deMinimis.penalty >= 20) {
      recs.push('Review and reclassify NQI transactions — de-minimis threshold at risk.');
    }
    if (substance.missingDocs.length > 0) {
      recs.push(`Upload missing documents: ${substance.missingDocs.slice(0, 2).join(', ')}`);
    }
    if (audit.penalty > 0) {
      recs.push('Upload audited financial statements to maintain QFZP eligibility.');
    }
    if (relatedParty.penalty > 0) {
      recs.push('Document arm\'s length pricing for related-party transactions.');
    }
    if (classification.penalty > 0) {
      recs.push('Classify pending transactions to improve score accuracy.');
    }

    return recs;
  }

  private buildSummary(
    score: number,
    band: RiskBand,
    delta: number | null,
    topRisks: string[],
  ): string {
    const deltaText =
      delta !== null
        ? delta > 0
          ? ` (+${delta} vs last week)`
          : delta < 0
          ? ` (${delta} vs last week)`
          : ' (unchanged vs last week)'
        : '';

    const bandText =
      band === 'GREEN'
        ? 'Your QFZP status is protected.'
        : band === 'AMBER'
        ? 'Your QFZP status requires attention.'
        : 'Your QFZP status is at serious risk.';

    const primaryRisk = topRisks[0] ? ` Primary risk: ${topRisks[0]}` : '';

    return `Risk score: ${score}/100${deltaText}. ${bandText}${primaryRisk}`;
  }

  // ─── CRON JOB: AUTOMATIC WEEKLY SNAPSHOTS ──────────────────────────────────
  @Cron(CronExpression.EVERY_WEEK)
  async runWeeklySnapshots() {
    this.logger.log('Starting automatic weekly risk snapshots for all active organizations...');
    const orgs = await this.prisma.organization.findMany({ where: { isActive: true } });
    
    for (const org of orgs) {
      try {
        await this.createSnapshotForOrg(org.id);
      } catch (e) {
        this.logger.error(`Failed to create risk snapshot for org ${org.id}: ${(e as Error).message}`);
      }
    }
    this.logger.log('Finished weekly risk snapshots.');
  }

  async getRiskBreakdown(orgId: string, component: string) {
    const validComponents = ['deMinimis', 'substance', 'classification', 'relatedParty', 'auditReadiness'];
    if (!validComponents.includes(component)) {
      throw new BadRequestException(
        `Invalid component. Must be one of: ${validComponents.join(', ')}`,
      );
    }

    const snapshot = await this.prisma.riskSnapshot.findFirst({
      where: { orgId },
      orderBy: { snapshotDate: 'desc' },
    });

    if (!snapshot) throw new NotFoundException('No risk snapshot found for this organisation');

    const breakdown = snapshot.breakdownJson as Record<string, any>;

    const componentMap: Record<string, string> = {
      deMinimis: 'deMinimis',
      substance: 'substance',
      classification: 'classificationConfidence',
      relatedParty: 'relatedParty',
      auditReadiness: 'auditReadiness',
    };

    const snapshotKey = componentMap[component];
    const componentData = breakdown[snapshotKey] ?? null;

    let contributingTransactions: any[] = [];

    const period = await this.prisma.taxPeriod.findFirst({
      where: { orgId, status: 'OPEN' },
      orderBy: { startDate: 'desc' },
    });

    if (period) {
      if (component === 'classification') {
        contributingTransactions = await this.prisma.revenueTransaction.findMany({
          where: { orgId, taxPeriodId: period.id, classification: 'NQI', isDeleted: false },
          orderBy: { amountAed: 'desc' },
          take: 5,
          select: {
            id: true,
            date: true,
            amountAed: true,
            counterparty: true,
            counterpartyType: true,
            classification: true,
            description: true,
            invoiceNo: true,
          },
        });
      } else if (component === 'relatedParty') {
        contributingTransactions = await this.prisma.revenueTransaction.findMany({
          where: {
            orgId,
            taxPeriodId: period.id,
            counterpartyType: 'RELATED',
            isDeleted: false,
            overrides: { none: {} },
          },
          orderBy: { amountAed: 'desc' },
          take: 5,
          select: {
            id: true,
            date: true,
            amountAed: true,
            counterparty: true,
            counterpartyType: true,
            classification: true,
            description: true,
            invoiceNo: true,
          },
        });
      }
    }

    return {
      component,
      snapshotDate: snapshot.snapshotDate,
      overallScore: snapshot.score,
      componentData,
      contributingTransactions,
    };
  }

  async simulateRisk(orgId: string, dto: SimulateRiskDto) {
    const period = await this.prisma.taxPeriod.findFirst({
      where: { orgId, status: 'OPEN' },
      orderBy: { startDate: 'desc' },
    });

    if (!period) throw new NotFoundException('No open tax period found');

    const priorSnapshot = await this.prisma.riskSnapshot.findFirst({
      where: { orgId },
      orderBy: { snapshotDate: 'desc' },
    });

    const reclassifyIds = dto.reclassifyTransactionIds ?? [];
    let nqiAdjustment = new Decimal(0);
    let qiAdjustment = new Decimal(0);

    if (reclassifyIds.length > 0) {
      const txns = await this.prisma.revenueTransaction.findMany({
        where: {
          id: { in: reclassifyIds },
          orgId,
          taxPeriodId: period.id,
          isDeleted: false,
        },
        select: { id: true, amountAed: true, classification: true },
      });

      for (const txn of txns) {
        if (txn.classification === 'NQI') {
          nqiAdjustment = nqiAdjustment.minus(new Decimal(txn.amountAed.toString()));
          qiAdjustment = qiAdjustment.plus(new Decimal(txn.amountAed.toString()));
        }
      }
    }

    const aggregates = await this.prisma.revenueTransaction.groupBy({
      by: ['classification'],
      where: { orgId, taxPeriodId: period.id, isDeleted: false },
      _sum: { amountAed: true },
    });

    let baseNqi = new Decimal(0);
    let baseTotal = new Decimal(0);
    for (const row of aggregates) {
      const amount = new Decimal(row._sum.amountAed?.toString() ?? '0');
      if (row.classification === 'NQI') baseNqi = baseNqi.plus(amount);
      if (row.classification === 'QI' || row.classification === 'NQI') {
        baseTotal = baseTotal.plus(amount);
      }
    }

    const simulatedNqi = baseNqi
      .plus(nqiAdjustment)
      .plus(new Decimal(dto.additionalNqiRevenue ?? 0));
    const simulatedTotal = baseTotal
      .plus(qiAdjustment)
      .plus(new Decimal(dto.additionalRevenue ?? 0))
      .plus(new Decimal(dto.additionalNqiRevenue ?? 0));

    const DE_MINIMIS_ABS = new Decimal(5_000_000);
    const DE_MINIMIS_PCT = new Decimal(5);

    let deMinimisSimPenalty = 0;
    if (!simulatedTotal.isZero()) {
      const nqrPct = simulatedNqi.div(simulatedTotal).mul(100);
      const effectiveThreshold = Decimal.min(DE_MINIMIS_ABS, simulatedTotal.mul(DE_MINIMIS_PCT).div(100));
      const ratio = effectiveThreshold.isZero() ? new Decimal(0) : simulatedNqi.div(effectiveThreshold);
      deMinimisSimPenalty = Math.min(40, Math.round(ratio.mul(40).toNumber()));
    }

    const [substanceData, auditData, relatedPartyData, classificationData] = await Promise.all([
      this.computeSubstanceComponent(orgId),
      this.computeAuditReadinessComponent(orgId),
      this.computeRelatedPartyComponent(orgId, period.id),
      this.computeClassificationConfidenceComponentSimulated(orgId, period.id, reclassifyIds),
    ]);

    const totalPenalty =
      deMinimisSimPenalty +
      substanceData.penalty +
      auditData.penalty +
      relatedPartyData.penalty +
      classificationData.penalty;

    const simulatedScore = Math.max(0, Math.min(100, 100 - totalPenalty));
    const currentScore = priorSnapshot?.score ?? null;

    return {
      simulatedScore,
      currentScore,
      delta: currentScore !== null ? simulatedScore - currentScore : null,
      band: this.getBand(simulatedScore),
      bandLabel: this.getBandLabel(this.getBand(simulatedScore)),
      components: {
        deMinimis: { penalty: deMinimisSimPenalty, score: 40 - deMinimisSimPenalty },
        substance: { penalty: substanceData.penalty, score: 25 - substanceData.penalty },
        auditReadiness: { penalty: auditData.penalty, score: 15 - auditData.penalty },
        relatedParty: { penalty: relatedPartyData.penalty, score: 10 - relatedPartyData.penalty },
        classificationConfidence: { penalty: classificationData.penalty, score: 10 - classificationData.penalty },
      },
      hypotheticals: {
        additionalRevenue: dto.additionalRevenue ?? 0,
        additionalNqiRevenue: dto.additionalNqiRevenue ?? 0,
        reclassifiedTransactionCount: reclassifyIds.length,
      },
    };
  }

  private async computeClassificationConfidenceComponentSimulated(
    orgId: string,
    taxPeriodId: string,
    excludeFromUnclassified: string[],
  ): Promise<{ penalty: number; reason: string }> {
    const where: any = {
      orgId,
      taxPeriodId,
      classification: 'UNCLASSIFIED',
      isDeleted: false,
    };

    if (excludeFromUnclassified.length > 0) {
      where.id = { notIn: excludeFromUnclassified };
    }

    const unclassifiedCount = await this.prisma.revenueTransaction.count({ where });
    const penalty = Math.min(10, Math.round(unclassifiedCount * 0.5));

    return {
      penalty,
      reason:
        unclassifiedCount === 0
          ? 'All transactions are classified.'
          : `${unclassifiedCount} unclassified transaction(s) — review required.`,
    };
  }

  async createSnapshotForOrg(orgId: string) {
    const period = await this.prisma.taxPeriod.findFirst({
      where: { orgId, status: 'OPEN' },
      orderBy: { startDate: 'desc' },
    });

    if (!period) return; // Silent skip

    const priorSnapshot = await this.prisma.riskSnapshot.findFirst({
      where: { orgId },
      orderBy: { snapshotDate: 'desc' },
    });

    const breakdown = await this.calculate({
      orgId,
      taxPeriodId: period.id,
      periodStart: period.startDate,
      periodEnd: period.endDate,
      priorScore: priorSnapshot?.score ?? null,
    });

    await this.prisma.riskSnapshot.create({
      data: {
        orgId,
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
        nqrAmount: 0,
        totalRevenue: 0,
        nqrPercentage: 0,
      },
    });
  }
}
