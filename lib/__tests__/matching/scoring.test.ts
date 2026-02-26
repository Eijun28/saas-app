/**
 * Tests unitaires — lib/matching/scoring.ts
 *
 * Vérifie que l'algorithme de scoring NUPLY produit les bons résultats
 * sur des cas concrets : cultural match, budget, réputation, localisation,
 * tags, spécialités, équité, score global.
 */

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
} from '../../matching/scoring';

// ─────────────────────────────────────────────────────────────────────────────
// calculateCulturalScore
// ─────────────────────────────────────────────────────────────────────────────

describe(`calculateCulturalScore`, () => {
  it(`retourne 0 si le couple n'a pas de culture`, () => {
    expect(calculateCulturalScore([], 'essential', ['marocaine', 'algerienne'])).toBe(0);
  });

  it(`retourne 0 si le prestataire n'a pas de culture`, () => {
    expect(calculateCulturalScore(['marocaine'], 'essential', [])).toBe(0);
  });

  it(`match parfait essential → 30 points`, () => {
    expect(calculateCulturalScore(['marocaine'], 'essential', ['marocaine'])).toBe(30);
  });

  it(`match parfait important → 25 points`, () => {
    expect(calculateCulturalScore(['marocaine'], 'important', ['marocaine'])).toBe(25);
  });

  it(`match parfait nice_to_have → 15 points`, () => {
    expect(calculateCulturalScore(['marocaine'], 'nice_to_have', ['marocaine'])).toBe(15);
  });

  it(`match partiel (1 sur 2 cultures) → 50% du max`, () => {
    const score = calculateCulturalScore(
      ['marocaine', 'algerienne'],
      'essential',
      ['marocaine']
    );
    expect(score).toBe(15); // 50% × 30
  });

  it(`aucun match culturel → 0 points`, () => {
    expect(
      calculateCulturalScore(['indienne'], 'essential', ['marocaine', 'algerienne'])
    ).toBe(0);
  });

  it(`avec expertise: specialise → score plein`, () => {
    const score = calculateCulturalScore(
      ['marocaine'],
      'essential',
      [{ culture_id: 'marocaine', expertise_level: 'specialise' }]
    );
    expect(score).toBe(30);
  });

  it(`avec expertise: experimente → 60% du score plein`, () => {
    const score = calculateCulturalScore(
      ['marocaine'],
      'essential',
      [{ culture_id: 'marocaine', expertise_level: 'experimente' }]
    );
    expect(score).toBe(Math.round(0.6 * 30));
  });

  it(`importance non reconnue → utilise valeur par défaut 20pts`, () => {
    const score = calculateCulturalScore(['marocaine'], 'unknown_value', ['marocaine']);
    expect(score).toBe(20);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateBudgetScore
// ─────────────────────────────────────────────────────────────────────────────

describe(`calculateBudgetScore`, () => {
  it(`score neutre (10) si le couple n'a pas de budget_max`, () => {
    expect(calculateBudgetScore(undefined, undefined, 1000, 3000)).toBe(10);
  });

  it(`score minimal (5) si le prestataire n'a pas de budget`, () => {
    expect(calculateBudgetScore(1000, 3000, undefined, undefined)).toBe(5);
  });

  it(`chevauchement parfait → 20 points`, () => {
    // Couple: 2000-4000, Prestataire: 2500-3500 (entièrement dans la fourchette)
    const score = calculateBudgetScore(2000, 4000, 2500, 3500);
    expect(score).toBe(20);
  });

  it(`chevauchement partiel → score intermédiaire (15-20)`, () => {
    // Couple: 2000-3000, Prestataire: 2500-4000
    const score = calculateBudgetScore(2000, 3000, 2500, 4000);
    expect(score).toBeGreaterThanOrEqual(15);
    expect(score).toBeLessThanOrEqual(20);
  });

  it(`fourchettes non chevauchantes (prestataire trop cher) → score bas`, () => {
    // Couple: 1000-2000, Prestataire: 4000-6000
    const score = calculateBudgetScore(1000, 2000, 4000, 6000);
    expect(score).toBeLessThan(10);
  });

  it(`fourchettes non chevauchantes (prestataire trop bon marché) → score bas`, () => {
    // Couple: 5000-8000, Prestataire: 500-1000
    const score = calculateBudgetScore(5000, 8000, 500, 1000);
    expect(score).toBeLessThan(10);
  });

  it(`flexibilité "flexible" → pénalité plus douce hors chevauchement`, () => {
    // couple: 1000-2000 (avg=1500), prestataire: 2100-2200 (avg=2150)
    // diff% = 650/1500 = 0.43 → flexible: 15-13=2, strict: 15-43=-28→0
    const scoreFlexible = calculateBudgetScore(1000, 2000, 2100, 2200, 'flexible');
    const scoreStrict = calculateBudgetScore(1000, 2000, 2100, 2200, 'strict');
    expect(scoreFlexible).toBeGreaterThan(scoreStrict);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateReputationScore
// ─────────────────────────────────────────────────────────────────────────────

describe(`calculateReputationScore`, () => {
  it(`aucun avis → score minimal (5)`, () => {
    expect(calculateReputationScore(undefined, undefined)).toBe(5);
  });

  it(`note 5/5 avec 50+ avis → score maximum (20)`, () => {
    expect(calculateReputationScore(5, 50)).toBe(20);
  });

  it(`note 5/5 avec 0 avis → pas de bonus volume`, () => {
    const score = calculateReputationScore(5, 0);
    expect(score).toBe(Math.round((5 / 5) * 16)); // 16 pts, 0 bonus
  });

  it(`note 4/5 avec 20 avis → score intermédiaire`, () => {
    const score = calculateReputationScore(4, 20);
    const expected = Math.round((4 / 5) * 16) + 3; // 12.8 → 13 + 3 = 16
    expect(score).toBe(expected);
  });

  it(`note 3/5 → score < 13`, () => {
    const score = calculateReputationScore(3, 5);
    expect(score).toBeLessThan(13);
  });

  it(`note 5/5 avec 5 avis → bonus 1 point volume`, () => {
    expect(calculateReputationScore(5, 5)).toBe(16 + 1);
  });

  it(`note 5/5 avec 10 avis → bonus 2 points volume`, () => {
    expect(calculateReputationScore(5, 10)).toBe(16 + 2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateExperienceScore
// ─────────────────────────────────────────────────────────────────────────────

describe(`calculateExperienceScore`, () => {
  it(`aucune expérience → score minimal (3)`, () => {
    expect(calculateExperienceScore(undefined)).toBe(3);
  });

  it(`10 ans d'expérience → score maximum (10)`, () => {
    expect(calculateExperienceScore(10)).toBe(10);
  });

  it(`20 ans d'expérience → plafonné à 10`, () => {
    expect(calculateExperienceScore(20)).toBe(10);
  });

  it(`5 ans d'expérience → 5 points`, () => {
    expect(calculateExperienceScore(5)).toBe(5);
  });

  it(`1 an d'expérience → 1 point`, () => {
    expect(calculateExperienceScore(1)).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateLocationScore
// ─────────────────────────────────────────────────────────────────────────────

describe(`calculateLocationScore`, () => {
  it(`score neutre (5) si pas de localisation couple`, () => {
    expect(calculateLocationScore(undefined, undefined, ['75'], 'Paris')).toBe(5);
  });

  it(`match département exact → 10 points`, () => {
    expect(calculateLocationScore('75', 'Paris', ['75', '92'], 'Paris')).toBe(10);
  });

  it(`match ville → 10 points`, () => {
    expect(calculateLocationScore(undefined, 'Lyon', [], 'Lyon')).toBe(10);
  });

  it(`match région (deux départements de la même région) → 6 points`, () => {
    // 75 et 77 sont tous deux en Île-de-France
    expect(calculateLocationScore('75', undefined, ['77'], undefined)).toBe(6);
  });

  it(`aucun match → score minimal (2)`, () => {
    expect(calculateLocationScore('75', 'Paris', ['13'], 'Marseille')).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateTagsScore
// ─────────────────────────────────────────────────────────────────────────────

describe(`calculateTagsScore`, () => {
  it(`pas de tags couple → 0 (neutre)`, () => {
    expect(calculateTagsScore([], ['reportage', 'henna'])).toBe(0);
    expect(calculateTagsScore(undefined, ['reportage'])).toBe(0);
  });

  it(`prestataire sans tags mais couple en a → malus (-2)`, () => {
    expect(calculateTagsScore(['reportage'], [])).toBe(-2);
    expect(calculateTagsScore(['reportage'], undefined)).toBe(-2);
  });

  it(`match 100% → 10 points`, () => {
    expect(calculateTagsScore(['reportage', 'henna'], ['reportage', 'henna', 'drone'])).toBe(10);
  });

  it(`match ≥ 75% → 8 points`, () => {
    // 3 sur 4 = 75%
    expect(calculateTagsScore(['a', 'b', 'c', 'd'], ['a', 'b', 'c'])).toBe(8);
  });

  it(`match ≥ 50% → 5 points`, () => {
    expect(calculateTagsScore(['a', 'b', 'c', 'd'], ['a', 'b'])).toBe(5);
  });

  it(`match ≥ 25% → 2 points`, () => {
    expect(calculateTagsScore(['a', 'b', 'c', 'd'], ['a'])).toBe(2);
  });

  it(`match 0% → 0 points`, () => {
    expect(calculateTagsScore(['reportage'], ['zaffa', 'henna'])).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateSpecialtyScore
// ─────────────────────────────────────────────────────────────────────────────

describe(`calculateSpecialtyScore`, () => {
  it(`pas de spécialités couple → 0 (neutre)`, () => {
    expect(calculateSpecialtyScore([], ['lgbtq_friendly'])).toBe(0);
    expect(calculateSpecialtyScore(undefined, ['halal'])).toBe(0);
  });

  it(`prestataire sans spécialités mais couple en a → malus (-3)`, () => {
    expect(calculateSpecialtyScore(['halal'], [])).toBe(-3);
    expect(calculateSpecialtyScore(['halal'], undefined)).toBe(-3);
  });

  it(`match parfait → 15 points`, () => {
    expect(calculateSpecialtyScore(['halal', 'lgbtq_friendly'], ['halal', 'lgbtq_friendly'])).toBe(15);
  });

  it(`match ≥ 75% → 12 points`, () => {
    expect(calculateSpecialtyScore(['a', 'b', 'c', 'd'], ['a', 'b', 'c'])).toBe(12);
  });

  it(`match 50% → 8 points`, () => {
    expect(calculateSpecialtyScore(['halal', 'religieux'], ['halal'])).toBe(8);
  });

  it(`match 25% → 4 points`, () => {
    expect(calculateSpecialtyScore(['a', 'b', 'c', 'd'], ['a'])).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateCapacityScore
// ─────────────────────────────────────────────────────────────────────────────

describe(`calculateCapacityScore`, () => {
  it(`pas de guest_count → 0 (neutre)`, () => {
    expect(calculateCapacityScore(undefined, 50, 200)).toBe(0);
  });

  it(`prestataire sans capacité → 0 (neutre)`, () => {
    expect(calculateCapacityScore(100, undefined, undefined)).toBe(0);
  });

  it(`invités dans la capacité → 10 points`, () => {
    expect(calculateCapacityScore(100, 50, 200)).toBe(10);
  });

  it(`invités légèrement sous le minimum (≤ 20%) → 5 points`, () => {
    expect(calculateCapacityScore(80, 100, 300)).toBe(5); // 80 >= 100*0.8 = 80 → exact
  });

  it(`invités dépassent légèrement le max (+10%) → 5 points`, () => {
    expect(calculateCapacityScore(220, 50, 200)).toBe(5);
  });

  it(`invités dépassent le max de +15% (≤ 20%) → 2 points`, () => {
    // 230 invités, max 200 → overload = (230-200)/200 = 0.15 ≤ 0.2 → 2pts
    expect(calculateCapacityScore(230, 50, 200)).toBe(2);
  });

  it(`invités dépassent massivement le max (>+20%) → pénalité (-5)`, () => {
    expect(calculateCapacityScore(300, 50, 200)).toBe(-5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateFairnessMultiplier
// ─────────────────────────────────────────────────────────────────────────────

describe(`calculateFairnessMultiplier`, () => {
  it(`retourne 1.0 si pas de données d'équité`, () => {
    expect(calculateFairnessMultiplier(undefined)).toBe(1.0);
  });

  it(`peu d'impressions → léger bonus (> 1.0)`, () => {
    const multiplier = calculateFairnessMultiplier({
      impressions_this_week: 2, // < seuil (10)
      total_impressions: 10,
      fairness_score: 0.8,
      click_through_rate: 0.1,
    });
    expect(multiplier).toBeGreaterThan(1.0);
  });

  it(`beaucoup d'impressions, bon score équité → multiplicateur élevé`, () => {
    const multiplier = calculateFairnessMultiplier({
      impressions_this_week: 50,
      total_impressions: 500,
      fairness_score: 1.0,
      click_through_rate: 0.2,
    });
    expect(multiplier).toBeGreaterThan(1.0);
    expect(multiplier).toBeLessThanOrEqual(1.15);
  });

  it(`beaucoup d'impressions, faible score équité → multiplicateur < 1.0`, () => {
    const multiplier = calculateFairnessMultiplier({
      impressions_this_week: 50,
      total_impressions: 500,
      fairness_score: FAIRNESS_CONFIG.MIN_FAIRNESS_SCORE, // 0.1 = minimum
      click_through_rate: 0.05,
    });
    expect(multiplier).toBeLessThan(1.0);
    expect(multiplier).toBeGreaterThanOrEqual(0.85);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateCTRBonus
// ─────────────────────────────────────────────────────────────────────────────

describe(`calculateCTRBonus`, () => {
  it(`retourne 0 si pas de données`, () => {
    expect(calculateCTRBonus(undefined)).toBe(0);
  });

  it(`retourne 0 si total_impressions < 20 (données insuffisantes)`, () => {
    expect(calculateCTRBonus({ impressions_this_week: 5, total_impressions: 10, fairness_score: 0.8, click_through_rate: 0.5 })).toBe(0);
  });

  it(`CTR ≥ 25% → +5 points`, () => {
    expect(calculateCTRBonus({ impressions_this_week: 50, total_impressions: 100, fairness_score: 0.8, click_through_rate: 0.25 })).toBe(5);
  });

  it(`CTR ≥ 15% et < 25% → +3 points`, () => {
    expect(calculateCTRBonus({ impressions_this_week: 50, total_impressions: 100, fairness_score: 0.8, click_through_rate: 0.18 })).toBe(3);
  });

  it(`CTR ≥ 10% et < 15% → 0 point (neutre)`, () => {
    expect(calculateCTRBonus({ impressions_this_week: 50, total_impressions: 100, fairness_score: 0.8, click_through_rate: 0.12 })).toBe(0);
  });

  it(`CTR ≥ 5% et < 10% → -2 points`, () => {
    expect(calculateCTRBonus({ impressions_this_week: 50, total_impressions: 100, fairness_score: 0.8, click_through_rate: 0.07 })).toBe(-2);
  });

  it(`CTR < 5% → -3 points`, () => {
    expect(calculateCTRBonus({ impressions_this_week: 50, total_impressions: 100, fairness_score: 0.8, click_through_rate: 0.03 })).toBe(-3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateTotalScore — score global (scénarios réels)
// ─────────────────────────────────────────────────────────────────────────────

describe(`calculateTotalScore — scénarios réels`, () => {
  const baseCriteria = {
    service_type: 'photographe',
    cultures: ['marocaine'],
    cultural_importance: 'essential',
    budget_min: 2000,
    budget_max: 3500,
    wedding_department: '75',
    wedding_city: 'Paris',
    tags: ['reportage'],
    specialty_tags: [],
    guest_count: 100,
  };

  it(`Scénario IDÉAL : prestataire parfaitement aligné → score ≥ 80`, () => {
    const { score, breakdown } = calculateTotalScore(baseCriteria, {
      cultures: ['marocaine'],
      budget_min: 2500,
      budget_max: 3000,
      average_rating: 5,
      review_count: 50,
      annees_experience: 10,
      zones: ['75'],
      ville_principale: 'Paris',
      tags: ['reportage', 'henna'],
      specialty_tags: [],
    });

    expect(score).toBeGreaterThanOrEqual(80);
    expect(breakdown.cultural_match).toBe(30);
    expect(breakdown.budget_match).toBe(20);
    expect(breakdown.reputation).toBe(20);
  });

  it(`Scénario MOYEN : prestataire partiellement aligné → score 40-70`, () => {
    const { score, breakdown } = calculateTotalScore(baseCriteria, {
      cultures: ['marocaine'],
      budget_min: 3000,
      budget_max: 4500,
      average_rating: 3.5,
      review_count: 5,
      annees_experience: 3,
      zones: ['77'], // Même région, pas même dept
      ville_principale: 'Meaux',
      tags: [],
      specialty_tags: [],
    });

    expect(score).toBeGreaterThanOrEqual(40);
    expect(score).toBeLessThanOrEqual(75);
    expect(breakdown.cultural_match).toBe(30); // Culture match parfait
    expect(breakdown.location_match).toBe(6);   // Région match
  });

  it(`Scénario MAUVAIS : aucun match → score ≤ 30`, () => {
    const { score, breakdown } = calculateTotalScore(baseCriteria, {
      cultures: ['indienne', 'chinoise'], // Pas les bonnes cultures
      budget_min: 8000,                    // Trop cher
      budget_max: 15000,
      average_rating: 0,
      review_count: 0,
      annees_experience: 0,
      zones: ['13'],                       // Marseille (loin)
      ville_principale: 'Marseille',
      tags: [],
      specialty_tags: [],
    });

    expect(score).toBeLessThanOrEqual(30);
    expect(breakdown.cultural_match).toBe(0);
  });

  it(`RANKING : le prestataire idéal doit scorer plus haut que le prestataire moyen`, () => {
    const ideal = calculateTotalScore(baseCriteria, {
      cultures: ['marocaine'],
      budget_min: 2500,
      budget_max: 3000,
      average_rating: 5,
      review_count: 50,
      annees_experience: 10,
      zones: ['75'],
      ville_principale: 'Paris',
      tags: ['reportage'],
      specialty_tags: [],
    });

    const average = calculateTotalScore(baseCriteria, {
      cultures: ['marocaine'],
      budget_min: 3000,
      budget_max: 4500,
      average_rating: 3.5,
      review_count: 5,
      annees_experience: 3,
      zones: ['77'],
      ville_principale: 'Meaux',
      tags: [],
      specialty_tags: [],
    });

    expect(ideal.score).toBeGreaterThan(average.score);
  });

  it(`Le score est toujours entre 0 et 100`, () => {
    const extreme = calculateTotalScore(baseCriteria, {
      cultures: ['marocaine'],
      budget_min: 2000,
      budget_max: 3500,
      average_rating: 5,
      review_count: 100,
      annees_experience: 20,
      zones: ['75'],
      ville_principale: 'Paris',
      tags: ['reportage', 'henna', 'drone'],
      specialty_tags: ['lgbtq_friendly', 'halal'],
      fairness_data: {
        impressions_this_week: 2,
        total_impressions: 50,
        fairness_score: 1.0,
        click_through_rate: 0.3,
      },
    });

    expect(extreme.score).toBeGreaterThanOrEqual(0);
    expect(extreme.score).toBeLessThanOrEqual(100);
  });

  it(`Le breakdown contient tous les champs attendus`, () => {
    const { breakdown } = calculateTotalScore(baseCriteria, {
      cultures: ['marocaine'],
      budget_min: 2000,
      budget_max: 3000,
      average_rating: 4,
      review_count: 10,
      annees_experience: 5,
      zones: ['75'],
      ville_principale: 'Paris',
      tags: [],
      specialty_tags: [],
    });

    expect(breakdown).toHaveProperty('cultural_match');
    expect(breakdown).toHaveProperty('budget_match');
    expect(breakdown).toHaveProperty('reputation');
    expect(breakdown).toHaveProperty('experience');
    expect(breakdown).toHaveProperty('location_match');
    expect(breakdown).toHaveProperty('tags_match');
    expect(breakdown).toHaveProperty('final_score');
  });
});
