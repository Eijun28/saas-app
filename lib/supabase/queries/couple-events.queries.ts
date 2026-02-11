import { createClient } from '@/lib/supabase/client'
import type { TimelineEvent } from '@/types/cultural-events.types'

/**
 * Récupère tous les événements d'un couple
 */
export async function getCoupleEvents(coupleId: string): Promise<TimelineEvent[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('timeline_events')
    .select('*')
    .eq('couple_id', coupleId)
    .order('event_date', { ascending: true })

  if (error) {
    console.error('Error fetching couple events:', error)
    return []
  }

  return data as TimelineEvent[]
}

/**
 * Récupère un événement spécifique
 */
export async function getCoupleEvent(eventId: string): Promise<TimelineEvent | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('timeline_events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching couple event:', error)
    return null
  }

  return data as TimelineEvent
}

/**
 * Crée un nouvel événement pour un couple
 */
export async function createCoupleEvent(
  coupleId: string,
  eventData: { title: string; description?: string | null; event_date: string }
): Promise<TimelineEvent | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('timeline_events')
    .insert({
      couple_id: coupleId,
      title: eventData.title,
      description: eventData.description || null,
      event_date: eventData.event_date,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating couple event:', error)
    throw error
  }

  return data as TimelineEvent
}

/**
 * Met à jour un événement existant
 */
export async function updateCoupleEvent(
  eventId: string,
  updates: { title?: string; description?: string | null; event_date?: string }
): Promise<TimelineEvent | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('timeline_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single()

  if (error) {
    console.error('Error updating couple event:', error)
    throw error
  }

  return data as TimelineEvent
}

/**
 * Supprime un événement
 */
export async function deleteCoupleEvent(eventId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('timeline_events')
    .delete()
    .eq('id', eventId)

  if (error) {
    console.error('Error deleting couple event:', error)
    throw error
  }
}
