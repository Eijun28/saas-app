'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Conversation, ConversationListProps } from '@/types/messages'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

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

  const loadConversations = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      const query = supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false })

      if (userType === 'couple') {
        query.eq('couple_id', userId)
      } else {
        query.eq('provider_id', userId)
      }

      const { data, error } = await query

      if (error) throw error
      setConversations(data || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-gray-500 mb-2">Aucune conversation</p>
        <p className="text-sm text-gray-400">
          Vos conversations apparaîtront ici
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => {
        const isSelected = conversation.id === selectedConversationId
        const initials = userType === 'couple'
          ? 'P'
          : 'C'

        return (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`w-full p-4 flex items-start gap-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-gray-50' : ''
            }`}
          >
            <Avatar className="flex-shrink-0">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <h3 className="font-medium text-gray-900 truncate text-sm">
                  {userType === 'couple' ? 'Prestataire' : 'Couple'}
                </h3>
                {conversation.last_message_at && (
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatDistanceToNow(new Date(conversation.last_message_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                )}
              </div>

              {conversation.last_message && (
                <p className="text-sm text-gray-600 truncate">
                  {conversation.last_message}
                </p>
              )}

              {conversation.unread_count > 0 && (
                <div className="mt-1">
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-[#823F91] rounded-full">
                    {conversation.unread_count}
                  </span>
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
