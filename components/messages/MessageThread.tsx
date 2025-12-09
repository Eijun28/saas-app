'use client'

import { useEffect, useState, useRef } from 'react'
// import { formatDistanceToNow } from 'date-fns'
// import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { getMessages, markAsRead } from '@/lib/supabase/messages'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import type { MessageThreadProps, Message } from '@/types/messages'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export function MessageThread({
  conversationId,
  userId,
  userType,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Charger les messages initiaux
  useEffect(() => {
    if (!conversationId) return

    const loadMessages = async () => {
      setLoading(true)
      try {
        const data = await getMessages(conversationId, 50)
        setMessages(data)
        setHasMore(data.length === 50)
        
        // Marquer comme lu
        await markAsRead(conversationId, userId)
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [conversationId, userId])

  // Scroll vers le bas quand nouveaux messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length])

  // Realtime subscription pour nouveaux messages
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message
          
          // Vérifier si le message n'est pas déjà dans la liste
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev
            }
            return [...prev, newMessage]
          })

          // Si c'est un message reçu, marquer comme lu
          if (newMessage.sender_id !== userId) {
            await markAsRead(conversationId, userId)
          }

          scrollToBottom()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, userId, supabase])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      const olderMessages = await getMessages(conversationId, 50, messages.length)
      
      if (olderMessages.length === 0) {
        setHasMore(false)
      } else {
        setMessages((prev) => [...olderMessages, ...prev])
        setHasMore(olderMessages.length === 50)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de plus de messages:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleMessageSent = () => {
    // Recharger les messages pour avoir les dernières données
    getMessages(conversationId, 50)
      .then((data) => {
        setMessages(data)
        scrollToBottom()
      })
      .catch(console.error)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="md" text="Chargement des messages..." />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Zone de messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement
          if (target.scrollTop === 0 && hasMore && !loadingMore) {
            loadMoreMessages()
          }
        }}
      >
        {loadingMore && (
          <div className="text-center py-2">
            <LoadingSpinner size="sm" text="Chargement..." />
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium mb-2">Aucun message</p>
              <p className="text-sm">Commencez la conversation !</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : null
              const showAvatar =
                !previousMessage ||
                previousMessage.sender_id !== message.sender_id ||
                new Date(message.created_at).getTime() -
                  new Date(previousMessage.created_at).getTime() >
                  300000 // 5 minutes

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender_id === userId}
                  showAvatar={showAvatar}
                />
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput
        conversationId={conversationId}
        senderId={userId}
        senderType={userType}
        onMessageSent={handleMessageSent}
      />
    </div>
  )
}

