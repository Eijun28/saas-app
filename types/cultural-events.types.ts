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

/** Visual config for event category cards (gradients, accent colors) */
export const EVENT_CATEGORY_VISUAL: Record<EventCategory, {
  gradient: string
  accent: string
  bgLight: string
  borderColor: string
}> = {
  'ceremony-civil':     { gradient: 'from-blue-500/10 to-indigo-500/10',   accent: 'text-blue-700',    bgLight: 'bg-blue-50',    borderColor: 'border-blue-200' },
  'ceremony-religious': { gradient: 'from-amber-500/10 to-orange-500/10',  accent: 'text-amber-700',   bgLight: 'bg-amber-50',   borderColor: 'border-amber-200' },
  'ceremony-cultural':  { gradient: 'from-pink-500/10 to-rose-500/10',    accent: 'text-pink-700',    bgLight: 'bg-pink-50',    borderColor: 'border-pink-200' },
  'cocktail':           { gradient: 'from-emerald-500/10 to-teal-500/10', accent: 'text-emerald-700', bgLight: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  'dinner':             { gradient: 'from-violet-500/10 to-purple-500/10', accent: 'text-violet-700',  bgLight: 'bg-violet-50',  borderColor: 'border-violet-200' },
  'party':              { gradient: 'from-fuchsia-500/10 to-pink-500/10', accent: 'text-fuchsia-700', bgLight: 'bg-fuchsia-50', borderColor: 'border-fuchsia-200' },
  'photo':              { gradient: 'from-cyan-500/10 to-sky-500/10',     accent: 'text-cyan-700',    bgLight: 'bg-cyan-50',    borderColor: 'border-cyan-200' },
  'fitting':            { gradient: 'from-rose-500/10 to-red-500/10',     accent: 'text-rose-700',    bgLight: 'bg-rose-50',    borderColor: 'border-rose-200' },
  'meeting':            { gradient: 'from-slate-500/10 to-gray-500/10',   accent: 'text-slate-700',   bgLight: 'bg-slate-50',   borderColor: 'border-slate-200' },
  'other':              { gradient: 'from-gray-500/10 to-stone-500/10',   accent: 'text-gray-700',    bgLight: 'bg-gray-50',    borderColor: 'border-gray-200' },
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
