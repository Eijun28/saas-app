// lib/matching/scoring.ts

import type { SearchCriteria } from '@/types/chatbot';
import type { ScoreBreakdown } from '@/types/matching';

/**
 * Configuration du systeme d'equite
 */
export const FAIRNESS_CONFIG = {
  // Poids du score d'equite dans le score final (0-1)
  // 0.15 = l'equite peut influencer jusqu'a 15% du score final
  FAIRNESS_WEIGHT: 0.15,

  // Score minimum d'equite (evite de penaliser trop les prestataires populaires)
  MIN_FAIRNESS_SCORE: 0.1,

  // Nombre d'impressions hebdomadaires avant de commencer a penaliser
  IMPRESSION_THRESHOLD: 10,

  // Activer le systeme d'equite
  ENABLED: true,
};

/**
 * Interface pour les donnees d'equite d'un prestataire
 */
export interface FairnessData {
  impressions_this_week: number;
  total_impressions: number;
  fairness_score: number;
  click_through_rate: number;
}

/**
 * Interface etendue pour les criteres de recherche avec equite
 */
export interface ExtendedSearchCriteria extends SearchCriteria {
  // Tags specifiques demandes par le couple
  specialty_tags?: string[];
  style_tags?: string[];
}

/**
 * Interface pour les cultures avec niveau d'expertise
 */
export interface ProviderCultureWithExpertise {
  culture_id: string;
  expertise_level: 'specialise' | 'experimente';
}

/**
 * Calcule le score de match culturel (/30 points)
 * Supporte les cultures avec ou sans niveau d'expertise.
 * - Match "specialise" = valeur pleine
 * - Match "experimente" = 60% de la valeur
 */
export function calculateCulturalScore(
  coupleCultures: string[],
  culturalImportance: string,
  providerCultures: string[] | ProviderCultureWithExpertise[]
): number {
  if (!coupleCultures.length || !providerCultures.length) {
    return 0;
  }

  // Pondération selon importance
  const weights = {
    essential: 30,
    important: 25,
    nice_to_have: 15,
  };

  const maxScore = weights[culturalImportance as keyof typeof weights] || 20;

  // Déterminer si on a des cultures avec expertise ou des simples strings
  const isWithExpertise = typeof providerCultures[0] !== 'string';

  if (isWithExpertise) {
    const culturesWithExpertise = providerCultures as ProviderCultureWithExpertise[];
    let totalWeight = 0;

    for (const coupleCulture of coupleCultures) {
      const match = culturesWithExpertise.find(c => c.culture_id === coupleCulture);
      if (match) {
        // Spécialisé = 100% de la valeur, Expérimenté = 60%
        totalWeight += match.expertise_level === 'specialise' ? 1.0 : 0.6;
      }
    }

    const matchPercentage = totalWeight / coupleCultures.length;
    return Math.round(matchPercentage * maxScore);
  }

  // Fallback: ancien format (simple strings) - compatibilité ascendante
  const simpleProviderCultures = providerCultures as string[];
  const matchedCultures = coupleCultures.filter((c) =>
    simpleProviderCultures.includes(c)
  );

  const matchPercentage = matchedCultures.length / coupleCultures.length;

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
 * Calcule le score de specialites (bonus 0-15 points)
 * Les specialites sont des tags de categorie 'specialite' qui correspondent
 * a des besoins specifiques (mariage religieux, LGBTQ+ friendly, etc.)
 */
export function calculateSpecialtyScore(
  coupleSpecialties: string[] | undefined,
  providerSpecialties: string[] | undefined
): number {
  // Si le couple n'a pas de specialites demandees, pas de bonus/malus
  if (!coupleSpecialties || coupleSpecialties.length === 0) {
    return 0;
  }

  // Si le prestataire n'a pas de specialites, leger malus
  if (!providerSpecialties || providerSpecialties.length === 0) {
    return -3;
  }

  // Normaliser les slugs pour comparaison
  const normalizedCouple = coupleSpecialties.map(s => s.toLowerCase().trim());
  const normalizedProvider = providerSpecialties.map(s => s.toLowerCase().trim());

  // Compter les specialites en commun
  const matchedSpecialties = normalizedCouple.filter(s =>
    normalizedProvider.includes(s)
  );

  const matchPercentage = matchedSpecialties.length / normalizedCouple.length;

  // Echelle de bonus plus importante pour les specialites
  // car elles representent des besoins specifiques importants
  if (matchPercentage >= 1) return 15;     // Match parfait
  if (matchPercentage >= 0.75) return 12;  // Tres bon match
  if (matchPercentage >= 0.5) return 8;    // Bon match
  if (matchPercentage >= 0.25) return 4;   // Match partiel
  return 0;
}

/**
 * Calcule le facteur d'equite (multiplicateur 0.85-1.15)
 * Ce facteur permet de favoriser les prestataires moins exposes
 */
export function calculateFairnessMultiplier(
  fairnessData: FairnessData | undefined
): number {
  if (!FAIRNESS_CONFIG.ENABLED || !fairnessData) {
    return 1.0; // Pas d'ajustement si desactive ou pas de donnees
  }

  const { impressions_this_week, fairness_score } = fairnessData;

  // Si peu d'impressions, ne pas penaliser
  if (impressions_this_week < FAIRNESS_CONFIG.IMPRESSION_THRESHOLD) {
    // Leger bonus pour les prestataires peu exposes
    return 1.0 + (FAIRNESS_CONFIG.FAIRNESS_WEIGHT * 0.5);
  }

  // Utiliser le score d'equite calcule par la BDD
  // fairness_score est entre 0.1 et 1.0
  // On le transforme en multiplicateur entre 0.85 et 1.15
  const adjustedScore = Math.max(FAIRNESS_CONFIG.MIN_FAIRNESS_SCORE, fairness_score);

  // Transformer en multiplicateur: 0.1 -> 0.85, 1.0 -> 1.15
  const multiplier = 0.85 + (adjustedScore * 0.3);

  return multiplier;
}

/**
 * Calcule un bonus base sur le CTR (Click-Through Rate)
 * Les prestataires avec un bon CTR sont plus pertinents
 */
export function calculateCTRBonus(
  fairnessData: FairnessData | undefined
): number {
  if (!fairnessData || fairnessData.total_impressions < 20) {
    return 0; // Pas assez de donnees pour etre significatif
  }

  const ctr = fairnessData.click_through_rate;

  // CTR moyen estime a 10-15%
  // Bonus si au-dessus, malus si en-dessous
  if (ctr >= 0.25) return 5;   // Excellent CTR
  if (ctr >= 0.15) return 3;   // Bon CTR
  if (ctr >= 0.10) return 0;   // CTR moyen
  if (ctr >= 0.05) return -2;  // CTR faible
  return -3;                   // CTR tres faible
}

/**
 * Interface etendue du provider pour le scoring avec equite
 */
export interface ProviderWithFairness {
  cultures?: string[];
  budget_min?: number;
  budget_max?: number;
  average_rating?: number;
  review_count?: number;
  annees_experience?: number;
  zones?: string[];
  ville_principale?: string;
  tags?: string[];
  specialty_tags?: string[];
  fairness_data?: FairnessData;
  [key: string]: unknown;
}

/**
 * Interface etendue pour le breakdown avec equite
 */
export interface ExtendedScoreBreakdown extends ScoreBreakdown {
  specialty_match?: number;
  fairness_multiplier?: number;
  ctr_bonus?: number;
  score_before_fairness?: number;
}

/**
 * Calcule le score global avec support de l'equite
 * Compatible avec l'ancienne API tout en supportant les nouvelles fonctionnalites
 */
export function calculateTotalScore(
  criteria: SearchCriteria | ExtendedSearchCriteria,
  provider: ProviderWithFairness
): { score: number; breakdown: ExtendedScoreBreakdown } {
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

  // Calculate specialty match bonus (up to +15 points)
  const extendedCriteria = criteria as ExtendedSearchCriteria;
  const specialtyScore = calculateSpecialtyScore(
    extendedCriteria.specialty_tags,
    provider.specialty_tags
  );

  // Calculate CTR bonus/malus (-3 to +5 points)
  const ctrBonus = calculateCTRBonus(provider.fairness_data);

  // Score algorithmique total avant equite
  const totalAlgo =
    culturalScore +
    budgetScore +
    reputationScore +
    experienceScore +
    locationScore +
    tagsScore +
    specialtyScore +
    ctrBonus;

  // Score avant application de l'equite (cap a 100)
  const scoreBeforeFairness = Math.min(100, Math.max(0, totalAlgo));

  // Calculer le multiplicateur d'equite
  const fairnessMultiplier = calculateFairnessMultiplier(provider.fairness_data);

  // Appliquer l'equite au score
  // Le multiplicateur ajuste legerement le score pour favoriser les prestataires moins exposes
  const adjustedScore = scoreBeforeFairness * fairnessMultiplier;

  // Score final (cap a 100)
  const finalScore = Math.min(100, Math.max(0, Math.round(adjustedScore)));

  const breakdown: ExtendedScoreBreakdown = {
    cultural_match: culturalScore,
    budget_match: budgetScore,
    reputation: reputationScore,
    experience: experienceScore,
    location_match: locationScore,
    tags_match: tagsScore,
    specialty_match: specialtyScore,
    fairness_multiplier: fairnessMultiplier,
    ctr_bonus: ctrBonus,
    score_before_fairness: scoreBeforeFairness,
    total_algo: totalAlgo,
    final_score: finalScore,
  };

  return { score: finalScore, breakdown };
}

/**
 * Fonction utilitaire pour preparer les donnees d'equite avant le scoring
 * A appeler cote serveur pour enrichir les providers avec leurs donnees d'equite
 */
export function enrichProviderWithFairness(
  provider: Record<string, unknown>,
  fairnessData: FairnessData | null
): ProviderWithFairness {
  return {
    ...provider,
    fairness_data: fairnessData || undefined,
  } as ProviderWithFairness;
}
