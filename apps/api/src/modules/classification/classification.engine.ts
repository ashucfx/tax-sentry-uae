/**
 * Revenue Classification Engine
 * Implements three-layer resolver as per Cabinet Decision 100/2023
 * and Ministerial Decision 265/2023 (Qualifying Activities)
 *
 * Rule Version: CD100-2023-v1
 * CRITICAL: A wrong classification can cost the client 9% tax on total profit
 */

import { Injectable, Logger } from '@nestjs/common';
import { Classification, CounterpartyType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const RULE_VERSION = 'CD100-2023-v1';

export interface ClassificationInput {
  activityCode: string;
  counterpartyType: CounterpartyType;
  amountAed: number;
  counterpartyName?: string;
  isRelatedParty?: boolean;
  isDesignatedZone?: boolean;
  description?: string;
}

export interface ClassificationResult {
  classification: Classification;
  confidence: number; // 0-100
  ruleVersion: string;
  layer: 1 | 2 | 3;
  reasoning: string;
  requiresReview: boolean;
  warnings: string[];
}

// Layer 1: Excluded activities — hardcoded from Cabinet Decision
// EXCLUDED income is NOT counted in de-minimis denominator
const EXCLUDED_ACTIVITY_CODES = new Set([
  'UAE_IMMOVABLE_PROPERTY',    // UAE-sourced immovable property income (non-FZP)
  'UAE_BRANCH_INCOME',         // Income from UAE branch of FZ entity
  'NON_COMMERCIAL_OUTSIDE_FZ', // Non-commercial activities outside Free Zone
  'BANKING_UNLICENSED',        // Banking without license
  'INSURANCE_UNLICENSED',      // Insurance without license
]);

// Layer 2: Qualifying Activities per Ministerial Decision 265/2023
// These CAN be QI if counterparty/transaction tests pass
const QUALIFYING_ACTIVITY_CODES = new Set([
  'MANUFACTURING',              // Manufacturing and processing of goods
  'PROCESSING_GOODS',          // Processing of goods
  'TRADING_COMMODITIES',       // Trading of qualifying commodities
  'HOLDING_SHARES',            // Holding of shares/securities (investment)
  'SHIP_OPERATIONS',           // Ownership/operation/management of ships
  'REINSURANCE',               // Reinsurance (regulated)
  'FUND_MANAGEMENT',           // Fund management (regulated)
  'WEALTH_MANAGEMENT',         // Wealth management (regulated)
  'HQ_SERVICES',               // HQ services to related parties
  'TREASURY_FINANCING',        // Treasury & financing services to related parties
  'AIRCRAFT_FINANCING',        // Financing and leasing of aircraft
  'LOGISTICS',                 // Logistics services
  'DISTRIBUTION_DESIGNATED',   // Distribution in/from designated zones
  'ANCILLARY_QI',              // Ancillary to qualifying activity (<5% of parent)
]);

// Activities that remain QI even with non-FZ counterparties (commodity trading exception)
const COMMODITY_TRADING_CODES = new Set([
  'TRADING_COMMODITIES',
  'DISTRIBUTION_DESIGNATED',
]);

// Activities that require the counterparty to be a Free Zone Person
const REQUIRES_FZP_COUNTERPARTY = new Set([
  'HQ_SERVICES',
  'TREASURY_FINANCING',
]);

@Injectable()
export class ClassificationEngine {
  private readonly logger = new Logger(ClassificationEngine.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Main classification resolver — three-layer check
   * Layer 1: Excluded → Layer 2: QI → Layer 3: Default NQI
   */
  classify(input: ClassificationInput): ClassificationResult {
    const warnings: string[] = [];

    // Validate input
    if (!input.activityCode) {
      return {
        classification: Classification.UNCLASSIFIED,
        confidence: 0,
        ruleVersion: RULE_VERSION,
        layer: 3,
        reasoning: 'No activity code provided — transaction queued for manual review',
        requiresReview: true,
        warnings: ['Missing activity code'],
      };
    }

    // Missing counterparty is a red flag
    if (!input.counterpartyName || input.counterpartyName === 'UNKNOWN') {
      warnings.push('Missing counterparty data — classification may be incorrect');
    }

    // ─── LAYER 1: EXCLUDED ACTIVITY CHECK ──────────────────────────
    if (EXCLUDED_ACTIVITY_CODES.has(input.activityCode)) {
      return {
        classification: Classification.EXCLUDED,
        confidence: 95,
        ruleVersion: RULE_VERSION,
        layer: 1,
        reasoning: `Activity "${input.activityCode}" is excluded per Cabinet Decision 100/2023. Not counted in de-minimis denominator.`,
        requiresReview: false,
        warnings,
      };
    }

    // ─── LAYER 2: QUALIFYING ACTIVITY CHECK ────────────────────────
    if (QUALIFYING_ACTIVITY_CODES.has(input.activityCode)) {
      const counterpartyResult = this.applyCounterpartyTest(input, warnings);
      return { ...counterpartyResult, layer: 2 };
    }

    // ─── LAYER 3: DEFAULT — NON-QUALIFYING INCOME ──────────────────
    warnings.push(
      `Activity "${input.activityCode}" not found in qualifying list — classified as NQI. ` +
      `Verify this is correct or add to activity catalog.`,
    );

    return {
      classification: Classification.NQI,
      confidence: 70,
      ruleVersion: RULE_VERSION,
      layer: 3,
      reasoning: `Default classification: activity "${input.activityCode}" does not match ` +
        `any qualifying or excluded activity. Falls to NQI per Layer 3 default.`,
      requiresReview: warnings.length > 0,
      warnings,
    };
  }

  /**
   * Counterparty / Transaction Tests
   * These are the critical edge cases most tools miss
   */
  private applyCounterpartyTest(
    input: ClassificationInput,
    warnings: string[],
  ): Omit<ClassificationResult, 'layer'> {
    const { activityCode, counterpartyType, isRelatedParty, isDesignatedZone } = input;

    // Related-party transactions: flag for Transfer Pricing review
    if (isRelatedParty || counterpartyType === CounterpartyType.RELATED) {
      warnings.push(
        'Related-party transaction: arm\'s length pricing required. Flagged for TP review.',
      );
    }

    // Commodity trading and distribution can be QI with non-FZ counterparties
    if (COMMODITY_TRADING_CODES.has(activityCode)) {
      if (activityCode === 'DISTRIBUTION_DESIGNATED' && !isDesignatedZone) {
        warnings.push(
          'Distribution income: goods must enter a Designated Zone. Verify DZ status.',
        );
        return {
          classification: Classification.NQI,
          confidence: 50,
          ruleVersion: RULE_VERSION,
          reasoning: 'Distribution activity requires Designated Zone — DZ status unconfirmed.',
          requiresReview: true,
          warnings,
        };
      }

      return {
        classification: Classification.QI,
        confidence: isRelatedParty ? 70 : 85,
        ruleVersion: RULE_VERSION,
        reasoning: `Commodity/distribution trading can qualify regardless of counterparty type per Ministerial Decision 265/2023.`,
        requiresReview: isRelatedParty === true,
        warnings,
      };
    }

    // HQ services and Treasury must be with related parties
    if (REQUIRES_FZP_COUNTERPARTY.has(activityCode)) {
      if (counterpartyType !== CounterpartyType.RELATED) {
        warnings.push(
          `"${activityCode}" typically requires related-party counterparty to qualify.`,
        );
        return {
          classification: Classification.NQI,
          confidence: 60,
          ruleVersion: RULE_VERSION,
          reasoning: `HQ/Treasury services to non-related parties generally classified as NQI.`,
          requiresReview: true,
          warnings,
        };
      }
    }

    // Non-FZ counterparty: most service activities = NQI (key rule)
    if (counterpartyType === CounterpartyType.THIRD_PARTY) {
      // Service activities with non-FZ persons are NQI
      const isServiceActivity = !COMMODITY_TRADING_CODES.has(activityCode);
      if (isServiceActivity) {
        warnings.push(
          'Service activity with non-Free Zone person: classified as NQI per FTA guidance.',
        );
        return {
          classification: Classification.NQI,
          confidence: 80,
          ruleVersion: RULE_VERSION,
          reasoning: `Service activity "${activityCode}" with non-Free Zone person = NQI. ` +
            `Only commodity trading may qualify with non-FZ counterparties.`,
          requiresReview: false,
          warnings,
        };
      }
    }

    // FZ-to-FZ transactions — beneficial recipient test assumed passed if declared
    return {
      classification: Classification.QI,
      confidence: isRelatedParty ? 75 : 90,
      ruleVersion: RULE_VERSION,
      reasoning: `Qualifying activity "${activityCode}" with Free Zone Person counterparty. ` +
        `Beneficial recipient test required for FZP-to-FZP transactions.`,
      requiresReview: isRelatedParty === true,
      warnings,
    };
  }

  /**
   * Bulk classify transactions — used for CSV imports and nightly sync
   */
  async bulkClassify(
    transactions: ClassificationInput[],
  ): Promise<ClassificationResult[]> {
    return transactions.map((tx) => this.classify(tx));
  }

  /**
   * Validate that an override is permissible and generate audit data
   */
  validateOverride(
    currentClassification: Classification,
    proposedClassification: Classification,
    reasonCode: string,
    reasonText: string,
  ): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (currentClassification === proposedClassification) {
      return { valid: false, warnings: ['No change in classification'] };
    }

    // Upgrading from NQI to QI needs strong justification
    if (
      currentClassification === Classification.NQI &&
      proposedClassification === Classification.QI
    ) {
      warnings.push(
        'CRITICAL: Reclassifying NQI → QI reduces de-minimis exposure. ' +
        'This change will affect compliance status. Ensure legal basis is documented.',
      );
    }

    if (!reasonCode || !reasonText || reasonText.length < 20) {
      return {
        valid: false,
        warnings: ['Override requires a reason code and detailed reason text (min 20 chars)'],
      };
    }

    return { valid: true, warnings };
  }
}
