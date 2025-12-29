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

  useEffect(() => {
    loadConversations()
  }, [userId, userType])

  async function loadConversations() {
    try {
      const supabase = createClient()

      // TODO: Implémenter la requête réelle pour charger les conversations
      // Pour l'instant, stub vide
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`couple_id.eq.${userId},provider_id.eq.${userId}`)
        .order('updated_at', { ascending: false })

      if (error) {
        logger.error('Error loading conversations', error)
        return
      }

      // TODO: Transformer les données en format Conversation
      setConversations([])
    } catch (error) {
      logger.error('Error in loadConversations', error)
    } finally {
      setLoading(false)
    }
  }

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
    <div className="flex-1 overflow-y-auto">
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
              <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5">
                {conversation.unread_count}
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
