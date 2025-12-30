'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { Conversation, ConversationListProps } from '@/types/messages'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MessageSquare } from 'lucide-react'

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

    // S'abonner aux changements en temps réel
    const supabase = createClient()
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: userType === 'couple' ? `couple_id=eq.${userId}` : `prestataire_id=eq.${userId}`,
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

  const loadConversations = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          couple:couple_id(id, email, user_metadata),
          prestataire:prestataire_id(id, email, user_metadata)
        `)
        .eq(userType === 'couple' ? 'couple_id' : 'prestataire_id', userId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Erreur chargement conversations:', error)
        setConversations([])
      } else {
        setConversations((data as Conversation[]) || [])
      }
    } catch (err) {
      console.error('Erreur inattendue:', err)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium mb-2">Aucune conversation</p>
        <p className="text-sm text-gray-400">
          Vos conversations apparaîtront ici
        </p>
      </div>
    )
  }

  const getOtherUserInfo = (conversation: Conversation) => {
    if (userType === 'couple') {
      const prestataire = conversation.prestataire
      return {
        name: prestataire?.user_metadata?.nom_entreprise ||
              `${prestataire?.user_metadata?.prenom || ''} ${prestataire?.user_metadata?.nom || ''}`.trim() ||
              prestataire?.email ||
              'Prestataire',
        avatar: prestataire?.user_metadata?.avatar_url,
      }
    } else {
      const couple = conversation.couple
      return {
        name: `${couple?.user_metadata?.prenom || ''} ${couple?.user_metadata?.nom || ''}`.trim() ||
              couple?.email ||
              'Couple',
        avatar: couple?.user_metadata?.avatar_url,
      }
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => {
        const otherUser = getOtherUserInfo(conversation)
        const isSelected = selectedConversationId === conversation.id

        return (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
              isSelected ? 'bg-purple-50' : ''
            }`}
          >
            <Avatar className="flex-shrink-0">
              <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
              <AvatarFallback className="bg-purple-100 text-purple-700">
                {otherUser.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {otherUser.name}
                </h3>
                {conversation.last_message_at && (
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
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
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    {conversation.unread_count} nouveau{conversation.unread_count > 1 ? 'x' : ''}
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
