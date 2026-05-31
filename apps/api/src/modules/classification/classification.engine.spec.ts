import { ClassificationEngine } from './classification.engine';
import { PrismaService } from '../prisma/prisma.service';
import { Classification, CounterpartyType } from '@prisma/client';

describe('ClassificationEngine', () => {
  let engine: ClassificationEngine;
  let prisma: PrismaService;

  beforeEach(() => {
    // Mock prisma service
    prisma = {} as any;
    engine = new ClassificationEngine(prisma);
  });

  describe('Layer 1: Excluded Activities (CD100-2023)', () => {
    it('should immediately classify UAE_IMMOVABLE_PROPERTY as EXCLUDED', () => {
      const result = engine.classify({
        activityCode: 'UAE_IMMOVABLE_PROPERTY',
        counterpartyType: CounterpartyType.THIRD_PARTY,
        amountAed: 100000,
        counterpartyName: 'Dubai Real Estate LLC',
      });

      expect(result.classification).toBe(Classification.EXCLUDED);
      expect(result.layer).toBe(1);
      expect(result.requiresReview).toBe(false);
    });
  });

  describe('Layer 2: Qualifying Activities', () => {
    it('should classify COMMODITY_TRADING with THIRD_PARTY as QI', () => {
      const result = engine.classify({
        activityCode: 'TRADING_COMMODITIES',
        counterpartyType: CounterpartyType.THIRD_PARTY,
        amountAed: 500000,
        counterpartyName: 'Global Commodities Ltd',
      });

      expect(result.classification).toBe(Classification.QI);
      expect(result.layer).toBe(2);
      expect(result.requiresReview).toBe(false); // No review required for third party
    });

    it('should flag COMMODITY_TRADING with RELATED party for TP review', () => {
      const result = engine.classify({
        activityCode: 'TRADING_COMMODITIES',
        counterpartyType: CounterpartyType.RELATED,
        amountAed: 500000,
        counterpartyName: 'Subsidiary LLC',
        isRelatedParty: true,
      });

      expect(result.classification).toBe(Classification.QI);
      expect(result.layer).toBe(2);
      expect(result.requiresReview).toBe(true);
      expect(result.warnings.some(w => w.includes('Arm\'s length pricing required') || w.includes('TP review'))).toBe(true);
    });

    it('should classify DISTRIBUTION_DESIGNATED as NQI if NOT in a Designated Zone', () => {
      const result = engine.classify({
        activityCode: 'DISTRIBUTION_DESIGNATED',
        counterpartyType: CounterpartyType.THIRD_PARTY,
        amountAed: 10000,
        counterpartyName: 'Mainland Dist',
        isDesignatedZone: false,
      });

      expect(result.classification).toBe(Classification.NQI);
      expect(result.layer).toBe(2);
      expect(result.requiresReview).toBe(true);
      expect(result.warnings.some(w => w.includes('Designated Zone'))).toBe(true);
    });

    it('should classify HQ_SERVICES with THIRD_PARTY as NQI (requires related party)', () => {
      const result = engine.classify({
        activityCode: 'HQ_SERVICES',
        counterpartyType: CounterpartyType.THIRD_PARTY,
        amountAed: 100000,
        counterpartyName: 'Random Client',
      });

      expect(result.classification).toBe(Classification.NQI);
      expect(result.layer).toBe(2);
      expect(result.requiresReview).toBe(true);
    });

    it('should classify HQ_SERVICES with RELATED party as QI', () => {
      const result = engine.classify({
        activityCode: 'HQ_SERVICES',
        counterpartyType: CounterpartyType.RELATED,
        amountAed: 100000,
        counterpartyName: 'Subsidiary Client',
        isRelatedParty: true,
      });

      expect(result.classification).toBe(Classification.QI);
      expect(result.layer).toBe(2);
      // It is related party, so requires TP review
      expect(result.requiresReview).toBe(true);
    });

    it('should classify general service (e.g., FUND_MANAGEMENT) with FZP counterparty as QI', () => {
      const result = engine.classify({
        activityCode: 'FUND_MANAGEMENT',
        counterpartyType: CounterpartyType.THIRD_PARTY,
        amountAed: 200000,
        counterpartyName: 'Another FZ LLC',
        isFreeZonePerson: true,
      });

      expect(result.classification).toBe(Classification.QI);
      expect(result.layer).toBe(2);
      expect(result.requiresReview).toBe(false);
    });

    it('should classify general service (e.g., FUND_MANAGEMENT) with Non-FZP counterparty as NQI', () => {
      const result = engine.classify({
        activityCode: 'FUND_MANAGEMENT',
        counterpartyType: CounterpartyType.THIRD_PARTY, // Mainland
        amountAed: 200000,
        counterpartyName: 'Mainland Client LLC',
      });

      expect(result.classification).toBe(Classification.NQI);
      expect(result.layer).toBe(2);
      expect(result.warnings.some(w => w.includes('Service activity with non-Free Zone person'))).toBe(true);
    });
  });

  describe('Layer 3: Default (NQI)', () => {
    it('should classify unknown activities as NQI', () => {
      const result = engine.classify({
        activityCode: 'RANDOM_UNMAPPED_ACTIVITY',
        counterpartyType: CounterpartyType.THIRD_PARTY,
        amountAed: 5000,
        counterpartyName: 'FZ Client',
      });

      expect(result.classification).toBe(Classification.NQI);
      expect(result.layer).toBe(3);
      expect(result.requiresReview).toBe(true);
      expect(result.warnings.some(w => w.includes('not found in qualifying list'))).toBe(true);
    });
  });

  describe('Edge Cases & Validation', () => {
    it('should queue for review if activityCode is missing', () => {
      const result = engine.classify({
        activityCode: '',
        counterpartyType: CounterpartyType.THIRD_PARTY,
        amountAed: 100,
      });

      expect(result.classification).toBe(Classification.UNCLASSIFIED);
      expect(result.requiresReview).toBe(true);
      expect(result.warnings.some(w => w.includes('Missing activity code'))).toBe(true);
    });

    it('should warn if counterpartyName is UNKNOWN', () => {
      const result = engine.classify({
        activityCode: 'FUND_MANAGEMENT',
        counterpartyType: CounterpartyType.THIRD_PARTY,
        amountAed: 100,
        counterpartyName: 'UNKNOWN',
      });

      expect(result.warnings.some(w => w.includes('Missing counterparty data'))).toBe(true);
    });
  });

  describe('validateOverride', () => {
    it('should flag NQI to QI overrides as CRITICAL', () => {
      const result = engine.validateOverride(
        Classification.NQI,
        Classification.QI,
        'LEGAL_ADVICE',
        'We received tax advice confirming this is QI because of XYZ.',
      );

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('CRITICAL: Reclassifying NQI → QI'))).toBe(true);
    });

    it('should reject overrides without sufficient reasoning text', () => {
      const result = engine.validateOverride(
        Classification.NQI,
        Classification.EXCLUDED,
        'O1',
        'too short',
      );

      expect(result.valid).toBe(false);
      expect(result.warnings.some(w => w.includes('min 20 chars'))).toBe(true);
    });
  });
});
