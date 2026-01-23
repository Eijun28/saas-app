// lib/matching/market-averages.ts
// Calcul des moyennes de marché par type de service

import { createClient } from '@/lib/supabase/server';

export interface MarketAverage {
  service_type: string;
  budget_min_avg: number;
  budget_max_avg: number;
  budget_range: string; // Format "min-max€" ou "min-max€/pers"
  provider_count: number;
  average_rating: number;
  average_experience: number;
}

/**
 * Calcule les moyennes de marché pour un type de service
 * Utilise uniquement les prestataires réels (pas les TEST)
 */
export async function calculateMarketAverage(
  serviceType: string
): Promise<MarketAverage | null> {
  const supabase = await createClient();

  // Récupérer tous les prestataires de ce service (hors TEST)
  const { data: providers, error } = await supabase
    .from('profiles')
    .select(`
      budget_min,
      budget_max,
      annees_experience,
      prestataire_public_profiles (
        rating
      )
    `)
    .eq('role', 'prestataire')
    .eq('service_type', serviceType)
    .not('nom_entreprise', 'like', '%TEST%');

  if (error || !providers || providers.length === 0) {
    return null;
  }

  // Filtrer les prestataires avec budget défini
  const providersWithBudget = providers.filter(
    (p) => p.budget_min !== null && p.budget_min !== undefined
  );

  if (providersWithBudget.length === 0) {
    return null;
  }

  // Calculer les moyennes
  const budgetMins = providersWithBudget.map((p) => p.budget_min!);
  const budgetMaxs = providersWithBudget
    .filter((p) => p.budget_max !== null && p.budget_max !== undefined)
    .map((p) => p.budget_max!);

  const budgetMinAvg = Math.round(
    budgetMins.reduce((a, b) => a + b, 0) / budgetMins.length
  );
  const budgetMaxAvg =
    budgetMaxs.length > 0
      ? Math.round(budgetMaxs.reduce((a, b) => a + b, 0) / budgetMaxs.length)
      : budgetMinAvg * 1.5; // Estimation si pas de max

  // Calculer moyenne expérience
  const experiences = providers
    .filter((p) => p.annees_experience !== null)
    .map((p) => p.annees_experience!);
  const averageExperience =
    experiences.length > 0
      ? Math.round(
          experiences.reduce((a, b) => a + b, 0) / experiences.length
        )
      : 0;

  // Calculer moyenne rating
  const ratings = providers
    .map((p) => {
      const publicProfile = Array.isArray(p.prestataire_public_profiles)
        ? p.prestataire_public_profiles[0]
        : p.prestataire_public_profiles;
      return publicProfile?.rating;
    })
    .filter((r) => r !== null && r !== undefined && r > 0) as number[];

  const averageRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) /
        10
      : 0;

  // Formater la fourchette selon le service
  const isPerPersonService = ['traiteur', 'patissier'].includes(serviceType);
  const budgetRange = isPerPersonService
    ? `${budgetMinAvg}-${budgetMaxAvg}€/personne`
    : `${budgetMinAvg}-${budgetMaxAvg}€`;

  return {
    service_type: serviceType,
    budget_min_avg: budgetMinAvg,
    budget_max_avg: budgetMaxAvg,
    budget_range: budgetRange,
    provider_count: providers.length,
    average_rating: averageRating,
    average_experience: averageExperience,
  };
}

/**
 * Formate le message de guide de budget pour le chatbot
 */
export function formatBudgetGuideMessage(
  marketAvg: MarketAverage | null,
  serviceType: string
): string {
  if (!marketAvg) {
    // Valeurs par défaut si pas assez de données
    const defaults: Record<string, string> = {
      traiteur: 'En moyenne 40-80€ par personne',
      photographe: 'En moyenne 1500-3000€',
      videaste: 'En moyenne 2000-4000€',
      dj: 'En moyenne 800-2500€',
      fleuriste: 'En moyenne 1500-5000€',
      salle: 'En moyenne 3000-10000€',
    };
    return defaults[serviceType] || 'Budget à définir selon vos besoins';
  }

  return `En moyenne ${marketAvg.budget_range} (${marketAvg.provider_count} prestataire${marketAvg.provider_count > 1 ? 's' : ''} disponible${marketAvg.provider_count > 1 ? 's' : ''})`;
}
