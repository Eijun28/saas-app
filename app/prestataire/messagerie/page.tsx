'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, MessageSquare } from 'lucide-react'
import { LoadingSpinner } from '@/components/prestataire/shared/LoadingSpinner'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Conversation, Message, UIState } from '@/lib/types/prestataire'
import { MessageInput } from '@/components/messages/MessageInput'
import { AttachmentPreview } from '@/components/messages/AttachmentPreview'
import Image from 'next/image'
import type { Attachment } from '@/types/messages'

export default function PrestataireMessageriePage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [uiState, setUiState] = useState<UIState>({
    loading: 'idle',
    error: null,
  })
  const [coupleAvatars, setCoupleAvatars] = useState<Record<string, string>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { user } = useUser()

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!user) return

    const fetchConversations = async () => {
      setUiState({ loading: 'loading', error: null })
      
      try {
        const supabase = createClient()
        
        const { data: conversationsData, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('provider_id', user.id)
          .order('last_message_at', { ascending: false })

        if (error) {
          const ignorableErrorCodes = ['42P01', 'PGRST116', 'PGRST301']
          const ignorableMessages = ['does not exist', 'permission denied', 'no rows returned']
          
          const isIgnorableError = ignorableErrorCodes.includes(error.code) || 
            ignorableMessages.some(msg => error.message?.toLowerCase().includes(msg.toLowerCase()))
          
          if (!isIgnorableError) {
            if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('timeout')) {
              throw error
            }
          }
        }
        
        if (!conversationsData || conversationsData.length === 0) {
          setConversations([])
          setUiState({ loading: 'success', error: null })
          return
        }

        const coupleIds = [...new Set((conversationsData || []).map((c: any) => c.couple_id).filter(Boolean))]
        
        let couplesMap = new Map()
        const avatars: Record<string, string> = {}
        
        if (coupleIds.length > 0) {
          const { data: couplesData } = await supabase
            .from('couples')
            .select('user_id, partner_1_name, partner_2_name')
            .in('user_id', coupleIds)
          
          if (couplesData) {
            couplesMap = new Map(couplesData.map((c: any) => [c.user_id, c]))
          }
        }

        const enrichedConversations = await Promise.all(
          (conversationsData || []).map(async (conv: any) => {
            const { data: lastMessage } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            const { count: unreadCount } = await supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .is('read_at', null)
              .neq('sender_id', user.id)

            const couple = couplesMap.get(conv.couple_id)
            let coupleNom = 'Couple'
            
            if (couple) {
              const name1 = couple.partner_1_name?.trim() || ''
              const name2 = couple.partner_2_name?.trim() || ''
              if (name1 && name2) {
                coupleNom = `${name1} & ${name2}`
              } else if (name1) {
                coupleNom = name1
              } else if (name2) {
                coupleNom = name2
              }
            }

            return {
              id: conv.id,
              couple_id: conv.couple_id,
              couple_nom: coupleNom,
              dernier_message: lastMessage?.content || '',
              dernier_message_at: lastMessage?.created_at || conv.last_message_at || conv.created_at,
              non_lu: (unreadCount || 0) > 0,
            } as Conversation
          })
        )

        setConversations(enrichedConversations)
        setCoupleAvatars(avatars)
        setUiState({ loading: 'success', error: null })
      } catch (error: any) {
        console.error('Erreur chargement conversations:', error)
        const ignorableErrorCodes = ['42P01', 'PGRST116', 'PGRST301']
        const ignorableMessages = ['does not exist', 'permission denied', 'no rows returned']
        
        const isIgnorableError = ignorableErrorCodes.includes(error?.code) || 
          ignorableMessages.some(msg => error?.message?.toLowerCase().includes(msg.toLowerCase()))
        
        if (isIgnorableError) {
          setConversations([])
          setUiState({ loading: 'success', error: null })
          return
        }
        
        const isNetworkError = error?.message?.includes('fetch') || 
          error?.message?.includes('network') || 
          error?.message?.includes('timeout')
        
        if (!isNetworkError) {
          setConversations([])
          setUiState({ loading: 'success', error: null })
          return
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Erreur de chargement'
        toast.error('Erreur lors du chargement des conversations')
        setUiState({ loading: 'error', error: errorMessage })
      }
    }

    fetchConversations()
  }, [user])

  useEffect(() => {
    if (!selectedConversation || !user) return

    const fetchMessages = async () => {
      try {
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(prenom, nom, avatar_url)
          `)
          .eq('conversation_id', selectedConversation)
          .order('created_at', { ascending: true })

        if (error) throw error

        // Parser les messages avec attachments
        const formattedMessages: Message[] = (data || []).map((msg: any) => {
          let content = msg.content
          let attachments: Attachment[] | undefined = undefined

          try {
            const parsed = JSON.parse(msg.content)
            if (parsed.attachments) {
              content = parsed.text || ''
              attachments = parsed.attachments
            }
          } catch {
            // C'est du texte normal
          }

          return {
            id: msg.id,
            conversation_id: msg.conversation_id,
            sender_id: msg.sender_id,
            sender_type: msg.sender_id === user.id ? 'prestataire' : 'couple',
            contenu: content,
            created_at: msg.created_at,
            lu: msg.read_at !== null,
            attachments,
          }
        })

        setMessages(formattedMessages)

        // Marquer les messages comme lus
        const unreadMessages = formattedMessages.filter(
          m => !m.lu && m.sender_id !== user.id
        )

        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadMessages.map(m => m.id))
        }
      } catch (error) {
        console.error('Erreur chargement messages', error)
        toast.error('Erreur lors du chargement des messages')
      }
    }

    fetchMessages()

    // Real-time: écouter les nouveaux messages
    if (typeof window === 'undefined') return
    
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    try {
      channel = supabase
        .channel(`messages:${selectedConversation}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation}`
          },
          (payload) => {
            const newMessage = payload.new as {
              id: string
              conversation_id: string
              sender_id: string
              content: string
              read_at: string | null
              created_at: string
            }
            
            let content = newMessage.content
            let attachments: Attachment[] | undefined = undefined

            try {
              const parsed = JSON.parse(newMessage.content)
              if (parsed.attachments) {
                content = parsed.text || ''
                attachments = parsed.attachments
              }
            } catch {
              // C'est du texte normal
            }

            const formattedMessage: Message = {
              id: newMessage.id,
              conversation_id: newMessage.conversation_id,
              sender_id: newMessage.sender_id,
              sender_type: newMessage.sender_id === user.id ? 'prestataire' : 'couple',
              contenu: content,
              created_at: newMessage.created_at,
              lu: newMessage.read_at !== null,
              attachments,
            }
            setMessages(prev => [...prev, formattedMessage])
            
            // Marquer comme lu si c'est le prestataire qui reçoit
            if (newMessage.sender_id !== user.id) {
              supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', newMessage.id)
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Subscription réussie
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('Erreur de subscription Realtime, utilisation du polling')
          }
        })
    } catch (error) {
      console.warn('Erreur lors de la configuration Realtime:', error)
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedConversation, user])

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (uiState.loading === 'loading') {
    return <LoadingSpinner size="lg" text="Chargement de la messagerie..." />
  }

  const currentConversation = conversations.find(c => c.id === selectedConversation)

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent mb-2">
          Messagerie
        </h1>
        <p className="text-[#823F91]/70 text-lg">
          Communiquez avec vos clients
        </p>
      </motion.div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
        {/* Liste des conversations */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <Card className="border-[#823F91]/20 bg-background h-full flex flex-col shadow-lg">
            <CardContent className="p-0 flex flex-col h-full">
              {/* Search */}
              <div className="p-4 border-b border-[#823F91]/20 bg-background">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#823F91]/50" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 border-[#823F91]/20 focus:border-[#823F91] focus:ring-[#823F91]/20"
                  />
                </div>
              </div>

              {/* Conversations list */}
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-muted-foreground text-sm">
                      Aucune conversation
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {conversations
                      .filter(conv => {
                        if (!searchTerm) return true
                        return conv.couple_nom.toLowerCase().includes(searchTerm.toLowerCase())
                      })
                      .map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => handleSelectConversation(conversation.id)}
                          className={`p-4 cursor-pointer transition-all ${
                            selectedConversation === conversation.id 
                              ? 'bg-gradient-to-r from-[#823F91]/20 via-[#9D5FA8]/20 to-[#823F91]/20 border-l-4 border-[#823F91]' 
                              : 'hover:bg-gradient-to-r hover:from-[#823F91]/10 hover:via-[#9D5FA8]/10 hover:to-[#823F91]/10'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            {/* Avatar */}
                            <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center">
                              {coupleAvatars[conversation.id] ? (
                                <Image
                                  src={coupleAvatars[conversation.id]}
                                  alt={conversation.couple_nom}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : (
                                <span className="text-white font-semibold text-xs">
                                  {getInitials(conversation.couple_nom)}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className={`font-semibold truncate ${
                                  selectedConversation === conversation.id 
                                    ? 'text-[#823F91]' 
                                    : 'text-gray-900'
                                }`}>
                                  {conversation.couple_nom}
                                </h3>
                                {conversation.non_lu && (
                                  <Badge className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs shadow-md shadow-[#823F91]/30">
                                    1
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.dernier_message || 'Aucun message'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(conversation.dernier_message_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Zone de chat */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="border-[#823F91]/20 bg-background h-full flex flex-col shadow-lg">
            <CardContent className="p-0 flex flex-col h-full">
              {!selectedConversation ? (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                  <EmptyState
                    title="Sélectionnez une conversation"
                    description="Choisissez une conversation dans la liste pour commencer à échanger"
                  />
                </div>
              ) : (
                <>
                  {/* Header conversation */}
                  <div className="p-4 border-b border-[#823F91]/20 bg-white">
                    <h3 className="font-semibold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent">
                      {currentConversation?.couple_nom}
                    </h3>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-gray-50">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-12">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucun message. Commencez la conversation !</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${
                            message.sender_type === 'prestataire' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div className={`max-w-[75%] md:max-w-[65%] space-y-2`}>
                            <div
                              className={`rounded-2xl px-4 py-3 shadow-sm ${
                                message.sender_type === 'prestataire'
                                  ? 'bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white shadow-[#823F91]/30'
                                  : 'bg-white border border-gray-200 text-gray-900'
                              }`}
                            >
                              {message.contenu && (
                                <p className="text-sm whitespace-pre-wrap break-words">{message.contenu}</p>
                              )}
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2">
                                  <AttachmentPreview attachments={message.attachments} />
                                </div>
                              )}
                              <p className="text-xs mt-2 opacity-70">
                                {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input zone */}
                  {user && (
                    <MessageInput
                      conversationId={selectedConversation}
                      senderId={user.id}
                      onMessageSent={async () => {
                        // Recharger les conversations
                        const supabase = createClient()
                        const { data: conversationsData } = await supabase
                          .from('conversations')
                          .select('*')
                          .eq('provider_id', user.id)
                          .order('last_message_at', { ascending: false })

                        if (conversationsData) {
                          const enrichedConversations = await Promise.all(
                            conversationsData.map(async (conv: any) => {
                              const { data: lastMessage } = await supabase
                                .from('messages')
                                .select('content, created_at')
                                .eq('conversation_id', conv.id)
                                .order('created_at', { ascending: false })
                                .limit(1)
                                .single()

                              const { count: unreadCount } = await supabase
                                .from('messages')
                                .select('id', { count: 'exact', head: true })
                                .eq('conversation_id', conv.id)
                                .is('read_at', null)
                                .neq('sender_id', user.id)

                              // Récupérer le nom du couple
                              let coupleNom = 'Couple'
                              if (conv.couple_id) {
                                const { data: coupleData } = await supabase
                                  .from('couples')
                                  .select('partner_1_name, partner_2_name')
                                  .eq('user_id', conv.couple_id)
                                  .single()
                                
                                if (coupleData) {
                                  const name1 = coupleData.partner_1_name?.trim() || ''
                                  const name2 = coupleData.partner_2_name?.trim() || ''
                                  if (name1 && name2) {
                                    coupleNom = `${name1} & ${name2}`
                                  } else if (name1) {
                                    coupleNom = name1
                                  } else if (name2) {
                                    coupleNom = name2
                                  }
                                }
                              }

                              return {
                                id: conv.id,
                                couple_id: conv.couple_id,
                                couple_nom: coupleNom,
                                dernier_message: lastMessage?.content || '',
                                dernier_message_at: lastMessage?.created_at || conv.last_message_at || conv.created_at,
                                non_lu: (unreadCount || 0) > 0,
                              } as Conversation
                            })
                          )
                          setConversations(enrichedConversations)
                        }
                      }}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
