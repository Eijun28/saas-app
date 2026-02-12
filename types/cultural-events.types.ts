/** Événement de la timeline d'un couple (table timeline_events) */
export interface TimelineEvent {
  id: string
  couple_id: string
  title: string
  description: string | null
  event_date: string
  created_at: string
  updated_at: string
}

/** Données du formulaire de création/édition d'événement */
export interface TimelineEventFormData {
  title: string
  description: string
  event_date: Date | null
}

/** Valeur initiale du formulaire */
export const EMPTY_EVENT_FORM: TimelineEventFormData = {
  title: '',
  description: '',
  event_date: null,
}

// ---------------------------------------------------------------------------
// Couple Events — système enrichi (table couple_events)
// ---------------------------------------------------------------------------

export type CoupleEventStatus = 'planning' | 'confirmed' | 'completed' | 'cancelled'

export const EVENT_STATUS_CONFIG: Record<CoupleEventStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  planning: { label: 'En préparation', color: 'text-blue-700', bgColor: 'bg-blue-50', icon: 'clock' },
  confirmed: { label: 'Confirmé', color: 'text-green-700', bgColor: 'bg-green-50', icon: 'check-circle' },
  completed: { label: 'Terminé', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: 'check' },
  cancelled: { label: 'Annulé', color: 'text-red-700', bgColor: 'bg-red-50', icon: 'x-circle' },
}

/** Événement enrichi d'un couple (table couple_events) */
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

/** Événement enrichi avec les infos du type culturel */
export interface CoupleEventWithType extends CoupleEvent {
  event_type?: CulturalEventType | null
}

/** Prestataire assigné à un événement */
export interface CoupleEventProvider {
  id: string
  couple_event_id: string
  provider_id: string
  service_type: string | null
  status: 'pending' | 'confirmed' | 'declined' | 'completed'
  budget_allocated: number | null
  notes: string | null
  created_at: string
  // Données jointes du prestataire
  provider?: {
    id: string
    nom_entreprise: string
    avatar_url: string | null
    service_type: string | null
  }
}

/** Événement avec ses prestataires */
export interface CoupleEventWithProviders extends CoupleEventWithType {
  providers: CoupleEventProvider[]
}

/** Type d'événement culturel (table cultural_event_types) */
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

/** Formulaire de création/édition d'événement enrichi */
export interface CoupleEventFormData {
  event_type_id: string | null
  custom_event_name: string
  title: string
  description: string
  event_date: Date | null
  event_time: string
  venue: string
  venue_address: string
  guest_count: number | null
  budget_min: number | null
  budget_max: number | null
  status: CoupleEventStatus
  notes: string
}

export const EMPTY_COUPLE_EVENT_FORM: CoupleEventFormData = {
  event_type_id: null,
  custom_event_name: '',
  title: '',
  description: '',
  event_date: null,
  event_time: '',
  venue: '',
  venue_address: '',
  guest_count: null,
  budget_min: null,
  budget_max: null,
  status: 'planning',
  notes: '',
}
