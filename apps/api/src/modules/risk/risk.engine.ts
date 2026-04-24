/**
 * Risk Scoring Engine
 * Composite score 0–100 (higher = safer)
 * This is the single number the CFO shows the founder
 *
 * BANDS: 85+ Green | 60–84 Amber | <60 Red
 * INVARIANT: Improving substance NEVER lowers score (monotonicity)
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeMinimisEngine, DeMinimisBreakdown } from '../deminimis/deminimis.engine';
import Decimal from 'decimal.js';

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

@Injectable()
export class RiskEngine {
  private readonly logger = new Logger(RiskEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly deMinimisEngine: DeMinimisEngine,
  ) {}

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
    } else if (threshold >= 80) {
      reason = `AT RISK: NQI at ${pct}% of threshold (${dm.alertThresholdPct}% consumed). Projected breach likely.`;
    } else {
      reason = `De-minimis at ${pct}% NQI ratio. ${dm.alertThresholdPct}% of threshold consumed.`;
    }

    return { penalty, reason };
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
}
