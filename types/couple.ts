// types/couple.ts

// Types pour le profil couple et le matching

export interface CoupleProfile {
  // Identifiants
  id?: string
  user_id: string
  created_at?: string
  updated_at?: string

  // Informations de base
  partner_1_name: string
  partner_2_name: string
  email: string
  avatar_url?: string | null

  // Informations du mariage
  wedding_date?: string | null
  wedding_city?: string | null
  wedding_region?: string | null
  wedding_country?: string | null
  guest_count?: number | null
  wedding_type?: WeddingType | null

  // Préférences culturelles et religieuses
  cultures?: string[] | null
  religions?: string[] | null
  cultural_requirements?: string | null

  // Style et ambiance
  wedding_style?: WeddingStyle | null
  ambiance?: Ambiance | null
  color_theme?: string | null

  // Services recherchés
  services_needed?: string[] | null
  service_priorities?: string[] | null

  // Budget et planning
  budget_min?: number | null
  budget_max?: number | null
  budget_total?: number | null // Ancien champ, à garder pour compatibilité
  budget_flexibility?: BudgetFlexibility | null
  planning_stage?: PlanningStage | null

  // Métadonnées
  profile_completion?: number | null
}

// Énumérations pour les types de mariage
export type WeddingType = 'civil' | 'religieux' | 'les_deux' | 'autre'

export type WeddingStyle =
  | 'classique'
  | 'moderne'
  | 'boheme'
  | 'traditionnel'
  | 'luxe'
  | 'champetre'
  | 'minimaliste'

export type Ambiance =
  | 'intime'
  | 'festif'
  | 'elegant'
  | 'decontracte'
  | 'romantique'

export type BudgetFlexibility = 'flexible' | 'somewhat_flexible' | 'strict'

export type PlanningStage =
  | 'just_engaged'
  | 'planning_started'
  | 'almost_ready'
  | 'last_minute'

// Options pour les sélections
export const CULTURES = [
  'Française',
  'Marocaine',
  'Algérienne',
  'Tunisienne',
  'Sénégalaise',
  'Camerounaise',
  'Ivoirienne',
  'Italienne',
  'Espagnole',
  'Portugaise',
  'Indienne',
  'Pakistanaise',
  'Chinoise',
  'Vietnamienne',
  'Thaïlandaise',
  'Turque',
  'Libanaise',
  'Syrienne',
  'Autre',
] as const

export const RELIGIONS = [
  'Musulman',
  'Chrétien',
  'Catholique',
  'Protestant',
  'Orthodoxe',
  'Juif',
  'Hindou',
  'Bouddhiste',
  'Laïc/Non-religieux',
  'Autre',
] as const

export const WEDDING_SERVICES = [
  'Photographe',
  'Vidéaste',
  'Traiteur',
  'Salle de réception',
  'DJ / Musicien',
  'Fleuriste',
  'Wedding Planner',
  'Décorateur',
  'Coiffeur / Maquilleur',
  'Pâtissier (wedding cake)',
  'Location de voiture',
  'Animation',
  'Officiant de cérémonie',
  'Autre',
] as const

export const WEDDING_STYLES_OPTIONS = [
  { value: 'classique', label: 'Classique' },
  { value: 'moderne', label: 'Moderne' },
  { value: 'boheme', label: 'Bohème' },
  { value: 'traditionnel', label: 'Traditionnel' },
  { value: 'luxe', label: 'Luxe' },
  { value: 'champetre', label: 'Champêtre' },
  { value: 'minimaliste', label: 'Minimaliste' },
] as const

export const AMBIANCES_OPTIONS = [
  { value: 'intime', label: 'Intime' },
  { value: 'festif', label: 'Festif' },
  { value: 'elegant', label: 'Élégant' },
  { value: 'decontracte', label: 'Décontracté' },
  { value: 'romantique', label: 'Romantique' },
] as const

export const WEDDING_TYPES_OPTIONS = [
  { value: 'civil', label: 'Civil uniquement' },
  { value: 'religieux', label: 'Religieux uniquement' },
  { value: 'les_deux', label: 'Civil et religieux' },
  { value: 'autre', label: 'Autre' },
] as const

export const PLANNING_STAGES_OPTIONS = [
  { value: 'just_engaged', label: 'Tout juste fiancés' },
  { value: 'planning_started', label: 'Préparatifs commencés' },
  { value: 'almost_ready', label: 'Presque prêts' },
  { value: 'last_minute', label: 'Dernière ligne droite' },
] as const

export const BUDGET_FLEXIBILITY_OPTIONS = [
  { value: 'flexible', label: 'Flexible' },
  { value: 'somewhat_flexible', label: 'Moyennement flexible' },
  { value: 'strict', label: 'Budget strict' },
] as const

// Helper pour calculer le pourcentage de complétion
export function calculateProfileCompletion(profile: CoupleProfile): number {
  const fields = [
    profile.partner_1_name,
    profile.partner_2_name,
    profile.wedding_date,
    profile.wedding_city,
    profile.wedding_region,
    profile.guest_count,
    profile.wedding_type,
    profile.cultures && profile.cultures.length > 0,
    profile.wedding_style,
    profile.ambiance,
    profile.services_needed && profile.services_needed.length > 0,
    profile.budget_min || profile.budget_max,
    profile.planning_stage,
  ]

  const completed = fields.filter((f) => f).length
  return Math.round((completed / fields.length) * 100)
}

// Helper pour valider le profil
export function validateCoupleProfile(profile: Partial<CoupleProfile>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!profile.partner_1_name?.trim()) {
    errors.push('Le nom du partenaire 1 est requis')
  }

  if (!profile.partner_2_name?.trim()) {
    errors.push('Le nom du partenaire 2 est requis')
  }

  if (profile.guest_count && profile.guest_count < 1) {
    errors.push('Le nombre d\'invités doit être positif')
  }

  if (profile.budget_min && profile.budget_max && profile.budget_min > profile.budget_max) {
    errors.push('Le budget minimum ne peut pas être supérieur au budget maximum')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Interface pour les favoris
export interface Favori {
  id: string
  couple_id: string
  prestataire_id: string
  created_at: string
  prestataire?: {
    id: string
    business_name: string
    category: string
    avatar_url?: string
  }
}

// Interface pour les demandes
export interface Demande {
  id: string
  couple_id: string
  prestataire_id: string
  service_type: string
  message: string
  status: 'pending' | 'accepted' | 'rejected' | 'responded'
  created_at: string
  updated_at: string
  prestataire?: {
    id: string
    business_name: string
    category: string
  }
}

// Interface pour les devis
export interface Devis {
  id: string
  demande_id: string
  prestataire_id: string
  couple_id: string
  amount: number
  details: string
  validity_date?: string
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating'
  created_at: string
  updated_at: string
}

// Interface pour le matching score
export interface MatchingScore {
  prestataire_id: string
  couple_id: string
  total_score: number
  culture_score: number
  budget_score: number
  location_score: number
  availability_score: number
  style_score: number
  matched_at: string
}

