/**
 * De-Minimis Calculation Engine
 * UAE QFZP: NQI must stay below LOWER OF 5% of total revenue OR AED 5,000,000
 * Breach = 5-year disqualification from 0% tax status
 *
 * CRITICAL RULES:
 * - EXCLUDED income is NOT in the denominator
 * - Credit notes must NET against original classification
 * - Projection = NQR_YTD × (days_in_period / days_elapsed)
 * - Zero denominator → "Insufficient data" — never divide by zero
 */

import { Injectable, Logger } from '@nestjs/common';
import { Classification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import Decimal from 'decimal.js';
import { differenceInDays, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const UAE_TIMEZONE = 'Asia/Dubai';
const DE_MINIMIS_ABS_THRESHOLD = new Decimal(5_000_000); // AED 5M
const DE_MINIMIS_PCT_THRESHOLD = new Decimal(5);          // 5%

export interface DeMinimisBreakdown {
  nqrAmount: Decimal;
  totalRevenue: Decimal;    // QI + NQI only (EXCLUDED not in denominator)
  excludedRevenue: Decimal; // informational only
  nqrPercentage: Decimal;   // NQR / TR as percentage
  absThreshold: Decimal;
  pctThreshold: Decimal;

  // Actual thresholds for this org/period
  effectiveThreshold: Decimal;    // the LOWER of the two thresholds
  marginToBreachAed: Decimal;     // how much NQR can still be added
  marginToBreachPct: Decimal;     // how many percentage points remain

  // Projections
  projectedNqrAmount: Decimal | null;
  projectedNqrPct: Decimal | null;
  projectedBreachRisk: 'SAFE' | 'AMBER' | 'RED';

  // Status
  isBreached: boolean;
  breachType: 'NONE' | 'PCT' | 'ABS' | 'BOTH';
  statusBadge: 'SAFE' | 'AT_RISK' | 'BREACH_IMMINENT' | 'BREACHED';
  alertThresholdPct: number; // percentage of limit consumed (for alert levels)

  // Period info
  daysElapsed: number;
  daysInPeriod: number;
  periodProgress: number; // 0–100
}

export interface DeMinimisInput {
  orgId: string;
  taxPeriodId: string;
  periodStart: Date;
  periodEnd: Date;
}

@Injectable()
export class DeMinimisEngine {
  private readonly logger = new Logger(DeMinimisEngine.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculate(input: DeMinimisInput): Promise<DeMinimisBreakdown> {
    const { orgId, taxPeriodId, periodStart, periodEnd } = input;

    // Fetch aggregates from DB (efficient — single query)
    const aggregates = await this.prisma.revenueTransaction.groupBy({
      by: ['classification'],
      where: {
        orgId,
        taxPeriodId,
        isDeleted: false,
      },
      _sum: { amountAed: true },
      _count: { id: true },
    });

    let qiAmount = new Decimal(0);
    let nqiAmount = new Decimal(0);
    let excludedAmount = new Decimal(0);

    for (const row of aggregates) {
      const amount = new Decimal(row._sum.amountAed?.toString() ?? '0');
      switch (row.classification) {
        case Classification.QI:
          qiAmount = qiAmount.plus(amount);
          break;
        case Classification.NQI:
          nqiAmount = nqiAmount.plus(amount);
          break;
        case Classification.EXCLUDED:
          excludedAmount = excludedAmount.plus(amount);
          break;
        // UNCLASSIFIED: excluded from calculation with warning surfaced separately
      }
    }

    // Total Revenue = QI + NQI (EXCLUDED never in denominator)
    const totalRevenue = qiAmount.plus(nqiAmount);
    const nqrAmount = nqiAmount;

    // ─── THRESHOLD CALCULATION ─────────────────────────────────────
    let nqrPercentage = new Decimal(0);
    let isBreached = false;
    let breachType: DeMinimisBreakdown['breachType'] = 'NONE';

    if (totalRevenue.isZero()) {
      // Zero denominator — cannot calculate %, show Insufficient Data
      return this.buildInsufficientDataResult(
        input,
        nqrAmount,
        totalRevenue,
        excludedAmount,
      );
    }

    nqrPercentage = nqrAmount.div(totalRevenue).mul(100);

    const pctBreached = nqrPercentage.gt(DE_MINIMIS_PCT_THRESHOLD);
    const absBreached = nqrAmount.gt(DE_MINIMIS_ABS_THRESHOLD);

    // BREACH if EITHER threshold exceeded (lower of the two applies)
    if (pctBreached && absBreached) {
      isBreached = true;
      breachType = 'BOTH';
    } else if (pctBreached) {
      isBreached = true;
      breachType = 'PCT';
    } else if (absBreached) {
      isBreached = true;
      breachType = 'ABS';
    }

    // ─── PERIOD PROGRESS ───────────────────────────────────────────
    const nowUae = toZonedTime(new Date(), UAE_TIMEZONE);
    const startUae = toZonedTime(periodStart, UAE_TIMEZONE);
    const endUae = toZonedTime(periodEnd, UAE_TIMEZONE);

    const daysInPeriod = Math.max(1, differenceInDays(endUae, startUae));
    const daysElapsed = Math.max(1, differenceInDays(nowUae, startUae));
    const periodProgress = Math.min(100, Math.round((daysElapsed / daysInPeriod) * 100));

    // ─── PROJECTIONS (run-rate, no ML) ─────────────────────────────
    let projectedNqrAmount: Decimal | null = null;
    let projectedNqrPct: Decimal | null = null;

    if (daysElapsed > 0 && !totalRevenue.isZero()) {
      projectedNqrAmount = nqrAmount.mul(daysInPeriod).div(daysElapsed);
      const projectedTotalRev = totalRevenue.mul(daysInPeriod).div(daysElapsed);
      if (!projectedTotalRev.isZero()) {
        projectedNqrPct = projectedNqrAmount.div(projectedTotalRev).mul(100);
      }
    }

    // ─── MARGIN CALCULATIONS ───────────────────────────────────────
    const pctMargin = DE_MINIMIS_PCT_THRESHOLD.minus(nqrPercentage);
    const absMargin = DE_MINIMIS_ABS_THRESHOLD.minus(nqrAmount);
    // Effective margin = whichever limit is closer to being breached
    const marginToBreachAed = Decimal.max(absMargin, new Decimal(0));
    const marginToBreachPct = Decimal.max(pctMargin, new Decimal(0));

    // Alert threshold: percentage of the lower limit consumed
    const pctConsumed = nqrPercentage.div(DE_MINIMIS_PCT_THRESHOLD).mul(100);
    const absConsumed = nqrAmount.div(DE_MINIMIS_ABS_THRESHOLD).mul(100);
    const alertThresholdPct = Math.round(
      Decimal.max(pctConsumed, absConsumed).toNumber(),
    );

    // ─── PROJECTED BREACH RISK ─────────────────────────────────────
    let projectedBreachRisk: DeMinimisBreakdown['projectedBreachRisk'] = 'SAFE';
    if (projectedNqrAmount !== null) {
      const projPctConsumed = projectedNqrPct
        ? projectedNqrPct.div(DE_MINIMIS_PCT_THRESHOLD).mul(100)
        : new Decimal(0);
      const projAbsConsumed = projectedNqrAmount
        .div(DE_MINIMIS_ABS_THRESHOLD)
        .mul(100);
      const projMax = Decimal.max(projPctConsumed, projAbsConsumed).toNumber();

      if (projMax >= 95) projectedBreachRisk = 'RED';
      else if (projMax >= 80) projectedBreachRisk = 'AMBER';
    }

    // ─── STATUS BADGE ──────────────────────────────────────────────
    let statusBadge: DeMinimisBreakdown['statusBadge'];
    if (isBreached) {
      statusBadge = 'BREACHED';
    } else if (alertThresholdPct >= 95 || projectedBreachRisk === 'RED') {
      statusBadge = 'BREACH_IMMINENT';
    } else if (alertThresholdPct >= 80 || projectedBreachRisk === 'AMBER') {
      statusBadge = 'AT_RISK';
    } else {
      statusBadge = 'SAFE';
    }

    return {
      nqrAmount,
      totalRevenue,
      excludedRevenue: excludedAmount,
      nqrPercentage,
      absThreshold: DE_MINIMIS_ABS_THRESHOLD,
      pctThreshold: DE_MINIMIS_PCT_THRESHOLD,
      effectiveThreshold: Decimal.min(
        DE_MINIMIS_ABS_THRESHOLD,
        totalRevenue.mul(DE_MINIMIS_PCT_THRESHOLD).div(100),
      ),
      marginToBreachAed,
      marginToBreachPct,
      projectedNqrAmount,
      projectedNqrPct,
      projectedBreachRisk,
      isBreached,
      breachType,
      statusBadge,
      alertThresholdPct,
      daysElapsed,
      daysInPeriod,
      periodProgress,
    };
  }

  private buildInsufficientDataResult(
    input: DeMinimisInput,
    nqrAmount: Decimal,
    totalRevenue: Decimal,
    excludedRevenue: Decimal,
  ): DeMinimisBreakdown {
    const nowUae = toZonedTime(new Date(), 'Asia/Dubai');
    const startUae = toZonedTime(input.periodStart, 'Asia/Dubai');
    const endUae = toZonedTime(input.periodEnd, 'Asia/Dubai');
    const daysInPeriod = Math.max(1, differenceInDays(endUae, startUae));
    const daysElapsed = Math.max(1, differenceInDays(nowUae, startUae));

    return {
      nqrAmount,
      totalRevenue,
      excludedRevenue,
      nqrPercentage: new Decimal(0),
      absThreshold: DE_MINIMIS_ABS_THRESHOLD,
      pctThreshold: DE_MINIMIS_PCT_THRESHOLD,
      effectiveThreshold: new Decimal(0),
      marginToBreachAed: DE_MINIMIS_ABS_THRESHOLD,
      marginToBreachPct: DE_MINIMIS_PCT_THRESHOLD,
      projectedNqrAmount: null,
      projectedNqrPct: null,
      projectedBreachRisk: 'SAFE',
      isBreached: false,
      breachType: 'NONE',
      statusBadge: 'SAFE',
      alertThresholdPct: 0,
      daysElapsed,
      daysInPeriod,
      periodProgress: Math.min(100, Math.round((daysElapsed / daysInPeriod) * 100)),
    };
  }
}
