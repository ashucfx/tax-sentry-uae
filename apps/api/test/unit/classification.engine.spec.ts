/**
 * Classification Engine Unit Tests
 * Target: 85% coverage on core logic
 * Tests per activity × counterparty-type combination
 */

import { Test } from '@nestjs/testing';
import {
  ClassificationEngine,
  ClassificationInput,
} from '../../src/modules/classification/classification.engine';
import { Classification, CounterpartyType } from '@prisma/client';
import { PrismaService } from '../../src/modules/prisma/prisma.service';

const mockPrisma = { activityCatalog: { findUnique: jest.fn() } };

describe('ClassificationEngine', () => {
  let engine: ClassificationEngine;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ClassificationEngine,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    engine = module.get<ClassificationEngine>(ClassificationEngine);
  });

  // ─── LAYER 1: EXCLUDED ACTIVITIES ───────────────────────────────────────

  describe('Layer 1 — Excluded Activities', () => {
    const excludedCodes = [
      'UAE_IMMOVABLE_PROPERTY',
      'UAE_BRANCH_INCOME',
      'NON_COMMERCIAL_OUTSIDE_FZ',
      'BANKING_UNLICENSED',
      'INSURANCE_UNLICENSED',
    ];

    excludedCodes.forEach((code) => {
      it(`should classify ${code} as EXCLUDED regardless of counterparty`, () => {
        const result = engine.classify({
          activityCode: code,
          counterpartyType: CounterpartyType.THIRD_PARTY,
          amountAed: 100000,
        });
        expect(result.classification).toBe(Classification.EXCLUDED);
        expect(result.layer).toBe(1);
        expect(result.confidence).toBeGreaterThanOrEqual(90);
      });

      it(`should classify ${code} as EXCLUDED even with related-party counterparty`, () => {
        const result = engine.classify({
          activityCode: code,
          counterpartyType: CounterpartyType.RELATED,
          amountAed: 500000,
          isRelatedParty: true,
        });
        expect(result.classification).toBe(Classification.EXCLUDED);
        expect(result.layer).toBe(1);
      });
    });
  });

  // ─── LAYER 2: QUALIFYING ACTIVITIES — FZP Counterparty ──────────────────

  describe('Layer 2 — Qualifying Activities with FZP counterparty', () => {
    const qualifyingCodes = [
      'MANUFACTURING',
      'PROCESSING_GOODS',
      'HOLDING_SHARES',
      'SHIP_OPERATIONS',
      'REINSURANCE',
      'FUND_MANAGEMENT',
      'LOGISTICS',
    ];

    qualifyingCodes.forEach((code) => {
      it(`should classify ${code} as NQI with third-party non-FZ counterparty`, () => {
        // Services with NON-FZ = NQI, but these may be QI with FZP
        // For FZP counterparties the test passes
        const result = engine.classify({
          activityCode: code,
          counterpartyType: CounterpartyType.THIRD_PARTY,
          amountAed: 200000,
          counterpartyName: 'Mainland_Customer_LLC',
        });
        // Non-FZ persons: service activities = NQI (critical rule)
        // FZP-to-FZP would need THIRD_PARTY to represent FZP here
        // By schema, we'd use THIRD_PARTY for FZP non-related — this gets NQI
        expect(result.classification).toBe(Classification.NQI);
        expect(result.layer).toBe(2);
        expect(result.reasoning).toContain('non-Free Zone person');
      });
    });
  });

  // ─── COMMODITY TRADING — Special Rule ───────────────────────────────────

  describe('Commodity Trading — QI regardless of counterparty type', () => {
    it('should classify TRADING_COMMODITIES as QI with non-FZ counterparty', () => {
      const result = engine.classify({
        activityCode: 'TRADING_COMMODITIES',
        counterpartyType: CounterpartyType.THIRD_PARTY,
        amountAed: 1000000,
        counterpartyName: 'UK_Importer_Ltd',
      });
      expect(result.classification).toBe(Classification.QI);
      expect(result.layer).toBe(2);
    });

    it('should classify TRADING_COMMODITIES as QI with related-party counterparty', () => {
      const result = engine.classify({
        activityCode: 'TRADING_COMMODITIES',
        counterpartyType: CounterpartyType.RELATED,
        amountAed: 500000,
        isRelatedParty: true,
      });
      expect(result.classification).toBe(Classification.QI);
      expect(result.warnings).toContain(expect.stringContaining('arm\'s length'));
    });
  });

  // ─── DISTRIBUTION — Designated Zone Requirement ─────────────────────────

  describe('Distribution — Designated Zone required', () => {
    it('should classify DISTRIBUTION_DESIGNATED as NQI when DZ not confirmed', () => {
      const result = engine.classify({
        activityCode: 'DISTRIBUTION_DESIGNATED',
        counterpartyType: CounterpartyType.THIRD_PARTY,
        amountAed: 300000,
        isDesignatedZone: false,
      });
      expect(result.classification).toBe(Classification.NQI);
      expect(result.requiresReview).toBe(true);
      expect(result.warnings).toContain(expect.stringContaining('Designated Zone'));
    });

    it('should classify DISTRIBUTION_DESIGNATED as QI when DZ is confirmed', () => {
      const result = engine.classify({
        activityCode: 'DISTRIBUTION_DESIGNATED',
        counterpartyType: CounterpartyType.THIRD_PARTY,
        amountAed: 300000,
        isDesignatedZone: true,
      });
      expect(result.classification).toBe(Classification.QI);
    });
  });

  // ─── HQ SERVICES — Must be Related Party ────────────────────────────────

  describe('HQ Services — counterparty restrictions', () => {
    it('should classify HQ_SERVICES as NQI with non-related third party', () => {
      const result = engine.classify({
        activityCode: 'HQ_SERVICES',
        counterpartyType: CounterpartyType.THIRD_PARTY,
        amountAed: 100000,
        isRelatedParty: false,
      });
      expect(result.classification).toBe(Classification.NQI);
    });

    it('should classify HQ_SERVICES as QI with related party', () => {
      const result = engine.classify({
        activityCode: 'HQ_SERVICES',
        counterpartyType: CounterpartyType.RELATED,
        amountAed: 100000,
        isRelatedParty: true,
      });
      expect(result.classification).toBe(Classification.QI);
      expect(result.warnings).toContain(expect.stringContaining('arm\'s length'));
    });
  });

  // ─── LAYER 3: DEFAULT NQI ────────────────────────────────────────────────

  describe('Layer 3 — Default NQI', () => {
    it('should classify unknown activity code as NQI', () => {
      const result = engine.classify({
        activityCode: 'CONSULTING_SERVICES',
        counterpartyType: CounterpartyType.THIRD_PARTY,
        amountAed: 75000,
      });
      expect(result.classification).toBe(Classification.NQI);
      expect(result.layer).toBe(3);
    });

    it('should classify RETAIL_SALES as NQI', () => {
      const result = engine.classify({
        activityCode: 'RETAIL_SALES',
        counterpartyType: CounterpartyType.THIRD_PARTY,
        amountAed: 50000,
      });
      expect(result.classification).toBe(Classification.NQI);
    });
  });

  // ─── MISSING DATA CASES ──────────────────────────────────────────────────

  describe('Missing / invalid data handling', () => {
    it('should return UNCLASSIFIED when no activity code provided', () => {
      const result = engine.classify({
        activityCode: '',
        counterpartyType: CounterpartyType.THIRD_PARTY,
        amountAed: 50000,
      });
      expect(result.classification).toBe(Classification.UNCLASSIFIED);
      expect(result.requiresReview).toBe(true);
      expect(result.confidence).toBe(0);
    });

    it('should warn but not crash when counterparty is UNKNOWN', () => {
      const result = engine.classify({
        activityCode: 'TRADING_COMMODITIES',
        counterpartyType: CounterpartyType.THIRD_PARTY,
        amountAed: 100000,
        counterpartyName: 'UNKNOWN',
      });
      expect(result.warnings).toContain(expect.stringContaining('Missing counterparty'));
      expect(result.classification).not.toBeUndefined();
    });
  });

  // ─── OVERRIDE VALIDATION ─────────────────────────────────────────────────

  describe('Override validation', () => {
    it('should reject override with same classification', () => {
      const result = engine.validateOverride(
        Classification.NQI,
        Classification.NQI,
        'REASON',
        'This is a valid reason text with enough length',
      );
      expect(result.valid).toBe(false);
    });

    it('should reject override with insufficient reason text', () => {
      const result = engine.validateOverride(
        Classification.NQI,
        Classification.QI,
        'REASON_CODE',
        'Too short',
      );
      expect(result.valid).toBe(false);
    });

    it('should warn when upgrading NQI to QI', () => {
      const result = engine.validateOverride(
        Classification.NQI,
        Classification.QI,
        'TP_CONFIRMED',
        'Transfer pricing documentation confirms arm\'s length pricing for this transaction.',
      );
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(expect.stringContaining('CRITICAL'));
    });

    it('should accept valid override with sufficient reason', () => {
      const result = engine.validateOverride(
        Classification.UNCLASSIFIED,
        Classification.NQI,
        'MANUAL_REVIEW',
        'Transaction reviewed by finance team and confirmed as non-qualifying consulting income.',
      );
      expect(result.valid).toBe(true);
    });
  });
});
