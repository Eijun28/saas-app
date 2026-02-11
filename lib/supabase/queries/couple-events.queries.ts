import { createClient } from '@/lib/supabase/client'
import type {
  CulturalEventType,
  CoupleEvent,
  CoupleEventWithType,
  CoupleEventWithProviders,
} from '@/types/cultural-events.types'

/**
 * Récupère tous les types d'événements culturels (référentiel)
 */
export async function getCulturalEventTypes(): Promise<CulturalEventType[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cultural_event_types')
    .select('*')
    .eq('is_active', true)
    .order('culture_category_id')
    .order('display_order')

  if (error) {
    console.error('Error fetching cultural event types:', error)
    return []
  }

  return data as CulturalEventType[]
}

/**
 * Récupère les types d'événements par catégorie culturelle
 */
export async function getCulturalEventTypesByCulture(
  cultureCategoryId: string
): Promise<CulturalEventType[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cultural_event_types')
    .select('*')
    .eq('culture_category_id', cultureCategoryId)
    .eq('is_active', true)
    .order('display_order')

  if (error) {
    console.error('Error fetching cultural event types by culture:', error)
    return []
  }

  return data as CulturalEventType[]
}

/**
 * Récupère tous les événements d'un couple (avec le type joint)
 */
export async function getCoupleEvents(coupleId: string): Promise<CoupleEventWithType[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('couple_events')
    .select(`
      *,
      event_type:cultural_event_types(*)
    `)
    .eq('couple_id', coupleId)
    .order('display_order')
    .order('event_date', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching couple events:', error)
    return []
  }

  return data as CoupleEventWithType[]
}

/**
 * Récupère un événement spécifique avec ses prestataires
 */
export async function getCoupleEvent(eventId: string): Promise<CoupleEventWithProviders | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('couple_events')
    .select(`
      *,
      event_type:cultural_event_types(*),
      providers:couple_event_providers(
        *,
        provider:profiles(id, nom_entreprise, avatar_url, service_type)
      )
    `)
    .eq('id', eventId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching couple event:', error)
    return null
  }

  return data as CoupleEventWithProviders
}

/**
 * Crée un nouvel événement pour un couple
 */
export async function createCoupleEvent(
  coupleId: string,
  eventData: Partial<CoupleEvent>
): Promise<CoupleEvent | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('couple_events')
    .insert({
      couple_id: coupleId,
      ...eventData,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating couple event:', error)
    throw error
  }

  return data as CoupleEvent
}

/**
 * Met à jour un événement existant
 */
export async function updateCoupleEvent(
  eventId: string,
  updates: Partial<CoupleEvent>
): Promise<CoupleEvent | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('couple_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single()

  if (error) {
    console.error('Error updating couple event:', error)
    throw error
  }

  return data as CoupleEvent
}

/**
 * Supprime un événement
 */
export async function deleteCoupleEvent(eventId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('couple_events')
    .delete()
    .eq('id', eventId)

  if (error) {
    console.error('Error deleting couple event:', error)
    throw error
  }
}
