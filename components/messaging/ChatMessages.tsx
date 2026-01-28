'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Check, CheckCheck, MoreVertical, Copy, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Message } from '@/lib/supabase/messaging'

interface ChatMessagesProps {
  conversationId: string
  initialMessages: Message[]
  currentUserId: string
}

export function ChatMessages({
  conversationId,
  initialMessages,
  currentUserId,
}: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Subscribe to new messages via Realtime
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
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((prev) => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase])

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  // Format date pour séparateurs
  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (messageDate.getTime() === today.getTime()) {
      return 'Aujourd\'hui'
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Hier'
    } else {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    }
  }

  // Grouper les messages par date
  const groupedMessages = messages.reduce(
    (groups: Array<{ date: string; items: Message[] }>, message) => {
      const dateKey = new Date(message.created_at).toDateString()
      const lastGroup = groups[groups.length - 1]

      if (lastGroup && lastGroup.date === dateKey) {
        lastGroup.items.push(message)
      } else {
        groups.push({ date: dateKey, items: [message] })
      }

      return groups
    },
    []
  )

  // Copier le texte d'un message
  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('Message copié')
    } catch (error) {
      toast.error('Erreur lors de la copie')
    }
  }

  // Supprimer un message
  const handleDelete = async (messageId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return

    try {
      const { error } = await supabase.from('messages').delete().eq('id', messageId)

      if (error) throw error

      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      toast.success('Message supprimé')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  // Rendre les médias (images/vidéos)
  const renderMedia = (media: Message['media']) => {
    if (!media || media.length === 0) return null

    if (media.length === 1) {
      const item = media[0]
      if (item.type === 'image') {
        return (
          <img
            src={item.url}
            alt="Image"
            className="rounded-lg max-w-full h-auto mt-2"
          />
        )
      }
      if (item.type === 'video') {
        return (
          <video
            src={item.url}
            controls
            className="rounded-lg max-w-full h-auto mt-2"
            poster={item.thumbnail_url}
          />
        )
      }
      return null
    }

    // Grille 2x2 pour plusieurs médias
    if (media.length <= 4) {
      return (
        <div className={`grid gap-1 mt-2 ${media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {media.slice(0, 4).map((item, idx) => (
            <div key={idx} className="relative aspect-square">
              {item.type === 'image' ? (
                <img
                  src={item.url}
                  alt={`Image ${idx + 1}`}
                  className="rounded-lg w-full h-full object-cover"
                />
              ) : (
                <video
                  src={item.url}
                  controls
                  className="rounded-lg w-full h-full object-cover"
                  poster={item.thumbnail_url}
                />
              )}
            </div>
          ))}
        </div>
      )
    }

    // Plus de 4 médias - grille avec overlay
    return (
      <div className="grid grid-cols-2 gap-1 mt-2 relative">
        {media.slice(0, 4).map((item, idx) => (
          <div key={idx} className="relative aspect-square">
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt={`Image ${idx + 1}`}
                className="rounded-lg w-full h-full object-cover"
              />
            ) : (
              <video
                src={item.url}
                controls
                className="rounded-lg w-full h-full object-cover"
                poster={item.thumbnail_url}
              />
            )}
          </div>
        ))}
        {media.length > 4 && (
          <div className="absolute bottom-1 right-1 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
            +{media.length - 4}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-gray-50 px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 scroll-smooth"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(0, 0, 0, 0.1) transparent',
      }}
    >
      <div className="max-w-3xl mx-auto space-y-1">
        {groupedMessages.map((group, groupIndex) => (
          <div key={group.date}>
            {/* Séparateur de date */}
            {groupIndex > 0 && (
              <div className="flex items-center justify-center my-5 sm:my-6">
                <div className="bg-white px-4 py-1.5 rounded-full text-xs text-gray-500 font-medium shadow-sm border border-gray-200">
                  {formatDateSeparator(group.items[0].created_at)}
                </div>
              </div>
            )}

            <div className="space-y-0.5">
              {group.items.map((message, index) => {
                const isOwn = message.sender_id === currentUserId
                const prevMessage = index > 0 ? group.items[index - 1] : null
                const nextMessage =
                  index < group.items.length - 1 ? group.items[index + 1] : null
                const isConsecutive = prevMessage?.sender_id === message.sender_id
                const showTime =
                  !nextMessage || nextMessage.sender_id !== message.sender_id
                const isRead = !!message.read_at

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                      !isConsecutive ? 'mt-2' : 'mt-0.5'
                    }`}
                  >
                    <div
                      className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[90%] xs:max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%]`}
                    >
                      <div className="relative group">
                        <div
                          className={`relative rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 ${
                            isOwn
                              ? 'bg-[#823F91] text-white rounded-br-sm'
                              : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200 shadow-sm'
                          }`}
                        >
                          {/* Contenu texte */}
                          {message.content && (
                            <p className={`text-sm sm:text-[15px] md:text-[16px] leading-relaxed whitespace-pre-wrap break-words select-text font-normal ${
                              isOwn ? 'text-white' : 'text-gray-900'
                            }`}>
                              {message.content}
                            </p>
                          )}

                          {/* Médias */}
                          {message.media && renderMedia(message.media)}

                          {/* Menu contextuel */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                                  isOwn
                                    ? 'bg-white/20 hover:bg-white/30 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                }`}
                                aria-label="Menu message"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleCopy(message.content)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copier
                              </DropdownMenuItem>
                              {isOwn && (
                                <DropdownMenuItem
                                  onClick={() => handleDelete(message.id)}
                                  variant="destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Timestamp et checkmarks */}
                      {showTime && (
                        <div className="flex items-center gap-1 mt-0.5 px-1 sm:px-1.5">
                          <span className="text-[10px] sm:text-[11px] text-gray-400">
                            {formatTime(message.created_at)}
                          </span>
                          {isOwn && (
                            <div className="flex-shrink-0">
                              {isRead ? (
                                <CheckCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
                              ) : (
                                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] sm:min-h-[calc(100vh-200px)] md:min-h-[calc(100vh-250px)] px-3 sm:px-4 pt-8 sm:pt-12 md:pt-16">
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 max-w-sm w-full text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337L5.845 21.5 4.5 18.375l1.395-3.72C4.512 14.042 3 13.074 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                  />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                Aucun message
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 px-2">
                Envoyez le premier message pour commencer la conversation
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
