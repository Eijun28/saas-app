// types/couples.types.ts

export interface Couple {
  id: string
  user_id: string
  email: string
  partner_1_name: string | null
  partner_2_name: string | null
  avatar_url: string | null
  wedding_date: string | null
  wedding_location: string | null
  guest_count: number | null
  budget_min: number | null
  budget_max: number | null
  currency: string
  created_at: string
  updated_at: string
  last_login_at: string | null
}

export interface CouplePreferences {
  id: string
  couple_id: string
  primary_culture_id: string | null
  secondary_culture_ids: string[] | null
  cultural_preferences: object | null
  languages: string[]
  essential_services: string[]
  optional_services: string[]
  service_priorities: object | null
  budget_breakdown: object | null
  special_requests: string | null
  wedding_description: string | null
  profile_completed: boolean
  completion_percentage: number
  onboarding_step: number
  onboarding_completed_at: string | null
  created_at: string
  updated_at: string
}

// Type combiné pour récupérer couple + préférences
export interface CoupleWithPreferences extends Couple {
  preferences: CouplePreferences | null
}

// Types utilitaires pour les objets JSONB
export interface CulturalPreferences {
  dietary_requirements?: ('halal' | 'kosher' | 'vegetarian' | 'vegan' | 'no_pork' | 'no_beef')[]
  religious_ceremony?: 'muslim' | 'christian' | 'jewish' | 'hindu' | 'buddhist' | 'secular' | 'mixed'
  traditional_elements?: string[]
  music_preferences?: ('traditional' | 'modern' | 'mixed')[]
  dress_code?: 'traditional' | 'western' | 'traditional_mixed' | 'free'
  language_ceremony?: string
  alcohol_policy?: 'yes' | 'no' | 'limited'
  gender_separation?: boolean
  [key: string]: any
}

export interface ServicePriorities {
  traiteur?: 'high' | 'medium' | 'low'
  photographe?: 'high' | 'medium' | 'low'
  videaste?: 'high' | 'medium' | 'low'
  dj?: 'high' | 'medium' | 'low'
  musicien?: 'high' | 'medium' | 'low'
  decoration?: 'high' | 'medium' | 'low'
  lieu?: 'high' | 'medium' | 'low'
  [key: string]: 'high' | 'medium' | 'low' | undefined
}

export interface BudgetBreakdown {
  [service: string]: {
    min: number
    max: number
    priority?: 'high' | 'medium' | 'low'
  }
}

// Constantes utiles
export const SERVICE_CATEGORIES = [
  'traiteur',
  'photographe',
  'videaste',
  'dj',
  'musicien',
  'decoration',
  'lieu',
  'fleuriste',
  'maquillage',
  'coiffure',
  'patissier',
  'animation',
  'transport',
  'hebergement',
  'neggafa',
] as const

export type ServiceCategory = typeof SERVICE_CATEGORIES[number]
