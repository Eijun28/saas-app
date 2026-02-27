// lib/__tests__/matching/scoring.test.ts
// Tests unitaires du moteur de scoring Nuply Matching

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
  calculateCapacityScore,
  calculateTotalScore,
  FAIRNESS_CONFIG,
  type FairnessData,
  type ProviderCultureWithExpertise,
} from '../../matching/scoring';

// ─────────────────────────────────────────────────────────────────────────────
// CULTURAL SCORE (/30)
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateCulturalScore', () => {
  it('retourne 0 si le couple n\'a pas de cultures', () => {
    expect(calculateCulturalScore([], 'essential', ['maghrebin'])).toBe(0);
  });

  it('retourne 0 si le prestataire n\'a pas de cultures', () => {
    expect(calculateCulturalScore(['maghrebin'], 'essential', [])).toBe(0);
  });

  it('match parfait "essential" → 30 pts', () => {
    expect(
      calculateCulturalScore(['maghrebin', 'arabe'], 'essential', ['maghrebin', 'arabe'])
    ).toBe(30);
  });

  it('match parfait "important" → 25 pts', () => {
    expect(
      calculateCulturalScore(['maghrebin'], 'important', ['maghrebin'])
    ).toBe(25);
  });

  it('match parfait "nice_to_have" → 15 pts', () => {
    expect(
      calculateCulturalScore(['maghrebin'], 'nice_to_have', ['maghrebin'])
    ).toBe(15);
  });

  it('match partiel 50% essential → 15 pts', () => {
    expect(
      calculateCulturalScore(['maghrebin', 'arabe'], 'essential', ['maghrebin'])
    ).toBe(15);
  });

  it('aucun match → 0 pt', () => {
    expect(
      calculateCulturalScore(['maghrebin'], 'essential', ['africain'])
    ).toBe(0);
  });

  it('format avec expertise: spécialisé = 100%', () => {
    const providerCultures: ProviderCultureWithExpertise[] = [
      { culture_id: 'maghrebin', expertise_level: 'specialise' },
    ];
    expect(calculateCulturalScore(['maghrebin'], 'essential', providerCultures)).toBe(30);
  });

  it('format avec expertise: expérimenté = 60%', () => {
    const providerCultures: ProviderCultureWithExpertise[] = [
      { culture_id: 'maghrebin', expertise_level: 'experimente' },
    ];
    expect(calculateCulturalScore(['maghrebin'], 'essential', providerCultures)).toBe(18);
  });

  it('mix spécialisé + expérimenté → moyenne pondérée', () => {
    const providerCultures: ProviderCultureWithExpertise[] = [
      { culture_id: 'maghrebin', expertise_level: 'specialise' },
      { culture_id: 'arabe', expertise_level: 'experimente' },
    ];
    // (1.0 + 0.6) / 2 = 0.8 → 0.8 * 30 = 24
    expect(calculateCulturalScore(['maghrebin', 'arabe'], 'essential', providerCultures)).toBe(24);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUDGET SCORE (/20)
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateBudgetScore', () => {
  it('score neutre (10) si couple sans budget_max', () => {
    expect(calculateBudgetScore(undefined, undefined, 1000, 3000)).toBe(10);
  });

  it('score minimal (5) si prestataire sans budget_min', () => {
    expect(calculateBudgetScore(1000, 3000, undefined, undefined)).toBe(5);
  });

  it('score parfait (20) quand le prix moyen prestataire est dans la fourchette couple', () => {
    // couple: 1000-3000 / prestataire: 1500-2500 → avg prestataire = 2000 ∈ [1000,3000]
    expect(calculateBudgetScore(1000, 3000, 1500, 2500)).toBe(20);
  });

  it('bon score (15-20) quand les fourchettes se chevauchent largement', () => {
    // couple: 2000-4000 / prestataire: 1000-3000 → chevauchement 2000-3000 (50%)
    const score = calculateBudgetScore(2000, 4000, 1000, 3000);
    expect(score).toBeGreaterThanOrEqual(15);
    expect(score).toBeLessThanOrEqual(20);
  });

  it('score réduit si aucun chevauchement', () => {
    // couple: 500-1000 / prestataire: 3000-5000 → pas de chevauchement
    const score = calculateBudgetScore(500, 1000, 3000, 5000);
    expect(score).toBeLessThan(15);
  });

  it('pénalité plus forte avec "strict" qu\'avec "flexible"', () => {
    const strict = calculateBudgetScore(500, 1000, 3000, 5000, 'strict');
    const flexible = calculateBudgetScore(500, 1000, 3000, 5000, 'flexible');
    expect(strict).toBeLessThanOrEqual(flexible);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// REPUTATION SCORE (/20)
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateReputationScore', () => {
  it('score minimal (5) sans avis', () => {
    expect(calculateReputationScore(undefined, undefined)).toBe(5);
  });

  it('score maximal (20) avec 5/5 et 50+ avis', () => {
    expect(calculateReputationScore(5, 50)).toBe(20);
  });

  it('note 4/5 avec 20 avis → 16 pts', () => {
    // (4/5)*16 + 3 = 12.8 + 3 = 15.8 → 16
    expect(calculateReputationScore(4, 20)).toBe(16);
  });

  it('note 3/5 sans avis → score faible', () => {
    const score = calculateReputationScore(3, 0);
    expect(score).toBeLessThan(12);
  });

  it('bonus avis: 50+ = +4, 20-49 = +3, 10-19 = +2, 5-9 = +1', () => {
    const s50 = calculateReputationScore(4, 50);
    const s20 = calculateReputationScore(4, 20);
    const s10 = calculateReputationScore(4, 10);
    const s5 = calculateReputationScore(4, 5);
    expect(s50).toBeGreaterThan(s20);
    expect(s20).toBeGreaterThan(s10);
    expect(s10).toBeGreaterThan(s5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPERIENCE SCORE (/10)
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateExperienceScore', () => {
  it('score minimal (3) sans expérience', () => {
    expect(calculateExperienceScore(undefined)).toBe(3);
  });

  it('1 an = 1 pt', () => {
    expect(calculateExperienceScore(1)).toBe(1);
  });

  it('10+ ans = 10 pts (cap)', () => {
    expect(calculateExperienceScore(10)).toBe(10);
    expect(calculateExperienceScore(20)).toBe(10);
  });

  it('5 ans = 5 pts', () => {
    expect(calculateExperienceScore(5)).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION SCORE (/10)
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateLocationScore', () => {
  it('score neutre (5) si pas de localisation couple', () => {
    expect(calculateLocationScore(undefined, undefined, ['75'], 'Paris')).toBe(5);
  });

  it('match exact département → 10 pts', () => {
    expect(calculateLocationScore('75', undefined, ['75', '92'], 'Paris')).toBe(10);
  });

  it('match exact ville → 10 pts', () => {
    expect(calculateLocationScore(undefined, 'Lyon', [], 'Lyon')).toBe(10);
  });

  it('match ville insensible à la casse', () => {
    expect(calculateLocationScore(undefined, 'LYON', [], 'lyon')).toBe(10);
  });

  it('match région (même région, départements différents) → 6 pts', () => {
    // 75 et 77 sont tous les deux en Île-de-France
    expect(calculateLocationScore('75', undefined, ['77'], undefined)).toBe(6);
  });

  it('aucun match → 2 pts', () => {
    expect(calculateLocationScore('75', undefined, ['13'], undefined)).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TAGS SCORE (bonus 0-10)
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateTagsScore', () => {
  it('0 si couple sans tags', () => {
    expect(calculateTagsScore(undefined, ['moderne'])).toBe(0);
  });

  it('-2 si prestataire sans tags (et couple a des tags)', () => {
    expect(calculateTagsScore(['moderne'], undefined)).toBe(-2);
  });

  it('match parfait 100% → +10', () => {
    expect(calculateTagsScore(['moderne', 'chic'], ['moderne', 'chic', 'vintage'])).toBe(10);
  });

  it('match 75%+ → +8', () => {
    // 3/4 = 75%
    expect(calculateTagsScore(['a', 'b', 'c', 'd'], ['a', 'b', 'c'])).toBe(8);
  });

  it('match 50%+ → +5', () => {
    expect(calculateTagsScore(['a', 'b'], ['a'])).toBe(5);
  });

  it('match 25%+ → +2', () => {
    expect(calculateTagsScore(['a', 'b', 'c', 'd'], ['a'])).toBe(2);
  });

  it('aucun tag commun → 0', () => {
    expect(calculateTagsScore(['moderne'], ['vintage'])).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SPECIALTY SCORE (bonus 0-15)
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateSpecialtyScore', () => {
  it('0 si couple sans spécialités', () => {
    expect(calculateSpecialtyScore(undefined, ['lgbtq'])).toBe(0);
  });

  it('-3 si prestataire sans spécialités (et couple en demande)', () => {
    expect(calculateSpecialtyScore(['lgbtq'], undefined)).toBe(-3);
  });

  it('match parfait → +15', () => {
    expect(calculateSpecialtyScore(['lgbtq', 'religieux'], ['lgbtq', 'religieux'])).toBe(15);
  });

  it('match 75%+ → +12', () => {
    expect(calculateSpecialtyScore(['a', 'b', 'c', 'd'], ['a', 'b', 'c'])).toBe(12);
  });

  it('match 50%+ → +8', () => {
    expect(calculateSpecialtyScore(['a', 'b'], ['a'])).toBe(8);
  });

  it('match 25%+ → +4', () => {
    expect(calculateSpecialtyScore(['a', 'b', 'c', 'd'], ['a'])).toBe(4);
  });

  it('aucun match → 0', () => {
    expect(calculateSpecialtyScore(['lgbtq'], ['religieux'])).toBe(0);
  });

  it('insensible à la casse et aux espaces', () => {
    expect(calculateSpecialtyScore(['LGBTQ'], ['lgbtq'])).toBe(15);
    expect(calculateSpecialtyScore([' lgbtq '], ['lgbtq'])).toBe(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FAIRNESS MULTIPLIER (0.85 – 1.15)
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateFairnessMultiplier', () => {
  it('retourne 1.0 si pas de données d\'équité', () => {
    expect(calculateFairnessMultiplier(undefined)).toBe(1.0);
  });

  it('léger bonus (1.075) pour prestataire peu exposé', () => {
    const fairness: FairnessData = {
      impressions_this_week: 5, // < IMPRESSION_THRESHOLD (10)
      total_impressions: 5,
      fairness_score: 1.0,
      click_through_rate: 0.2,
    };
    const multiplier = calculateFairnessMultiplier(fairness);
    expect(multiplier).toBeGreaterThan(1.0);
    expect(multiplier).toBeLessThanOrEqual(1.15);
  });

  it('multiplicateur dans la plage [0.85, 1.15] pour prestataire exposé', () => {
    const fairness: FairnessData = {
      impressions_this_week: 50,
      total_impressions: 200,
      fairness_score: 0.5,
      click_through_rate: 0.1,
    };
    const multiplier = calculateFairnessMultiplier(fairness);
    expect(multiplier).toBeGreaterThanOrEqual(0.85);
    expect(multiplier).toBeLessThanOrEqual(1.15);
  });

  it('fairness_score bas → multiplicateur proche de 0.85', () => {
    const fairness: FairnessData = {
      impressions_this_week: 50,
      total_impressions: 200,
      fairness_score: FAIRNESS_CONFIG.MIN_FAIRNESS_SCORE, // 0.1
      click_through_rate: 0.05,
    };
    const multiplier = calculateFairnessMultiplier(fairness);
    // 0.85 + (0.1 * 0.3) = 0.85 + 0.03 = 0.88
    expect(multiplier).toBeCloseTo(0.88, 2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CTR BONUS (-3 → +5)
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateCTRBonus', () => {
  it('0 sans données', () => {
    expect(calculateCTRBonus(undefined)).toBe(0);
  });

  it('0 si moins de 20 impressions totales', () => {
    const d: FairnessData = { impressions_this_week: 5, total_impressions: 10, fairness_score: 1, click_through_rate: 0.3 };
    expect(calculateCTRBonus(d)).toBe(0);
  });

  it('+5 pour excellent CTR (>= 25%)', () => {
    const d: FairnessData = { impressions_this_week: 20, total_impressions: 100, fairness_score: 1, click_through_rate: 0.3 };
    expect(calculateCTRBonus(d)).toBe(5);
  });

  it('+3 pour bon CTR (15-24%)', () => {
    const d: FairnessData = { impressions_this_week: 20, total_impressions: 100, fairness_score: 1, click_through_rate: 0.18 };
    expect(calculateCTRBonus(d)).toBe(3);
  });

  it('0 pour CTR moyen (10-14%)', () => {
    const d: FairnessData = { impressions_this_week: 20, total_impressions: 100, fairness_score: 1, click_through_rate: 0.12 };
    expect(calculateCTRBonus(d)).toBe(0);
  });

  it('-2 pour CTR faible (5-9%)', () => {
    const d: FairnessData = { impressions_this_week: 20, total_impressions: 100, fairness_score: 1, click_through_rate: 0.07 };
    expect(calculateCTRBonus(d)).toBe(-2);
  });

  it('-3 pour CTR très faible (< 5%)', () => {
    const d: FairnessData = { impressions_this_week: 20, total_impressions: 100, fairness_score: 1, click_through_rate: 0.02 };
    expect(calculateCTRBonus(d)).toBe(-3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CAPACITY SCORE (/10)
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateCapacityScore', () => {
  it('0 si couple sans guest_count', () => {
    expect(calculateCapacityScore(undefined, 50, 200)).toBe(0);
  });

  it('0 si prestataire sans capacité renseignée', () => {
    expect(calculateCapacityScore(100, undefined, undefined)).toBe(0);
  });

  it('10 pts si dans la capacité', () => {
    expect(calculateCapacityScore(100, 50, 200)).toBe(10);
  });

  it('5 pts si légèrement sous le minimum (>= 80%)', () => {
    // 160 >= 200 * 0.8 = 160 → limite exacte → 5 pts
    expect(calculateCapacityScore(160, 200, 300)).toBe(5);
  });

  it('5 pts si légèrement au-dessus du max (+10%)', () => {
    expect(calculateCapacityScore(220, 50, 200)).toBe(5);
  });

  it('2 pts si +20% au-dessus du max', () => {
    expect(calculateCapacityScore(240, 50, 200)).toBe(2);
  });

  it('-5 pts si plus de 20% au-dessus du max', () => {
    expect(calculateCapacityScore(300, 50, 200)).toBe(-5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CALCULATE TOTAL SCORE (score global)
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateTotalScore', () => {
  const baseCriteria = {
    service_type: 'photographe',
    cultures: ['maghrebin'],
    cultural_importance: 'essential' as const,
    budget_min: 1500,
    budget_max: 3000,
    budget_flexibility: 'somewhat_flexible',
    wedding_department: '75',
    wedding_city: 'Paris',
    guest_count: 100,
    tags: ['moderne', 'chic'],
    specialty_tags: ['lgbtq'],
  };

  const perfectProvider = {
    cultures: ['maghrebin'],
    budget_min: 1500,
    budget_max: 3000,
    average_rating: 5,
    review_count: 50,
    annees_experience: 10,
    zones: ['75'],
    ville_principale: 'Paris',
    tags: ['moderne', 'chic'],
    specialty_tags: ['lgbtq'],
    guest_capacity_min: 50,
    guest_capacity_max: 200,
  };

  it('score final entre 0 et 100', () => {
    const { score } = calculateTotalScore(baseCriteria, perfectProvider);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('prestataire parfait → score très élevé (>= 85)', () => {
    const { score } = calculateTotalScore(baseCriteria, perfectProvider);
    expect(score).toBeGreaterThanOrEqual(85);
  });

  it('prestataire vide → score bas (< 25)', () => {
    const { score } = calculateTotalScore(baseCriteria, {});
    expect(score).toBeLessThan(25);
  });

  it('le breakdown contient tous les champs attendus', () => {
    const { breakdown } = calculateTotalScore(baseCriteria, perfectProvider);
    expect(breakdown).toHaveProperty('cultural_match');
    expect(breakdown).toHaveProperty('budget_match');
    expect(breakdown).toHaveProperty('reputation');
    expect(breakdown).toHaveProperty('experience');
    expect(breakdown).toHaveProperty('location_match');
    expect(breakdown).toHaveProperty('tags_match');
    expect(breakdown).toHaveProperty('specialty_match');
    expect(breakdown).toHaveProperty('final_score');
    expect(breakdown).toHaveProperty('total_algo');
    expect(breakdown).toHaveProperty('fairness_multiplier');
  });

  it('score_before_fairness = score_final si pas de données d\'équité', () => {
    const { breakdown } = calculateTotalScore(baseCriteria, perfectProvider);
    // Sans fairness_data, multiplier = 1.0 → score ajusté = score_before_fairness
    expect(breakdown.fairness_multiplier).toBe(1.0);
  });

  it('prestataire avec équité favorise les moins exposés', () => {
    const lessExposed = {
      ...perfectProvider,
      fairness_data: {
        impressions_this_week: 3,
        total_impressions: 10,
        fairness_score: 0.9,
        click_through_rate: 0.2,
      } as FairnessData,
    };
    const moreExposed = {
      ...perfectProvider,
      fairness_data: {
        impressions_this_week: 50,
        total_impressions: 500,
        fairness_score: 0.1,
        click_through_rate: 0.1,
      } as FairnessData,
    };
    const { score: scoreLess } = calculateTotalScore(baseCriteria, lessExposed);
    const { score: scoreMore } = calculateTotalScore(baseCriteria, moreExposed);
    expect(scoreLess).toBeGreaterThanOrEqual(scoreMore);
  });

  it('meilleur score avec match culturel + budget vs sans', () => {
    const withMatch = calculateTotalScore(baseCriteria, perfectProvider).score;
    const withoutMatch = calculateTotalScore(baseCriteria, {
      ...perfectProvider,
      cultures: ['africain'], // mauvais match culturel
      budget_min: 10000,      // budget hors fourchette
      budget_max: 20000,
    }).score;
    expect(withMatch).toBeGreaterThan(withoutMatch);
  });
});
