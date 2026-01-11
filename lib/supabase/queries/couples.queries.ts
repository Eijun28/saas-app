import { createClient } from '@/lib/supabase/client'
import type { Couple, CouplePreferences, CoupleWithPreferences } from '@/types/couples.types'

/**
 * Récupère le profil couple complet (avec préférences)
 */
export async function getCurrentCoupleProfile(): Promise<CoupleWithPreferences | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('couples')
    .select(`
      *,
      preferences:couple_preferences(*)
    `)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Profil n'existe pas encore
      return null
    }
    console.error('Error fetching couple profile:', error)
    throw error
  }

  return data as CoupleWithPreferences
}

/**
 * Crée un profil couple (données de base uniquement)
 */
export async function createCoupleProfile(data: Partial<Couple>): Promise<Couple> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: couple, error } = await supabase
    .from('couples')
    .insert({
      id: user.id,
      user_id: user.id,
      email: user.email!,
      currency: 'EUR',
      ...data
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating couple profile:', error)
    throw error
  }

  return couple as Couple
}

/**
 * Met à jour le profil couple (données de base)
 */
export async function updateCoupleProfile(updates: Partial<Couple>): Promise<Couple> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('couples')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating couple profile:', error)
    throw error
  }

  return data as Couple
}

/**
 * Crée les préférences du couple
 */
export async function createCouplePreferences(
  coupleId: string,
  preferences: Partial<CouplePreferences>
): Promise<CouplePreferences> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('couple_preferences')
    .insert({
      couple_id: coupleId,
      languages: ['français'],
      essential_services: [],
      optional_services: [],
      cultural_preferences: null,
      service_priorities: null,
      budget_breakdown: null,
      profile_completed: false,
      completion_percentage: 0,
      onboarding_step: 0,
      ...preferences
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating preferences:', error)
    throw error
  }

  return data as CouplePreferences
}

/**
 * Met à jour les préférences du couple
 */
export async function updateCouplePreferences(
  coupleId: string,
  updates: Partial<CouplePreferences>
): Promise<CouplePreferences> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('couple_preferences')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('couple_id', coupleId)
    .select()
    .single()

  if (error) {
    console.error('Error updating preferences:', error)
    throw error
  }

  return data as CouplePreferences
}

/**
 * Vérifie si le profil couple existe
 */
export async function checkCoupleProfileExists(): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { data, error } = await supabase
    .from('couples')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking couple profile:', error)
    return false
  }

  return !!data
}

/**
 * Récupère uniquement les préférences du couple
 */
export async function getCouplePreferences(coupleId: string): Promise<CouplePreferences | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('couple_preferences')
    .select('*')
    .eq('couple_id', coupleId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching preferences:', error)
    throw error
  }

  return data as CouplePreferences
}
