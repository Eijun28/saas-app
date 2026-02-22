'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import type { UserType } from '@/types/messages'

interface ConversationListProps {
  userId: string
  userType: UserType
  onSelectConversation: (conversationId: string) => void
  selectedConversationId?: string
}

interface Conversation {
  id: string
  other_user_name: string
  last_message: string
  last_message_at: string
  unread_count: number
}

export function ConversationList({
  userId,
  userType,
  onSelectConversation,
  selectedConversationId,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)


  async function loadConversations() {
    try {
      const supabase = createClient()

      const column = userType === 'couple' ? 'couple_id' : 'prestataire_id'
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq(column, userId)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false })

      if (error) {
        logger.error('Error loading conversations', error)
        return
      }

      // Transformer les données en format Conversation
      const enrichedConversations = await Promise.all(
        (data || []).map(async (conv: any) => {
          let otherUserName = 'Utilisateur'
          
          if (userType === 'couple') {
            // Récupérer le nom du prestataire
            const { data: prestataireProfile } = await supabase
              .from('prestataire_profiles')
              .select('nom_entreprise')
              .eq('user_id', conv.prestataire_id)
              .single()
            
            if (prestataireProfile?.nom_entreprise) {
              otherUserName = prestataireProfile.nom_entreprise
            } else {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('prenom, nom')
                .eq('id', conv.prestataire_id)
                .single()
              
              if (profileData) {
                otherUserName = `${profileData.prenom || ''} ${profileData.nom || ''}`.trim() || 'Prestataire'
              }
            }
          } else {
            // Récupérer le nom du couple
            const { data: coupleProfile } = await supabase
              .from('profiles')
              .select('prenom, nom')
              .eq('id', conv.couple_id)
              .single()
            
            if (coupleProfile) {
              otherUserName = `${coupleProfile.prenom || ''} ${coupleProfile.nom || ''}`.trim() || 'Couple'
            }
          }

          return {
            id: conv.id,
            other_user_name: otherUserName,
            last_message: conv.last_message || '',
            last_message_at: conv.last_message_at || conv.updated_at,
            unread_count: conv.unread_count || 0,
          }
        })
      )

      setConversations(enrichedConversations)
    } catch (error) {
      logger.error('Error in loadConversations', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!userId || !userType) return

    loadConversations()

    // Écouter les nouveaux messages en temps réel
    const supabase = createClient()
    const channel = supabase
      .channel(`conversations-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          loadConversations()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, userType])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-gray-500">Chargement des conversations...</p>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Aucune conversation</p>
          <p className="text-sm text-gray-400">
            Vos conversations apparaîtront ici
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelectConversation(conversation.id)}
          className={`w-full p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left ${
            selectedConversationId === conversation.id ? 'bg-gray-100' : ''
          }`}
        >
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-gray-900">
              {conversation.other_user_name}
            </h3>
            {conversation.unread_count > 0 && (
              <span className="bg-[#823F91] text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] flex items-center justify-center">
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 truncate">
            {conversation.last_message}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(conversation.last_message_at).toLocaleDateString('fr-FR')}
          </p>
        </button>
      ))}
    </div>
  )
}
