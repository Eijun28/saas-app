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
 */
export function calculateBudgetScore(
  coupleBudgetMin: number | undefined,
  coupleBudgetMax: number | undefined,
  providerBudgetMin: number | undefined,
  providerBudgetMax: number | undefined,
  flexibility: string = 'somewhat_flexible'
): number {
  // Si pas de budget défini, score neutre
  if (!coupleBudgetMax || !providerBudgetMin) {
    return 10; // Score neutre
  }

  const coupleAvg = ((coupleBudgetMin || 0) + coupleBudgetMax) / 2;
  const providerAvg = ((providerBudgetMin || 0) + (providerBudgetMax || providerBudgetMin)) / 2;

  // Dans la fourchette parfaite
  if (
    providerAvg >= (coupleBudgetMin || 0) &&
    providerAvg <= coupleBudgetMax
  ) {
    return 20;
  }

  // Calcul de l'écart
  const diff = Math.abs(coupleAvg - providerAvg);
  const diffPercentage = diff / coupleAvg;

  // Pénalité selon flexibilité
  const penalties = {
    flexible: 0.3,
    somewhat_flexible: 0.5,
    strict: 1.0,
  };

  const penalty = penalties[flexibility as keyof typeof penalties] || 0.5;
  const score = Math.max(0, 20 - diffPercentage * 100 * penalty);

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

  const totalAlgo = 
    culturalScore +
    budgetScore +
    reputationScore +
    experienceScore +
    locationScore;

  // Pour l'instant, pas de bonus IA (étape 5)
  const finalScore = Math.min(100, totalAlgo);

  const breakdown: ScoreBreakdown = {
    cultural_match: culturalScore,
    budget_match: budgetScore,
    reputation: reputationScore,
    experience: experienceScore,
    location_match: locationScore,
    total_algo: totalAlgo,
    final_score: finalScore,
  };

  return { score: finalScore, breakdown };
}
