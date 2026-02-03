'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

interface MessageListProps {
  conversationId: string
  initialMessages: Message[]
  currentUserId: string
}

export function MessageList({ conversationId, initialMessages, currentUserId }: MessageListProps) {
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const messageDate = new Date(dateString)
    
    // Si le message est d'aujourd'hui, afficher seulement l'heure
    if (messageDate.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
    
    // Sinon, afficher la date
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  // Grouper les messages par date et par expéditeur consécutif
  const groupedMessages = messages.reduce((groups: Array<{ date: string; items: Message[] }>, message) => {
    const date = new Date(message.created_at).toDateString()
    const lastGroup = groups[groups.length - 1]
    
    if (lastGroup && lastGroup.date === date) {
      lastGroup.items.push(message)
    } else {
      groups.push({ date, items: [message] })
    }
    
    return groups
  }, [])

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-white px-3 sm:px-4 py-3 sm:py-4 scroll-smooth"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(0, 0, 0, 0.1) transparent'
      }}
    >
      <div className="max-w-3xl mx-auto space-y-1">
        {groupedMessages.map((group, groupIndex) => (
          <div key={group.date}>
            {/* Date separator */}
            {groupIndex > 0 && (
              <div className="flex items-center justify-center my-5 sm:my-6">
                <div className="bg-gray-100/80 backdrop-blur-sm px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs text-gray-500 font-medium">
                  {new Date(group.date).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </div>
              </div>
            )}
            
            <div className="space-y-0.5">
              {group.items.map((message, index) => {
                const isOwn = message.sender_id === currentUserId
                const prevMessage = index > 0 ? group.items[index - 1] : null
                const nextMessage = index < group.items.length - 1 ? group.items[index + 1] : null
                const isConsecutive = prevMessage?.sender_id === message.sender_id
                const showTime = !nextMessage || nextMessage.sender_id !== message.sender_id
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${!isConsecutive ? 'mt-2' : 'mt-0.5'}`}
                  >
                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%] md:max-w-[70%]`}>
                      <div
                        className={`relative rounded-3xl px-4 py-2.5 transition-all duration-200 ${
                          isOwn
                            ? 'bg-white border border-[#823F91]/30 text-gray-900 rounded-br-sm'
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}
                        style={{
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)'
                        }}
                      >
                        <p
                          className="text-[15px] sm:text-[16px] leading-relaxed whitespace-pre-wrap break-words select-text font-normal text-gray-900"
                          style={{ color: '#111827' }}
                        >
                          {message.content}
                        </p>
                      </div>
                      
                      {showTime && (
                        <span 
                          className={`text-[11px] text-gray-400 mt-0.5 px-1.5 ${isOwn ? 'text-right' : 'text-left'}`}
                        >
                          {formatTime(message.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] sm:min-h-[calc(100vh-250px)] px-4 pt-12 sm:pt-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#007AFF]/10 to-[#0051D5]/10 flex items-center justify-center mb-4 sm:mb-5">
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 text-[#007AFF]"
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
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
              Aucun message
            </h3>
            <p className="text-sm sm:text-[15px] text-gray-500 text-center max-w-sm leading-relaxed px-2">
              Envoyez le premier message pour commencer la conversation
            </p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
