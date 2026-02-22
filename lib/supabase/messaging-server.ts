import { createServerSupabaseClient } from '@/lib/config/supabase-server'
import type { Conversation, Message } from './messaging'

/**
 * Récupère toutes les conversations d'un utilisateur (côté serveur)
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

  // Enrichir avec les requests, les profils, le dernier message et le nombre de messages non lus
  const enrichedConversations = await Promise.all(
    conversations.map(async (conv) => {
      const { data: request } = await supabase
        .from('requests')
        .select('id, initial_message, status')
        .eq('id', conv.request_id)
        .single()

      const otherPartyId = conv.couple_id === userId ? conv.provider_id : conv.couple_id
      const isCouple = conv.couple_id === userId

      let otherPartyName = 'Utilisateur'
      let otherPartyAvatar: string | null = null

      if (isCouple) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('prenom, nom, nom_entreprise, avatar_url')
          .eq('id', otherPartyId)
          .single()

        if (profile) {
          otherPartyName = profile.nom_entreprise || `${profile.prenom || ''} ${profile.nom || ''}`.trim() || 'Prestataire'
          otherPartyAvatar = profile.avatar_url || null
        }
      } else {
        const { data: couple } = await supabase
          .from('couples')
          .select('partner_1_name, partner_2_name')
          .eq('user_id', otherPartyId)
          .single()

        if (couple) {
          const name1 = couple.partner_1_name?.trim() || ''
          const name2 = couple.partner_2_name?.trim() || ''
          if (name1 && name2) {
            otherPartyName = `${name1} & ${name2}`
          } else if (name1) {
            otherPartyName = name1
          } else if (name2) {
            otherPartyName = name2
          }
        }
      }

      // Récupérer le dernier message de la conversation
      const { data: lastMessageData } = await supabase
        .from('messages')
        .select('content, created_at, sender_id')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Compter les messages non lus (messages où read_at est null et sender_id n'est pas l'utilisateur actuel)
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', userId)
        .is('read_at', null)

      return {
        ...conv,
        unread_count: unreadCount || 0,
        last_message_at: lastMessageData?.created_at || null,
        request: request || undefined,
        other_party: {
          id: otherPartyId,
          name: otherPartyName,
          avatar_url: otherPartyAvatar,
        },
        last_message: lastMessageData ? {
          content: lastMessageData.content,
          created_at: lastMessageData.created_at,
          sender_id: lastMessageData.sender_id,
        } : null,
      }
    })
  )

  return enrichedConversations
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
