import {
  calculateCulturalScore,
  calculateBudgetScore,
  calculateReputationScore,
  calculateExperienceScore,
  calculateLocationScore,
  calculateTagsScore,
  calculateSpecialtyScore,
  calculateFairnessMultiplier,
  calculateCTRBonus,
  calculateTotalScore,
  enrichProviderWithFairness,
  FAIRNESS_CONFIG,
  type FairnessData,
  type ProviderCultureWithExpertise,
  type ProviderWithFairness,
} from '@/lib/matching/scoring';
import type { SearchCriteria } from '@/types/chatbot';

// ─── calculateCulturalScore ────────────────────────────────────────────────

describe('calculateCulturalScore', () => {
  it('returns 0 when couple has no cultures', () => {
    expect(calculateCulturalScore([], 'essential', ['maghrebin'])).toBe(0);
  });

  it('returns 0 when provider has no cultures', () => {
    expect(calculateCulturalScore(['maghrebin'], 'essential', [])).toBe(0);
  });

  it('returns max score for perfect match with essential importance', () => {
    expect(calculateCulturalScore(['maghrebin'], 'essential', ['maghrebin'])).toBe(30);
  });

  it('returns max score for perfect match with important importance', () => {
    expect(calculateCulturalScore(['maghrebin'], 'important', ['maghrebin'])).toBe(25);
  });

  it('returns max score for perfect match with nice_to_have', () => {
    expect(calculateCulturalScore(['maghrebin'], 'nice_to_have', ['maghrebin'])).toBe(15);
  });

  it('returns default weight (20) for unknown importance', () => {
    expect(calculateCulturalScore(['maghrebin'], 'unknown_level', ['maghrebin'])).toBe(20);
  });

  it('calculates partial match correctly with simple strings', () => {
    const score = calculateCulturalScore(
      ['maghrebin', 'indien'],
      'essential',
      ['maghrebin']
    );
    // 1 match / 2 cultures = 50% * 30 = 15
    expect(score).toBe(15);
  });

  it('handles expertise levels - specialise gets full weight', () => {
    const cultures: ProviderCultureWithExpertise[] = [
      { culture_id: 'maghrebin', expertise_level: 'specialise' },
    ];
    expect(calculateCulturalScore(['maghrebin'], 'essential', cultures)).toBe(30);
  });

  it('handles expertise levels - experimente gets 60% weight', () => {
    const cultures: ProviderCultureWithExpertise[] = [
      { culture_id: 'maghrebin', expertise_level: 'experimente' },
    ];
    // 0.6 / 1 * 30 = 18
    expect(calculateCulturalScore(['maghrebin'], 'essential', cultures)).toBe(18);
  });

  it('handles mixed expertise levels', () => {
    const cultures: ProviderCultureWithExpertise[] = [
      { culture_id: 'maghrebin', expertise_level: 'specialise' },
      { culture_id: 'indien', expertise_level: 'experimente' },
    ];
    // (1.0 + 0.6) / 2 * 30 = 24
    expect(
      calculateCulturalScore(['maghrebin', 'indien'], 'essential', cultures)
    ).toBe(24);
  });

  it('returns 0 when no cultures match with expertise format', () => {
    const cultures: ProviderCultureWithExpertise[] = [
      { culture_id: 'europeen', expertise_level: 'specialise' },
    ];
    expect(calculateCulturalScore(['maghrebin'], 'essential', cultures)).toBe(0);
  });
});

// ─── calculateBudgetScore ──────────────────────────────────────────────────

describe('calculateBudgetScore', () => {
  it('returns neutral score (10) when couple has no max budget', () => {
    expect(calculateBudgetScore(undefined, undefined, 1000, 2000)).toBe(10);
  });

  it('returns minimal score (5) when provider has no min budget', () => {
    expect(calculateBudgetScore(1000, 3000, undefined, undefined)).toBe(5);
  });

  it('returns 20 when provider average is within couple range', () => {
    // Provider 1000-2000, avg=1500. Couple 1000-3000 → avg in range → 20
    expect(calculateBudgetScore(1000, 3000, 1000, 2000)).toBe(20);
  });

  it('returns high score for large overlap', () => {
    // Ranges overlap substantially
    const score = calculateBudgetScore(1000, 5000, 2000, 4000);
    expect(score).toBeGreaterThanOrEqual(15);
  });

  it('returns low score when ranges do not overlap with strict flexibility', () => {
    // Couple 1000-2000, Provider 5000-10000 → no overlap, large distance
    const score = calculateBudgetScore(1000, 2000, 5000, 10000, 'strict');
    expect(score).toBeLessThanOrEqual(5);
  });

  it('penalizes less with flexible budget', () => {
    const strict = calculateBudgetScore(1000, 2000, 4000, 6000, 'strict');
    const flexible = calculateBudgetScore(1000, 2000, 4000, 6000, 'flexible');
    expect(flexible).toBeGreaterThanOrEqual(strict);
  });

  it('estimates provider max as 2x min when not provided', () => {
    // Provider min 1500, no max → estimated max = 3000
    // Couple 1000-4000 → overlap exists
    const score = calculateBudgetScore(1000, 4000, 1500, undefined);
    expect(score).toBeGreaterThanOrEqual(15);
  });

  it('defaults couple min to 0 when not provided', () => {
    const score = calculateBudgetScore(undefined, 3000, 1000, 2000);
    expect(score).toBeGreaterThanOrEqual(15);
  });

  it('never returns negative', () => {
    const score = calculateBudgetScore(100, 200, 100000, 200000, 'strict');
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

// ─── calculateReputationScore ──────────────────────────────────────────────

describe('calculateReputationScore', () => {
  it('returns 5 when no rating', () => {
    expect(calculateReputationScore(undefined, undefined)).toBe(5);
  });

  it('returns max score for 5/5 with 50+ reviews', () => {
    expect(calculateReputationScore(5, 50)).toBe(20);
  });

  it('calculates rating score correctly', () => {
    // 4/5 * 16 = 12.8, round = 13. 10 reviews → +2 bonus → 15
    expect(calculateReputationScore(4, 10)).toBe(15);
  });

  it('gives review bonus tiers correctly', () => {
    const base = Math.round((4.5 / 5) * 16); // 14
    expect(calculateReputationScore(4.5, 0)).toBe(base);       // +0
    expect(calculateReputationScore(4.5, 5)).toBe(base + 1);   // +1
    expect(calculateReputationScore(4.5, 10)).toBe(base + 2);  // +2
    expect(calculateReputationScore(4.5, 20)).toBe(base + 3);  // +3
    expect(calculateReputationScore(4.5, 50)).toBe(base + 4);  // +4
  });

  it('returns 5 when rating is 0 (falsy)', () => {
    expect(calculateReputationScore(0, 100)).toBe(5);
  });
});

// ─── calculateExperienceScore ──────────────────────────────────────────────

describe('calculateExperienceScore', () => {
  it('returns 3 when no experience', () => {
    expect(calculateExperienceScore(undefined)).toBe(3);
  });

  it('returns 3 when 0 years (falsy)', () => {
    expect(calculateExperienceScore(0)).toBe(3);
  });

  it('returns years directly for values <= 10', () => {
    expect(calculateExperienceScore(5)).toBe(5);
  });

  it('caps at 10', () => {
    expect(calculateExperienceScore(15)).toBe(10);
    expect(calculateExperienceScore(100)).toBe(10);
  });

  it('rounds fractional years', () => {
    expect(calculateExperienceScore(3.7)).toBe(4);
  });
});

// ─── calculateLocationScore ────────────────────────────────────────────────

describe('calculateLocationScore', () => {
  it('returns neutral score when couple has no location', () => {
    expect(calculateLocationScore(undefined, undefined, ['75'], 'Paris')).toBe(5);
  });

  it('returns 10 for exact department match', () => {
    expect(calculateLocationScore('75', undefined, ['75', '92'], undefined)).toBe(10);
  });

  it('returns 10 for exact city match (case insensitive)', () => {
    expect(calculateLocationScore(undefined, 'Paris', [], 'paris')).toBe(10);
  });

  it('returns 6 for approximate region match', () => {
    expect(calculateLocationScore('75-Paris', undefined, ['75-Île-de-France'], undefined)).toBe(6);
  });

  it('returns 2 for no location match', () => {
    expect(calculateLocationScore('75', 'Paris', ['13'], 'Marseille')).toBe(2);
  });
});

// ─── calculateTagsScore ────────────────────────────────────────────────────

describe('calculateTagsScore', () => {
  it('returns 0 when couple has no tags', () => {
    expect(calculateTagsScore(undefined, ['tag1'])).toBe(0);
    expect(calculateTagsScore([], ['tag1'])).toBe(0);
  });

  it('returns -2 when provider has no tags but couple does', () => {
    expect(calculateTagsScore(['tag1'], undefined)).toBe(-2);
    expect(calculateTagsScore(['tag1'], [])).toBe(-2);
  });

  it('returns 10 for 100% match', () => {
    expect(calculateTagsScore(['a', 'b'], ['a', 'b', 'c'])).toBe(10);
  });

  it('returns 8 for 75%+ match', () => {
    expect(calculateTagsScore(['a', 'b', 'c', 'd'], ['a', 'b', 'c'])).toBe(8);
  });

  it('returns 5 for 50%+ match', () => {
    expect(calculateTagsScore(['a', 'b', 'c', 'd'], ['a', 'b'])).toBe(5);
  });

  it('returns 2 for 25%+ match', () => {
    expect(calculateTagsScore(['a', 'b', 'c', 'd'], ['a'])).toBe(2);
  });

  it('returns 0 for no match', () => {
    expect(calculateTagsScore(['a', 'b'], ['x', 'y'])).toBe(0);
  });
});

// ─── calculateSpecialtyScore ───────────────────────────────────────────────

describe('calculateSpecialtyScore', () => {
  it('returns 0 when couple has no specialties', () => {
    expect(calculateSpecialtyScore(undefined, ['halal'])).toBe(0);
    expect(calculateSpecialtyScore([], ['halal'])).toBe(0);
  });

  it('returns -3 when provider has no specialties but couple does', () => {
    expect(calculateSpecialtyScore(['halal'], undefined)).toBe(-3);
    expect(calculateSpecialtyScore(['halal'], [])).toBe(-3);
  });

  it('returns 15 for perfect match', () => {
    expect(calculateSpecialtyScore(['halal', 'lgbtq'], ['halal', 'lgbtq'])).toBe(15);
  });

  it('normalizes slugs for comparison (case & trim)', () => {
    expect(calculateSpecialtyScore(['Halal '], [' halal'])).toBe(15);
  });

  it('returns correct tiers', () => {
    // 75%+ → 12
    expect(calculateSpecialtyScore(['a', 'b', 'c', 'd'], ['a', 'b', 'c'])).toBe(12);
    // 50%+ → 8
    expect(calculateSpecialtyScore(['a', 'b', 'c', 'd'], ['a', 'b'])).toBe(8);
    // 25%+ → 4
    expect(calculateSpecialtyScore(['a', 'b', 'c', 'd'], ['a'])).toBe(4);
    // 0% → 0
    expect(calculateSpecialtyScore(['a'], ['x'])).toBe(0);
  });
});

// ─── calculateFairnessMultiplier ───────────────────────────────────────────

describe('calculateFairnessMultiplier', () => {
  it('returns 1.0 when no fairness data', () => {
    expect(calculateFairnessMultiplier(undefined)).toBe(1.0);
  });

  it('returns bonus for low impressions (below threshold)', () => {
    const data: FairnessData = {
      impressions_this_week: 5,
      total_impressions: 10,
      fairness_score: 0.5,
      click_through_rate: 0.1,
    };
    const result = calculateFairnessMultiplier(data);
    // 1.0 + (0.15 * 0.5) = 1.075
    expect(result).toBeCloseTo(1.075);
  });

  it('uses fairness_score for high impression providers', () => {
    const data: FairnessData = {
      impressions_this_week: 20,
      total_impressions: 100,
      fairness_score: 1.0,
      click_through_rate: 0.15,
    };
    // 0.85 + (1.0 * 0.3) = 1.15
    expect(calculateFairnessMultiplier(data)).toBeCloseTo(1.15);
  });

  it('clamps fairness_score to MIN_FAIRNESS_SCORE', () => {
    const data: FairnessData = {
      impressions_this_week: 20,
      total_impressions: 100,
      fairness_score: 0.01, // below minimum (0.1)
      click_through_rate: 0.1,
    };
    // Should use 0.1 instead of 0.01 → 0.85 + (0.1 * 0.3) = 0.88
    expect(calculateFairnessMultiplier(data)).toBeCloseTo(0.88);
  });
});

// ─── calculateCTRBonus ─────────────────────────────────────────────────────

describe('calculateCTRBonus', () => {
  it('returns 0 when no fairness data', () => {
    expect(calculateCTRBonus(undefined)).toBe(0);
  });

  it('returns 0 when not enough impressions', () => {
    const data: FairnessData = {
      impressions_this_week: 5,
      total_impressions: 10,
      fairness_score: 0.5,
      click_through_rate: 0.25,
    };
    expect(calculateCTRBonus(data)).toBe(0);
  });

  it('returns correct bonuses by CTR tier', () => {
    const base = { impressions_this_week: 10, total_impressions: 50, fairness_score: 0.5 };
    expect(calculateCTRBonus({ ...base, click_through_rate: 0.30 })).toBe(5);
    expect(calculateCTRBonus({ ...base, click_through_rate: 0.15 })).toBe(3);
    expect(calculateCTRBonus({ ...base, click_through_rate: 0.10 })).toBe(0);
    expect(calculateCTRBonus({ ...base, click_through_rate: 0.05 })).toBe(-2);
    expect(calculateCTRBonus({ ...base, click_through_rate: 0.02 })).toBe(-3);
  });
});

// ─── calculateTotalScore ───────────────────────────────────────────────────

describe('calculateTotalScore', () => {
  const baseCriteria: SearchCriteria = {
    service_type: 'photographe',
    cultures: ['maghrebin'],
    cultural_importance: 'essential',
    budget_min: 1000,
    budget_max: 3000,
    wedding_department: '75',
    wedding_city: 'Paris',
  };

  const baseProvider: ProviderWithFairness = {
    cultures: ['maghrebin'],
    budget_min: 1500,
    budget_max: 2500,
    average_rating: 4.5,
    review_count: 25,
    annees_experience: 8,
    zones: ['75'],
    ville_principale: 'Paris',
  };

  it('calculates a total score with full breakdown', () => {
    const { score, breakdown } = calculateTotalScore(baseCriteria, baseProvider);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(breakdown.cultural_match).toBe(30);
    expect(breakdown.location_match).toBe(10);
    expect(breakdown.experience).toBe(8);
    expect(breakdown.final_score).toBe(score);
  });

  it('caps score at 100', () => {
    const superProvider: ProviderWithFairness = {
      ...baseProvider,
      average_rating: 5,
      review_count: 100,
      annees_experience: 20,
      tags: ['reportage'],
      specialty_tags: ['halal'],
      fairness_data: {
        impressions_this_week: 2,
        total_impressions: 50,
        fairness_score: 1.0,
        click_through_rate: 0.3,
      },
    };
    const criteria = {
      ...baseCriteria,
      tags: ['reportage'],
      specialty_tags: ['halal'],
    };
    const { score } = calculateTotalScore(criteria, superProvider);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('never returns negative', () => {
    const badProvider: ProviderWithFairness = {
      cultures: [],
      budget_min: 100000,
      budget_max: 200000,
      average_rating: 1,
      review_count: 0,
      annees_experience: 0,
      zones: [],
      ville_principale: 'Nowhere',
      tags: [],
      specialty_tags: [],
    };
    const criteria = {
      ...baseCriteria,
      tags: ['tag1'],
      specialty_tags: ['spec1'],
    };
    const { score } = calculateTotalScore(criteria, badProvider);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('applies fairness multiplier', () => {
    const withFairness: ProviderWithFairness = {
      ...baseProvider,
      fairness_data: {
        impressions_this_week: 50,
        total_impressions: 200,
        fairness_score: 0.1,
        click_through_rate: 0.02,
      },
    };
    const { breakdown } = calculateTotalScore(baseCriteria, withFairness);
    expect(breakdown.fairness_multiplier).toBeDefined();
    expect(breakdown.fairness_multiplier).toBeLessThan(1.0);
    expect(breakdown.score_before_fairness).toBeDefined();
  });
});

// ─── enrichProviderWithFairness ────────────────────────────────────────────

describe('enrichProviderWithFairness', () => {
  it('merges fairness data into provider', () => {
    const provider = { id: '1', name: 'Test' };
    const fairness: FairnessData = {
      impressions_this_week: 10,
      total_impressions: 50,
      fairness_score: 0.8,
      click_through_rate: 0.15,
    };
    const result = enrichProviderWithFairness(provider, fairness);
    expect(result.fairness_data).toEqual(fairness);
    expect((result as any).id).toBe('1');
  });

  it('sets fairness_data to undefined when null', () => {
    const result = enrichProviderWithFairness({ id: '1' }, null);
    expect(result.fairness_data).toBeUndefined();
  });
});
