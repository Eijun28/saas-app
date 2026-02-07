/**
 * Calcul server-side du pourcentage de complétion du profil prestataire.
 * Réplique la logique pondérée de ProfileScoreCard.tsx pour usage côté serveur
 * (cron jobs, API routes, etc.)
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface ProfileCompletionItem {
  id: string
  label: string
  completed: boolean
  points: number
  priority: 'high' | 'medium' | 'low'
}

export interface ProfileCompletionResult {
  percentage: number
  totalScore: number
  maxScore: number
  completedCount: number
  totalCount: number
  items: ProfileCompletionItem[]
  missingItems: ProfileCompletionItem[]
}

/**
 * Calcule la complétion d'un profil prestataire avec le système de points pondérés.
 * Identique à la logique du composant ProfileScoreCard côté client.
 */
export function calculateProviderProfileCompletion(
  profile: {
    avatar_url?: string | null
    nom_entreprise?: string | null
    description_courte?: string | null
    budget_min?: number | null
    budget_max?: number | null
    ville_principale?: string | null
    instagram_url?: string | null
    facebook_url?: string | null
    website_url?: string | null
  } | null,
  culturesCount: number,
  zonesCount: number,
  portfolioCount: number
): ProfileCompletionResult {
  const items: ProfileCompletionItem[] = [
    {
      id: 'avatar',
      label: 'Photo de profil',
      completed: !!profile?.avatar_url,
      points: 15,
      priority: 'high',
    },
    {
      id: 'nom',
      label: "Nom d'entreprise",
      completed: !!profile?.nom_entreprise,
      points: 10,
      priority: 'high',
    },
    {
      id: 'description',
      label: 'Description courte',
      completed: !!profile?.description_courte && profile.description_courte.length > 20,
      points: 15,
      priority: 'high',
    },
    {
      id: 'budget',
      label: 'Tarifs renseignés',
      completed: !!profile?.budget_min || !!profile?.budget_max,
      points: 10,
      priority: 'high',
    },
    {
      id: 'ville',
      label: 'Ville principale',
      completed: !!profile?.ville_principale,
      points: 5,
      priority: 'medium',
    },
    {
      id: 'cultures',
      label: 'Cultures de mariage',
      completed: culturesCount > 0,
      points: 15,
      priority: 'high',
    },
    {
      id: 'zones',
      label: "Zones d'intervention",
      completed: zonesCount > 0,
      points: 10,
      priority: 'medium',
    },
    {
      id: 'portfolio',
      label: 'Portfolio (3+ photos)',
      completed: portfolioCount >= 3,
      points: 15,
      priority: 'high',
    },
    {
      id: 'social',
      label: 'Réseaux sociaux',
      completed: !!(profile?.instagram_url || profile?.facebook_url || profile?.website_url),
      points: 5,
      priority: 'low',
    },
  ]

  const totalScore = items.reduce((acc, item) => acc + (item.completed ? item.points : 0), 0)
  const maxScore = items.reduce((acc, item) => acc + item.points, 0)
  const percentage = Math.round((totalScore / maxScore) * 100)
  const completedCount = items.filter((item) => item.completed).length
  const missingItems = items.filter((item) => !item.completed)

  return {
    percentage,
    totalScore,
    maxScore,
    completedCount,
    totalCount: items.length,
    items,
    missingItems,
  }
}

/**
 * Récupère les données nécessaires au calcul de complétion depuis Supabase
 * et retourne le résultat complet.
 */
export async function getProviderProfileCompletion(
  adminClient: SupabaseClient,
  providerId: string
): Promise<ProfileCompletionResult | null> {
  const [profileResult, culturesResult, zonesResult, portfolioResult] = await Promise.all([
    adminClient
      .from('profiles')
      .select(
        'avatar_url, nom_entreprise, description_courte, budget_min, budget_max, ville_principale, instagram_url, facebook_url, website_url'
      )
      .eq('id', providerId)
      .single(),
    adminClient
      .from('provider_cultures')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', providerId),
    adminClient
      .from('provider_zones')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', providerId),
    adminClient
      .from('provider_portfolio_images')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', providerId),
  ])

  if (!profileResult.data) return null

  return calculateProviderProfileCompletion(
    profileResult.data,
    culturesResult.count ?? 0,
    zonesResult.count ?? 0,
    portfolioResult.count ?? 0
  )
}
