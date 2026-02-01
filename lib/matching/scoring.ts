// lib/matching/scoring.ts

import type { SearchCriteria } from '@/types/chatbot';
import type { ScoreBreakdown } from '@/types/matching';

/**
 * Calcule le score de match culturel (/30 points)
 */
export function calculateCulturalScore(
  coupleCultures: string[],
  culturalImportance: string,
  providerCultures: string[]
): number {
  if (!coupleCultures.length || !providerCultures.length) {
    return 0;
  }

  // Match des cultures
  const matchedCultures = coupleCultures.filter((c) =>
    providerCultures.includes(c)
  );
  
  const matchPercentage = matchedCultures.length / coupleCultures.length;

  // Pondération selon importance
  const weights = {
    essential: 30,
    important: 25,
    nice_to_have: 15,
  };
  
  const maxScore = weights[culturalImportance as keyof typeof weights] || 20;
  
  return Math.round(matchPercentage * maxScore);
}

/**
 * Calcule le score de budget (/20 points)
 * Amélioration : vérifie d'abord le chevauchement des fourchettes avant de calculer la proximité
 */
export function calculateBudgetScore(
  coupleBudgetMin: number | undefined,
  coupleBudgetMax: number | undefined,
  providerBudgetMin: number | undefined,
  providerBudgetMax: number | undefined,
  flexibility: string = 'somewhat_flexible'
): number {
  // Si pas de budget défini côté couple, score neutre
  if (!coupleBudgetMax) {
    return 10; // Score neutre
  }

  // Si pas de budget défini côté prestataire, score minimal
  if (!providerBudgetMin) {
    return 5; // Score minimal car on ne peut pas vérifier la compatibilité
  }

  const coupleMin = coupleBudgetMin || 0;
  const providerMax = providerBudgetMax || providerBudgetMin * 2; // Estimation si pas de max

  // VÉRIFICATION 1 : Chevauchement des fourchettes
  // Les fourchettes se chevauchent si : couple_min <= provider_max ET provider_min <= couple_max
  const rangesOverlap = coupleMin <= providerMax && providerBudgetMin <= coupleBudgetMax;

  if (rangesOverlap) {
    // Les fourchettes se chevauchent - score de base élevé
    let baseScore = 15;

    // Calculer le chevauchement relatif pour affiner le score
    const overlapStart = Math.max(coupleMin, providerBudgetMin);
    const overlapEnd = Math.min(coupleBudgetMax, providerMax);
    const overlapSize = Math.max(0, overlapEnd - overlapStart);
    const coupleRangeSize = coupleBudgetMax - coupleMin;
    
    if (coupleRangeSize > 0) {
      const overlapPercentage = overlapSize / coupleRangeSize;
      // Bonus si le chevauchement est important (plus de 50% de la fourchette du couple)
      if (overlapPercentage > 0.5) {
        baseScore = 20; // Score parfait
      } else if (overlapPercentage > 0.3) {
        baseScore = 18; // Très bon chevauchement
      }
    }

    // Vérifier si le prix moyen du prestataire est dans la fourchette du couple
    const providerAvg = (providerBudgetMin + providerMax) / 2;
    if (providerAvg >= coupleMin && providerAvg <= coupleBudgetMax) {
      return 20; // Prix moyen parfaitement dans la fourchette
    }

    return Math.round(baseScore);
  }

  // Les fourchettes ne se chevauchent pas - calculer la distance
  const coupleAvg = (coupleMin + coupleBudgetMax) / 2;
  const providerAvg = (providerBudgetMin + providerMax) / 2;
  const diff = Math.abs(coupleAvg - providerAvg);
  const diffPercentage = coupleAvg > 0 ? diff / coupleAvg : 1;

  // Pénalité selon flexibilité
  const penalties = {
    flexible: 0.3,
    somewhat_flexible: 0.5,
    strict: 1.0,
  };

  const penalty = penalties[flexibility as keyof typeof penalties] || 0.5;
  
  // Score décroissant selon l'écart, avec pénalité selon flexibilité
  // Plus l'écart est grand, plus le score est faible
  const score = Math.max(0, 15 - diffPercentage * 100 * penalty);

  return Math.round(score);
}

/**
 * Calcule le score de réputation (/20 points)
 */
export function calculateReputationScore(
  averageRating: number | undefined,
  reviewCount: number | undefined
): number {
  if (!averageRating) {
    return 5; // Score minimal si pas d'avis
  }

  // Score basé sur la note moyenne (sur 5) converti en /16
  const ratingScore = (averageRating / 5) * 16;

  // Bonus selon nombre d'avis (max 4 points)
  let reviewBonus = 0;
  if (reviewCount && reviewCount > 0) {
    if (reviewCount >= 50) reviewBonus = 4;
    else if (reviewCount >= 20) reviewBonus = 3;
    else if (reviewCount >= 10) reviewBonus = 2;
    else if (reviewCount >= 5) reviewBonus = 1;
  }

  return Math.round(ratingScore + reviewBonus);
}

/**
 * Calcule le score d'expérience (/10 points)
 */
export function calculateExperienceScore(
  yearsExperience: number | undefined
): number {
  if (!yearsExperience) {
    return 3; // Score minimal
  }

  // 1 point par année, max 10
  return Math.min(10, Math.round(yearsExperience));
}

/**
 * Calcule le score de localisation (/10 points)
 */
export function calculateLocationScore(
  coupleDepartment: string | undefined,
  coupleCity: string | undefined,
  providerZones: string[],
  providerCity: string | undefined
): number {
  if (!coupleDepartment && !coupleCity) {
    return 5; // Score neutre si pas de localisation couple
  }

  // Match exact département
  if (coupleDepartment && providerZones.includes(coupleDepartment)) {
    return 10;
  }

  // Match ville
  if (coupleCity && providerCity) {
    if (coupleCity.toLowerCase() === providerCity.toLowerCase()) {
      return 10;
    }
  }

  // Match région approximatif (Île-de-France, PACA, etc.)
  // À améliorer avec une vraie correspondance région
  const coupleRegion = coupleDepartment?.split('-')[0];
  const hasRegionMatch = providerZones.some((zone) =>
    zone.startsWith(coupleRegion || '')
  );

  if (hasRegionMatch) {
    return 6;
  }

  return 2; // Score minimal si pas de match
}

/**
 * Calcule le score de correspondance des tags (bonus 0-10 points)
 * Les tags permettent d'affiner le matching selon le style et les spécialités
 */
export function calculateTagsScore(
  coupleTags: string[] | undefined,
  providerTags: string[] | undefined
): number {
  // Si le couple n'a pas spécifié de tags, pas de bonus/malus
  if (!coupleTags || coupleTags.length === 0) {
    return 0;
  }

  // Si le prestataire n'a pas de tags, léger malus
  if (!providerTags || providerTags.length === 0) {
    return -2;
  }

  // Compter les tags en commun
  const matchedTags = coupleTags.filter((t) =>
    providerTags.includes(t)
  );

  const matchPercentage = matchedTags.length / coupleTags.length;

  // Échelle de bonus:
  // 100% match = +10 points
  // 75%+ match = +8 points
  // 50%+ match = +5 points
  // 25%+ match = +2 points
  // 0% match = 0 points
  if (matchPercentage >= 1) return 10;
  if (matchPercentage >= 0.75) return 8;
  if (matchPercentage >= 0.5) return 5;
  if (matchPercentage >= 0.25) return 2;

  return 0;
}

/**
 * Calcule le score global
 */
export function calculateTotalScore(
  criteria: SearchCriteria,
  provider: any
): { score: number; breakdown: ScoreBreakdown } {
  const culturalScore = calculateCulturalScore(
    criteria.cultures || [],
    criteria.cultural_importance || 'important',
    provider.cultures || []
  );

  const budgetScore = calculateBudgetScore(
    criteria.budget_min,
    criteria.budget_max,
    provider.budget_min,
    provider.budget_max,
    criteria.budget_flexibility
  );

  const reputationScore = calculateReputationScore(
    provider.average_rating,
    provider.review_count
  );

  const experienceScore = calculateExperienceScore(
    provider.annees_experience
  );

  const locationScore = calculateLocationScore(
    criteria.wedding_department,
    criteria.wedding_city,
    provider.zones || [],
    provider.ville_principale
  );

  // Calculate tags match bonus (up to +10 points)
  const tagsScore = calculateTagsScore(
    criteria.tags,
    provider.tags
  );

  const totalAlgo =
    culturalScore +
    budgetScore +
    reputationScore +
    experienceScore +
    locationScore +
    tagsScore;

  // Final score capped at 100
  const finalScore = Math.min(100, Math.max(0, totalAlgo));

  const breakdown: ScoreBreakdown = {
    cultural_match: culturalScore,
    budget_match: budgetScore,
    reputation: reputationScore,
    experience: experienceScore,
    location_match: locationScore,
    tags_match: tagsScore,
    total_algo: totalAlgo,
    final_score: finalScore,
  };

  return { score: finalScore, breakdown };
}
