import { createServerSupabaseClient } from '@/lib/config/supabase-server'
import type { Conversation, Message } from './messaging'

/**
 * Récupère toutes les conversations d'un utilisateur (côté serveur).
 *
 * Remplace l'ancien pattern N+1 (4 requêtes × N conversations) par 5 requêtes
 * batch indépendantes exécutées en parallèle, quelle que soit la taille de la liste.
 */
export async function getConversationsServer(userId: string): Promise<Conversation[]> {
  const supabase = await createServerSupabaseClient()

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, request_id, couple_id, provider_id, created_at')
    .or(`couple_id.eq.${userId},provider_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur récupération conversations:', error)
    throw error
  }

  if (!conversations || conversations.length === 0) {
    return []
  }

  const conversationIds = conversations.map(c => c.id)
  const requestIds = [...new Set(conversations.map(c => c.request_id).filter(Boolean))]

  // IDs de l'autre partie selon le rôle de l'utilisateur
  const providerIds = [...new Set(
    conversations.filter(c => c.couple_id === userId).map(c => c.provider_id)
  )]
  const coupleUserIds = [...new Set(
    conversations.filter(c => c.provider_id === userId).map(c => c.couple_id)
  )]

  // 5 requêtes batch en parallèle au lieu de 4 × N requêtes séquentielles
  const [requestsRes, profilesRes, couplesRes, lastMsgsRes, unreadRes] = await Promise.all([
    // 1. Toutes les demandes associées
    requestIds.length > 0
      ? supabase.from('requests').select('id, initial_message, status').in('id', requestIds)
      : Promise.resolve({ data: [] as Array<{ id: string; initial_message: string; status: string }>, error: null }),

    // 2. Profils prestataires (quand l'utilisateur est un couple)
    providerIds.length > 0
      ? supabase.from('profiles').select('id, prenom, nom, nom_entreprise, avatar_url').in('id', providerIds)
      : Promise.resolve({ data: [] as Array<{ id: string; prenom: string | null; nom: string | null; nom_entreprise: string | null; avatar_url: string | null }>, error: null }),

    // 3. Profils couple (quand l'utilisateur est un prestataire)
    coupleUserIds.length > 0
      ? supabase.from('couples').select('user_id, partner_1_name, partner_2_name').in('user_id', coupleUserIds)
      : Promise.resolve({ data: [] as Array<{ user_id: string; partner_1_name: string | null; partner_2_name: string | null }>, error: null }),

    // 4. Derniers messages : on récupère les N×5 plus récents, on déduplique en JS
    supabase
      .from('messages')
      .select('content, created_at, sender_id, conversation_id')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })
      .limit(conversationIds.length * 5),

    // 5. Messages non lus : seulement le champ conversation_id (léger)
    supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .is('read_at', null),
  ])

  // Maps pour accès O(1)
  const requestsMap = new Map((requestsRes.data ?? []).map(r => [r.id, r]))
  const profilesMap = new Map((profilesRes.data ?? []).map(p => [p.id, p]))
  const couplesMap = new Map((couplesRes.data ?? []).map(c => [c.user_id, c]))

  // Dernier message par conversation (premier après tri DESC = le plus récent)
  const lastMessageMap = new Map<string, { content: string; created_at: string; sender_id: string }>()
  for (const msg of (lastMsgsRes.data ?? [])) {
    if (!lastMessageMap.has(msg.conversation_id)) {
      lastMessageMap.set(msg.conversation_id, {
        content: msg.content,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
      })
    }
  }

  // Comptage non lus par conversation
  const unreadCountMap = new Map<string, number>()
  for (const msg of (unreadRes.data ?? [])) {
    unreadCountMap.set(msg.conversation_id, (unreadCountMap.get(msg.conversation_id) ?? 0) + 1)
  }

  return conversations.map(conv => {
    const otherPartyId = conv.couple_id === userId ? conv.provider_id : conv.couple_id
    const isCouple = conv.couple_id === userId

    let otherPartyName = 'Utilisateur'
    let otherPartyAvatar: string | null = null

    if (isCouple) {
      const profile = profilesMap.get(conv.provider_id)
      if (profile) {
        otherPartyName =
          profile.nom_entreprise ||
          `${profile.prenom || ''} ${profile.nom || ''}`.trim() ||
          'Prestataire'
        otherPartyAvatar = profile.avatar_url || null
      }
    } else {
      const couple = couplesMap.get(conv.couple_id)
      if (couple) {
        const name1 = couple.partner_1_name?.trim() || ''
        const name2 = couple.partner_2_name?.trim() || ''
        otherPartyName = name1 && name2 ? `${name1} & ${name2}` : name1 || name2 || 'Couple'
      }
    }

    const lastMessage = lastMessageMap.get(conv.id) ?? null
    const request = requestsMap.get(conv.request_id)

    return {
      ...conv,
      unread_count: unreadCountMap.get(conv.id) ?? 0,
      last_message_at: lastMessage?.created_at ?? null,
      request: request || undefined,
      other_party: {
        id: otherPartyId,
        name: otherPartyName,
        avatar_url: otherPartyAvatar,
      },
      last_message: lastMessage,
    }
  })
}

/**
 * Récupère les messages d'une conversation (côté serveur)
 */
export async function getMessagesServer(conversationId: string, limit = 50): Promise<Message[]> {
  const supabase = await createServerSupabaseClient()

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Erreur récupération messages:', error)
    throw error
  }

  return messages || []
}
