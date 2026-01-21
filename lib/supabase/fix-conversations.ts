/**
 * Fonction utilitaire pour créer les conversations manquantes
 * pour les demandes acceptées qui n'ont pas de conversation associée
 */

import { createClient } from '@/lib/supabase/client'

export async function createMissingConversations() {
  const supabase = createClient()

  // Récupérer toutes les demandes acceptées sans conversation
  const { data: acceptedRequests, error: requestsError } = await supabase
    .from('requests')
    .select('id, couple_id, provider_id, status')
    .eq('status', 'accepted')

  if (requestsError) {
    console.error('Erreur récupération demandes acceptées:', requestsError)
    return { success: false, error: requestsError }
  }

  if (!acceptedRequests || acceptedRequests.length === 0) {
    return { success: true, created: 0, message: 'Aucune demande acceptée trouvée' }
  }

  // Vérifier quelles demandes n'ont pas de conversation
  const requestIds = acceptedRequests.map(r => r.id)
  const { data: existingConversations, error: convError } = await supabase
    .from('conversations')
    .select('request_id')
    .in('request_id', requestIds)

  if (convError) {
    console.error('Erreur récupération conversations:', convError)
    return { success: false, error: convError }
  }

  const existingRequestIds = new Set(existingConversations?.map(c => c.request_id) || [])
  const missingRequests = acceptedRequests.filter(r => !existingRequestIds.has(r.id))

  if (missingRequests.length === 0) {
    return { success: true, created: 0, message: 'Toutes les conversations existent déjà' }
  }

  // Créer les conversations manquantes
  const conversationsToCreate = missingRequests.map(r => ({
    request_id: r.id,
    couple_id: r.couple_id,
    provider_id: r.provider_id,
  }))

  const { data: createdConversations, error: createError } = await supabase
    .from('conversations')
    .insert(conversationsToCreate)
    .select('id')

  if (createError) {
    console.error('Erreur création conversations:', createError)
    return { success: false, error: createError }
  }

  return {
    success: true,
    created: createdConversations?.length || 0,
    message: `${createdConversations?.length || 0} conversation(s) créée(s)`,
  }
}
