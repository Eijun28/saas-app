/**
 * Tests pour l'algorithme de scoring du matching
 */

import {
  calculateCulturalScore,
  calculateBudgetScore,
  calculateReputationScore,
  FAIRNESS_CONFIG,
} from '@/lib/matching/scoring';

describe('Matching Scoring Algorithm', () => {
  describe('calculateCulturalScore', () => {
    it('should return 0 when couple has no cultures', () => {
      expect(calculateCulturalScore([], 'essential', ['maghreb'])).toBe(0);
    });

    it('should return 0 when provider has no cultures', () => {
      expect(calculateCulturalScore(['maghreb'], 'essential', [])).toBe(0);
    });

    it('should return max score (30) for essential perfect match with simple strings', () => {
      const score = calculateCulturalScore(
        ['maghreb', 'turc'],
        'essential',
        ['maghreb', 'turc']
      );
      expect(score).toBe(30);
    });

    it('should return 25 for important perfect match', () => {
      const score = calculateCulturalScore(
        ['maghreb'],
        'important',
        ['maghreb']
      );
      expect(score).toBe(25);
    });

    it('should return 15 for nice_to_have perfect match', () => {
      const score = calculateCulturalScore(
        ['maghreb'],
        'nice_to_have',
        ['maghreb']
      );
      expect(score).toBe(15);
    });

    it('should return partial score for partial match', () => {
      const score = calculateCulturalScore(
        ['maghreb', 'turc', 'libanais'],
        'essential',
        ['maghreb']
      );
      // 1/3 match * 30 = 10
      expect(score).toBe(10);
    });

    it('should score higher for specialise expertise', () => {
      const scoreSpecialise = calculateCulturalScore(
        ['maghreb'],
        'essential',
        [{ culture_id: 'maghreb', expertise_level: 'specialise' }]
      );
      const scoreExperimente = calculateCulturalScore(
        ['maghreb'],
        'essential',
        [{ culture_id: 'maghreb', expertise_level: 'experimente' }]
      );
      expect(scoreSpecialise).toBeGreaterThan(scoreExperimente);
    });

    it('should give 60% value for experimente expertise', () => {
      const score = calculateCulturalScore(
        ['maghreb'],
        'essential',
        [{ culture_id: 'maghreb', expertise_level: 'experimente' }]
      );
      // 0.6 * 30 = 18
      expect(score).toBe(18);
    });

    it('should handle mixed expertise levels', () => {
      const score = calculateCulturalScore(
        ['maghreb', 'turc'],
        'essential',
        [
          { culture_id: 'maghreb', expertise_level: 'specialise' },
          { culture_id: 'turc', expertise_level: 'experimente' },
        ]
      );
      // (1.0 + 0.6) / 2 * 30 = 24
      expect(score).toBe(24);
    });
  });

  describe('calculateBudgetScore', () => {
    it('should return 10 (neutral) when couple has no budget', () => {
      expect(calculateBudgetScore(undefined, undefined, 500, 1500)).toBe(10);
    });

    it('should return 5 when provider has no budget', () => {
      expect(calculateBudgetScore(500, 2000, undefined, undefined)).toBe(5);
    });

    it('should return 20 for perfect overlap', () => {
      const score = calculateBudgetScore(500, 2000, 800, 1500);
      expect(score).toBe(20);
    });

    it('should return 20 when provider avg is in couple range', () => {
      const score = calculateBudgetScore(500, 3000, 1000, 2000);
      expect(score).toBe(20);
    });

    it('should return low score for big gap with strict flexibility', () => {
      const score = calculateBudgetScore(500, 1000, 5000, 10000, 'strict');
      expect(score).toBeLessThan(5);
    });

    it('should be more forgiving with flexible budget', () => {
      const scoreStrict = calculateBudgetScore(500, 1000, 2000, 3000, 'strict');
      const scoreFlexible = calculateBudgetScore(500, 1000, 2000, 3000, 'flexible');
      expect(scoreFlexible).toBeGreaterThanOrEqual(scoreStrict);
    });

    it('should handle overlapping ranges', () => {
      const score = calculateBudgetScore(1000, 3000, 2000, 5000);
      expect(score).toBeGreaterThan(10);
    });
  });

  describe('calculateReputationScore', () => {
    it('should return 5 when no rating', () => {
      expect(calculateReputationScore(undefined, undefined)).toBe(5);
    });

    it('should return high score for 5 stars', () => {
      const score = calculateReputationScore(5, 10);
      expect(score).toBeGreaterThan(15);
    });

    it('should return moderate score for 3 stars', () => {
      const score = calculateReputationScore(3, 5);
      expect(score).toBeGreaterThan(5);
      expect(score).toBeLessThan(16);
    });

    it('should give bonus for more reviews', () => {
      const scoreFewReviews = calculateReputationScore(4, 2);
      const scoreManyReviews = calculateReputationScore(4, 20);
      expect(scoreManyReviews).toBeGreaterThanOrEqual(scoreFewReviews);
    });
  });

  describe('FAIRNESS_CONFIG', () => {
    it('should have fairness enabled', () => {
      expect(FAIRNESS_CONFIG.ENABLED).toBe(true);
    });

    it('should have reasonable weight (0-1)', () => {
      expect(FAIRNESS_CONFIG.FAIRNESS_WEIGHT).toBeGreaterThan(0);
      expect(FAIRNESS_CONFIG.FAIRNESS_WEIGHT).toBeLessThan(1);
    });

    it('should have minimum fairness score', () => {
      expect(FAIRNESS_CONFIG.MIN_FAIRNESS_SCORE).toBeGreaterThan(0);
    });

    it('should have impression threshold', () => {
      expect(FAIRNESS_CONFIG.IMPRESSION_THRESHOLD).toBeGreaterThan(0);
    });
  });
});
