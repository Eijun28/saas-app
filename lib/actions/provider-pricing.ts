'use server'

import { createClient } from '@/lib/supabase/server'
import type { ProviderPricing, ProviderPricingInsert, ProviderPricingUpdate } from '@/lib/types/pricing'

export async function getProviderPricing(providerId: string): Promise<ProviderPricing[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('provider_pricing')
    .select('*')
    .eq('provider_id', providerId)
    .order('display_order', { ascending: true })
    .order('is_primary', { ascending: false })

  if (error) {
    console.error('Error fetching provider pricing:', error)
    return []
  }

  return data || []
}

export async function addProviderPricing(pricing: ProviderPricingInsert): Promise<{ data: ProviderPricing | null; error: string | null }> {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return { data: null, error: 'Non authentifié' }
  }

  const { data, error } = await supabase
    .from('provider_pricing')
    .insert({
      ...pricing,
      provider_id: userData.user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding provider pricing:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function updateProviderPricing(
  id: string,
  updates: ProviderPricingUpdate
): Promise<{ data: ProviderPricing | null; error: string | null }> {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return { data: null, error: 'Non authentifié' }
  }

  const { data, error } = await supabase
    .from('provider_pricing')
    .update(updates)
    .eq('id', id)
    .eq('provider_id', userData.user.id) // Security: only own pricing
    .select()
    .single()

  if (error) {
    console.error('Error updating provider pricing:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function deleteProviderPricing(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return { error: 'Non authentifié' }
  }

  const { error } = await supabase
    .from('provider_pricing')
    .delete()
    .eq('id', id)
    .eq('provider_id', userData.user.id) // Security: only own pricing

  if (error) {
    console.error('Error deleting provider pricing:', error)
    return { error: error.message }
  }

  return { error: null }
}

export async function setPrimaryPricing(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return { error: 'Non authentifié' }
  }

  // The trigger will automatically unset other primaries
  const { error } = await supabase
    .from('provider_pricing')
    .update({ is_primary: true })
    .eq('id', id)
    .eq('provider_id', userData.user.id)

  if (error) {
    console.error('Error setting primary pricing:', error)
    return { error: error.message }
  }

  return { error: null }
}

export async function reorderPricing(orderedIds: string[]): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return { error: 'Non authentifié' }
  }

  // Update each pricing with its new order
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('provider_pricing')
      .update({ display_order: index })
      .eq('id', id)
      .eq('provider_id', userData.user.id)
  )

  const results = await Promise.all(updates)
  const hasError = results.some(r => r.error)

  if (hasError) {
    return { error: 'Erreur lors de la réorganisation' }
  }

  return { error: null }
}
