/** Type d'événement culturel prédéfini (table cultural_event_types) */
export interface CulturalEventType {
  id: string
  slug: string
  label: string
  description: string | null
  culture_category_id: string
  culture_ids: string[]
  icon: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

/** Statut d'un événement du couple */
export type CoupleEventStatus = 'planning' | 'confirmed' | 'completed' | 'cancelled'

/** Événement d'un couple (mini-projet indépendant) */
export interface CoupleEvent {
  id: string
  couple_id: string
  event_type_id: string | null
  custom_event_name: string | null
  title: string
  description: string | null
  event_date: string | null
  event_time: string | null
  venue: string | null
  venue_address: string | null
  guest_count: number | null
  budget_min: number | null
  budget_max: number | null
  currency: string
  status: CoupleEventStatus
  notes: string | null
  display_order: number
  created_at: string
  updated_at: string
}

/** Événement avec le type d'événement culturel joint */
export interface CoupleEventWithType extends CoupleEvent {
  event_type: CulturalEventType | null
}

/** Statut d'un prestataire assigné à un événement */
export type EventProviderStatus = 'pending' | 'confirmed' | 'declined' | 'completed'

/** Prestataire assigné à un événement */
export interface CoupleEventProvider {
  id: string
  couple_event_id: string
  provider_id: string
  service_type: string | null
  status: EventProviderStatus
  notes: string | null
  budget_allocated: number | null
  created_at: string
  updated_at: string
  provider?: {
    id: string
    nom_entreprise: string | null
    avatar_url: string | null
    service_type: string | null
  }
}

/** Événement avec prestataires joints */
export interface CoupleEventWithProviders extends CoupleEventWithType {
  providers: CoupleEventProvider[]
}

/** Couverture d'un prestataire sur les types d'événements */
export interface ProviderEventType {
  id: string
  profile_id: string
  event_type_id: string
  created_at: string
  event_type?: CulturalEventType
}

/** Données du formulaire de création/édition d'événement */
export interface CoupleEventFormData {
  event_type_id: string | null
  custom_event_name: string
  title: string
  description: string
  event_date: Date | null
  event_time: string
  venue: string
  venue_address: string
  guest_count: string
  budget_min: string
  budget_max: string
  status: CoupleEventStatus
  notes: string
}

/** Configuration d'affichage des statuts */
export const EVENT_STATUS_CONFIG: Record<CoupleEventStatus, { label: string; color: string; bgColor: string }> = {
  planning: { label: 'En préparation', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  confirmed: { label: 'Confirmé', color: 'text-green-700', bgColor: 'bg-green-50' },
  completed: { label: 'Terminé', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  cancelled: { label: 'Annulé', color: 'text-red-700', bgColor: 'bg-red-50' },
}

/** Valeur initiale du formulaire */
export const EMPTY_EVENT_FORM: CoupleEventFormData = {
  event_type_id: null,
  custom_event_name: '',
  title: '',
  description: '',
  event_date: null,
  event_time: '',
  venue: '',
  venue_address: '',
  guest_count: '',
  budget_min: '',
  budget_max: '',
  status: 'planning',
  notes: '',
}
