'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Message, MessageThreadProps } from '@/types/messages'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Send } from 'lucide-react'

export function MessageThread({ conversationId, userId, userType }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
    markAsRead()

    // S'abonner aux nouveaux messages en temps réel
    const supabase = createClient()
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
          scrollToBottom()
          markAsRead()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(id, email, user_metadata)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erreur chargement messages:', error)
        setMessages([])
      } else {
        setMessages((data as Message[]) || [])
      }
    } catch (err) {
      console.error('Erreur inattendue:', err)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async () => {
    const supabase = createClient()

    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .is('read_at', null)
    } catch (err) {
      console.error('Erreur marquage lu:', err)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          sender_type: userType,
          content: newMessage.trim(),
          content_type: 'text',
        })

      if (error) {
        console.error('Erreur envoi message:', error)
        alert('Erreur lors de l\'envoi du message')
      } else {
        setNewMessage('')

        // Mettre à jour la conversation
        await supabase
          .from('conversations')
          .update({
            last_message: newMessage.trim(),
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversationId)
      }
    } catch (err) {
      console.error('Erreur inattendue:', err)
      alert('Erreur lors de l\'envoi du message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement des messages..." />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Aucun message. Commencez la conversation !</p>
          </div>
        ) : (
          messages.map((message) => {
            const isSender = message.sender_id === userId
            const senderName = message.sender
              ? `${message.sender.user_metadata?.prenom || ''} ${message.sender.user_metadata?.nom || ''}`.trim() ||
                message.sender.email ||
                'Utilisateur'
              : 'Utilisateur'

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isSender ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar className="flex-shrink-0 h-8 w-8">
                  <AvatarImage
                    src={message.sender?.user_metadata?.avatar_url}
                    alt={senderName}
                  />
                  <AvatarFallback className={isSender ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}>
                    {senderName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className={`flex flex-col gap-1 max-w-[70%] ${isSender ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isSender
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de message */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message..."
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-purple-600 hover:bg-purple-700 text-white h-[60px] px-4"
          >
            {sending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Appuyez sur Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne
        </p>
      </div>
    </div>
  )
}
