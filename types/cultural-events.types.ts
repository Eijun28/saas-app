/** Catégories d'événements */
export type EventCategory =
  | 'ceremony-civil'
  | 'ceremony-religious'
  | 'ceremony-cultural'
  | 'cocktail'
  | 'dinner'
  | 'party'
  | 'photo'
  | 'fitting'
  | 'meeting'
  | 'other'

export const EVENT_CATEGORY_CONFIG: Record<EventCategory, { label: string; emoji: string }> = {
  'ceremony-civil':     { label: 'Cérémonie civile',          emoji: '🏛️' },
  'ceremony-religious': { label: 'Cérémonie religieuse',      emoji: '⛪' },
  'ceremony-cultural':  { label: 'Cérémonie culturelle',      emoji: '🌸' },
  'cocktail':           { label: "Cocktail / Vin d'honneur",  emoji: '🥂' },
  'dinner':             { label: 'Dîner de mariage',          emoji: '🍽️' },
  'party':              { label: 'Soirée / Fête',             emoji: '🎉' },
  'photo':              { label: 'Séance photo',              emoji: '📷' },
  'fitting':            { label: 'Essayage / Préparatifs',    emoji: '👗' },
  'meeting':            { label: 'Rendez-vous prestataire',   emoji: '🤝' },
  'other':              { label: 'Autre',                     emoji: '📌' },
}

/** Statuts d'un événement */
export type CoupleEventStatus = 'planning' | 'confirmed' | 'completed' | 'cancelled'

export const EVENT_STATUS_CONFIG: Record<CoupleEventStatus, { label: string; color: string; bgColor: string }> = {
  planning:  { label: 'En préparation', color: 'text-blue-700',  bgColor: 'bg-blue-50'  },
  confirmed: { label: 'Confirmé',       color: 'text-green-700', bgColor: 'bg-green-50' },
  completed: { label: 'Terminé',        color: 'text-gray-600',  bgColor: 'bg-gray-100' },
  cancelled: { label: 'Annulé',         color: 'text-red-700',   bgColor: 'bg-red-50'   },
}

/** Événement de la timeline d'un couple (table timeline_events) */
export interface TimelineEvent {
  id: string
  couple_id: string
  title: string
  description: string | null
  event_date: string
  status: CoupleEventStatus
  start_time: string | null
  end_time: string | null
  location: string | null
  category: EventCategory | null
  created_at: string
  updated_at: string
}

/** Données du formulaire de création/édition d'événement */
export interface TimelineEventFormData {
  title: string
  description: string
  event_date: Date | null
  status: CoupleEventStatus
  start_time: string
  end_time: string
  location: string
  category: EventCategory | ''
}

/** Valeur initiale du formulaire */
export const EMPTY_EVENT_FORM: TimelineEventFormData = {
  title: '',
  description: '',
  event_date: null,
  status: 'planning',
  start_time: '',
  end_time: '',
  location: '',
  category: '',
}

/**
 * Legacy aliases kept for any indirect imports.
 */
export type CoupleEvent = TimelineEvent
export type CoupleEventWithType = TimelineEvent
export type CoupleEventWithProviders = TimelineEvent
export type CoupleEventFormData = TimelineEventFormData

/** CulturalEventType stub — table does not exist in current schema */
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
