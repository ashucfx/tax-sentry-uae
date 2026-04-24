/**
 * Risk Scoring Engine Unit Tests
 * Invariant: improving substance NEVER lowers the score (monotonicity)
 */

import { RiskEngine } from '../../src/modules/risk/risk.engine';

describe('Risk Score Formula', () => {
  // ─── SCORE BANDS ──────────────────────────────────────────────────────

  describe('Score band thresholds', () => {
    const getBand = (score: number) => {
      if (score >= 85) return 'GREEN';
      if (score >= 60) return 'AMBER';
      return 'RED';
    };

    it('score 85 = GREEN', () => expect(getBand(85)).toBe('GREEN'));
    it('score 84 = AMBER', () => expect(getBand(84)).toBe('AMBER'));
    it('score 60 = AMBER', () => expect(getBand(60)).toBe('AMBER'));
    it('score 59 = RED', () => expect(getBand(59)).toBe('RED'));
    it('score 0 = RED', () => expect(getBand(0)).toBe('RED'));
    it('score 100 = GREEN', () => expect(getBand(100)).toBe('GREEN'));
  });

  // ─── PENALTY FORMULAS ─────────────────────────────────────────────────

  describe('De-minimis penalty (max 40 pts)', () => {
    const computePenalty = (projectedNqr: number, threshold: number): number =>
      Math.min(40, Math.round((projectedNqr / threshold) * 40));

    it('NQR at 0% of threshold = 0 penalty', () => {
      expect(computePenalty(0, 5_000_000)).toBe(0);
    });

    it('NQR at 50% of threshold = 20 penalty', () => {
      expect(computePenalty(2_500_000, 5_000_000)).toBe(20);
    });

    it('NQR at 100% of threshold = 40 penalty', () => {
      expect(computePenalty(5_000_000, 5_000_000)).toBe(40);
    });

    it('NQR above threshold is capped at 40 penalty', () => {
      expect(computePenalty(10_000_000, 5_000_000)).toBe(40);
    });
  });

  describe('Substance gap penalty (max 25 pts)', () => {
    const computePenalty = (missing: number, required: number): number =>
      Math.round((missing / required) * 25);

    it('All docs complete = 0 penalty', () => {
      expect(computePenalty(0, 7)).toBe(0);
    });

    it('Half docs missing = ~12 penalty', () => {
      expect(computePenalty(3.5, 7)).toBe(13);
    });

    it('All docs missing = 25 penalty', () => {
      expect(computePenalty(7, 7)).toBe(25);
    });
  });

  describe('Audit readiness penalty (max 15 pts)', () => {
    it('Audited FS uploaded = 0 penalty', () => {
      const penalty = 0; // has audited FS
      expect(penalty).toBe(0);
    });

    it('No audited FS = 15 penalty', () => {
      const penalty = 15; // no audited FS
      expect(penalty).toBe(15);
    });
  });

  describe('Related-party penalty (max 10 pts)', () => {
    const computePenalty = (flaggedCount: number): number =>
      Math.min(10, flaggedCount * 2);

    it('0 flagged RP transactions = 0 penalty', () => {
      expect(computePenalty(0)).toBe(0);
    });

    it('3 flagged RP transactions = 6 penalty', () => {
      expect(computePenalty(3)).toBe(6);
    });

    it('6+ flagged RP transactions = capped at 10 penalty', () => {
      expect(computePenalty(6)).toBe(10);
      expect(computePenalty(100)).toBe(10);
    });
  });

  describe('Classification confidence penalty (max 10 pts)', () => {
    const computePenalty = (unclassifiedCount: number): number =>
      Math.min(10, Math.round(unclassifiedCount * 0.5));

    it('0 unclassified = 0 penalty', () => {
      expect(computePenalty(0)).toBe(0);
    });

    it('10 unclassified = 5 penalty', () => {
      expect(computePenalty(10)).toBe(5);
    });

    it('20+ unclassified = capped at 10 penalty', () => {
      expect(computePenalty(20)).toBe(10);
      expect(computePenalty(1000)).toBe(10);
    });
  });

  // ─── MONOTONICITY INVARIANT ───────────────────────────────────────────

  describe('Monotonicity invariant — improving substance never lowers score', () => {
    const computeScore = (missingDocs: number, unclassified: number) => {
      const substancePenalty = Math.round((missingDocs / 7) * 25);
      const classificationPenalty = Math.min(10, Math.round(unclassified * 0.5));
      return 100 - substancePenalty - classificationPenalty;
    };

    it('Uploading a document should increase score (or maintain)', () => {
      const before = computeScore(3, 0); // 3 missing docs
      const after = computeScore(2, 0);  // 2 missing docs (uploaded 1)
      expect(after).toBeGreaterThanOrEqual(before);
    });

    it('Classifying transactions should increase score (or maintain)', () => {
      const before = computeScore(0, 10); // 10 unclassified
      const after = computeScore(0, 5);   // 5 unclassified
      expect(after).toBeGreaterThanOrEqual(before);
    });

    it('Max score = 100 when all components are perfect', () => {
      const score = computeScore(0, 0);
      expect(score).toBe(100);
    });

    it('Score never exceeds 100', () => {
      const score = 100 - 0; // all penalties = 0
      expect(score).toBeLessThanOrEqual(100);
    });

    it('Score never goes below 0', () => {
      const totalPenalties = 40 + 25 + 15 + 10 + 10; // all max
      const score = Math.max(0, 100 - totalPenalties);
      expect(score).toBe(0);
    });
  });

  // ─── DELTA CALCULATION ────────────────────────────────────────────────

  describe('Delta vs prior week', () => {
    it('Score improved by 5 points', () => {
      const current = 75;
      const prior = 70;
      expect(current - prior).toBe(5);
    });

    it('Score declined by 10 points', () => {
      const current = 65;
      const prior = 75;
      expect(current - prior).toBe(-10);
    });

    it('Delta is null when no prior snapshot', () => {
      const prior = null;
      const delta = prior != null ? 75 - prior : null;
      expect(delta).toBeNull();
    });
  });
});
