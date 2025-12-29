'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Send, Paperclip, Search } from 'lucide-react'
import { LoadingSpinner } from '@/components/prestataire/shared/LoadingSpinner'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import type { Conversation, Message, UIState } from '@/types/prestataire'
import { supabase } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'

export default function PrestataireMessageriePage() {
  const { user } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [uiState, setUiState] = useState<UIState>({
    loading: 'idle',
    error: null,
  })

  // Scroll automatique vers le bas quand nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch conversations from Supabase
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return

      setUiState({ loading: 'loading', error: null })
      
      try {
        // 1. Récupérer user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        if (authError || !authUser) throw new Error('Non authentifié')

        // 2. Fetch conversations du prestataire
        const { data: convs, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('provider_id', authUser.id)  // ⚠️ provider_id
          .eq('status', 'active')
          .order('last_message_at', { ascending: false, nullsFirst: false })

        if (error) throw error

        if (!convs || convs.length === 0) {
          setConversations([])
          setUiState({ loading: 'success', error: null })
          return
        }

        // 3. Récupérer les infos des couples
        const coupleIds = [...new Set(convs.map((c: any) => c.couple_id))]
        const { data: couplesData } = await supabase
          .from('couples')
          .select('user_id, partner_1_name, partner_2_name, email')
          .in('user_id', coupleIds)

        // Créer un map pour accéder rapidement aux infos couple
        const couplesMap = new Map()
        if (couplesData) {
          couplesData.forEach((couple: any) => {
            couplesMap.set(couple.user_id, couple)
          })
        }

        // 4. Pour chaque conversation, récupérer le dernier message (preview)
        const enrichedConvs = await Promise.all(
          convs.map(async (conv: any) => {
            // Fetch dernier message pour preview
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('content')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            const couple = couplesMap.get(conv.couple_id)

            return {
              ...conv,
              couple_name: couple?.partner_1_name && couple?.partner_2_name
                ? `${couple.partner_1_name} & ${couple.partner_2_name}`
                : couple?.partner_1_name || 'Couple',
              couple_email: couple?.email,
              last_message_preview: lastMsg?.content || 'Aucun message',
            }
          })
        )

        setConversations(enrichedConvs)
        setUiState({ loading: 'success', error: null })
      } catch (error) {
        console.error('Erreur fetch conversations:', error)
        setUiState({ loading: 'error', error: 'Erreur de chargement' })
      }
    }

    fetchConversations()
  }, [user])

  // Fetch messages from Supabase when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !user) return

    const fetchMessages = async () => {
      try {
        // 1. Récupérer user pour déterminer sender_type
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return

        // 2. Fetch tous les messages de la conversation
        const { data: msgs, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', selectedConversation)
          .order('created_at', { ascending: true })

        if (error) throw error

        // 3. Enrichir avec sender_type
        const enrichedMsgs = (msgs || []).map((msg: any) => ({
          ...msg,
          sender_type: msg.sender_id === authUser.id ? 'prestataire' : 'couple'
        }))

        setMessages(enrichedMsgs)

        // 4. Marquer messages comme lus (seulement ceux qui ne sont pas du prestataire)
        const messagesToMark = enrichedMsgs.filter(
          (msg: any) => msg.sender_id !== authUser.id && !msg.read_at
        )

        if (messagesToMark.length > 0) {
          // Mettre à jour read_at pour les messages non lus
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', messagesToMark.map((m: any) => m.id))
            .is('read_at', null)

          // Mettre à jour unread_count_provider dans la conversation
          await supabase
            .from('conversations')
            .update({ unread_count_provider: 0 })
            .eq('id', selectedConversation)
        }

        // 5. Rafraîchir conversations pour mettre à jour badge non lu
        // On va juste mettre à jour localement pour éviter un re-fetch complet
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation 
            ? { ...conv, unread_count_provider: 0 }
            : conv
        ))
      } catch (error) {
        console.error('Erreur chargement messages:', error)
      }
    }

    fetchMessages()
  }, [selectedConversation, user])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !user) return

    const messageContent = messageText.trim() // Sauvegarder avant clear

    try {
      // 1. Récupérer user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // 2. Clear input immédiatement (UX optimiste)
      setMessageText('')

      // 3. Insérer message
      const { data: newMsg, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: authUser.id,
          content: messageContent,  // ⚠️ content
          // read_at reste NULL par défaut
        })
        .select()
        .single()

      if (error) throw error

      // 4. Ajouter message optimiste à la liste (UX)
      const optimisticMsg: Message = {
        ...newMsg,
        sender_type: 'prestataire' as const
      }
      setMessages(prev => [...prev, optimisticMsg])

      // 5. Mettre à jour last_message_at dans la conversation
      await supabase
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedConversation)

      // 6. Rafraîchir conversations pour mettre à jour last_message_at et preview
      const { data: updatedConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', selectedConversation)
        .single()

      if (updatedConv) {
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation 
            ? { 
                ...conv, 
                last_message_at: updatedConv.last_message_at,
                last_message_preview: messageContent
              }
            : conv
        ).sort((a, b) => 
          new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
        ))
      }
    } catch (error) {
      console.error('Erreur envoi message:', error)
      // Restaurer le message en cas d'erreur
      setMessageText(messageContent)
    }
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Messagerie
        </h1>
        <p className="text-muted-foreground text-lg">
          Communiquez avec vos clients
        </p>
      </motion.div>

      {/* Chat Interface - 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des conversations */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <Card className="border-gray-200/50 h-[600px] flex flex-col">
            <CardContent className="p-0 flex flex-col h-full">
              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Conversations list */}
              <div className="flex-1 overflow-y-auto">
                {(() => {
                  // Filtrer conversations par recherche
                  const filteredConversations = conversations.filter(conv =>
                    !searchTerm || 
                    conv.couple_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    conv.couple_email?.toLowerCase().includes(searchTerm.toLowerCase())
                  )

                  if (filteredConversations.length === 0) {
                    return (
                      <div className="p-8 text-center">
                        <p className="text-muted-foreground text-sm">
                          {searchTerm ? 'Aucune conversation trouvée' : 'Aucune conversation'}
                        </p>
                      </div>
                    )
                  }

                  return (
                    <div className="divide-y divide-gray-200">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation.id)}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedConversation === conversation.id ? 'bg-[#9D5FA8]/10' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {conversation.couple_name || 'Couple'}
                            </h3>
                            {conversation.unread_count_provider > 0 && (
                              <Badge className="bg-[#823F91] text-white h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                                {conversation.unread_count_provider}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message_preview || 'Aucun message'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            }) : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )
                })()}
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
          <Card className="border-gray-200/50 h-[600px] flex flex-col">
            <CardContent className="p-0 flex flex-col h-full">
              {!selectedConversation ? (
                <div className="flex-1 flex items-center justify-center">
                  <EmptyState
                    title="Sélectionnez une conversation"
                    description="Choisissez une conversation dans la liste pour commencer à échanger"
                  />
                </div>
              ) : (
                <>
                  {/* Header conversation */}
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">
                      {currentConversation?.couple_name || 'Couple'}
                    </h3>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-8">
                        Aucun message. Commencez la conversation !
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${
                              message.sender_type === 'prestataire' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                message.sender_type === 'prestataire'
                                  ? 'bg-[#823F91] text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs mt-1 opacity-70">
                                {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Input zone */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Input
                        type="text"
                        placeholder="Tapez votre message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSendMessage()
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        className="bg-[#823F91] hover:bg-[#6D3478]"
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
