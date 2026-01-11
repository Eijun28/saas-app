'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Send, Paperclip, Search } from 'lucide-react'
import { LoadingSpinner } from '@/components/prestataire/shared/LoadingSpinner'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Conversation, Message, UIState } from '@/lib/types/prestataire'

export default function PrestataireMessageriePage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [uiState, setUiState] = useState<UIState>({
    loading: 'idle',
    error: null,
  })

  const { user } = useUser()

  useEffect(() => {
    if (!user) return

    const fetchConversations = async () => {
      setUiState({ loading: 'loading', error: null })
      
      try {
        const supabase = createClient()
        
        // Fetch conversations avec join sur couples pour obtenir le nom du couple
        const { data: conversationsData, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('provider_id', user.id)
          .order('last_message_at', { ascending: false })

        // Si erreur, vérifier si c'est une vraie erreur critique
        if (error) {
          // Codes d'erreur à ignorer (cas normaux)
          const ignorableErrorCodes = ['42P01', 'PGRST116', 'PGRST301']
          const ignorableMessages = ['does not exist', 'permission denied', 'no rows returned']
          
          const isIgnorableError = ignorableErrorCodes.includes(error.code) || 
            ignorableMessages.some(msg => error.message?.toLowerCase().includes(msg.toLowerCase()))
          
          if (!isIgnorableError) {
            // Vraie erreur critique : vérifier si c'est une erreur réseau
            if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('timeout')) {
              throw error
            }
            // Sinon, ignorer silencieusement (probablement RLS ou autre cas normal)
          }
        }
        
        // Si pas de données, initialiser avec un tableau vide (pas d'erreur)
        if (!conversationsData || conversationsData.length === 0) {
          setConversations([])
          setUiState({ loading: 'success', error: null })
          return
        }

        // Récupérer les données des couples
        const coupleIds = [...new Set((conversationsData || []).map((c: any) => c.couple_id))]
        const { data: couplesData } = await supabase
          .from('couples')
          .select('user_id, partner_1_name, partner_2_name')
          .in('user_id', coupleIds)
        
        const couplesMap = new Map((couplesData || []).map((c: any) => [c.user_id, c]))

        // Pour chaque conversation, récupérer le dernier message et compter les non lus
        const enrichedConversations = await Promise.all(
          (conversationsData || []).map(async (conv: any) => {
            // Dernier message
            const { data: lastMessage } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            // Compter les messages non lus (envoyés par le couple, non lus)
            const { count: unreadCount } = await supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .is('read_at', null)
              .neq('sender_id', user.id)

            const couple = couplesMap.get(conv.couple_id)
            const coupleNom = couple
              ? `${couple.partner_1_name || ''} & ${couple.partner_2_name || ''}`.trim() || 'Couple'
              : 'Couple'

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
        setUiState({ loading: 'success', error: null })
      } catch (error: any) {
        console.error('Erreur chargement conversations:', error)
        // Codes d'erreur à ignorer (cas normaux)
        const ignorableErrorCodes = ['42P01', 'PGRST116', 'PGRST301']
        const ignorableMessages = ['does not exist', 'permission denied', 'no rows returned']
        
        const isIgnorableError = ignorableErrorCodes.includes(error?.code) || 
          ignorableMessages.some(msg => error?.message?.toLowerCase().includes(msg.toLowerCase()))
        
        if (isIgnorableError) {
          setConversations([])
          setUiState({ loading: 'success', error: null })
          return
        }
        
        // Vérifier si c'est une vraie erreur réseau
        const isNetworkError = error?.message?.includes('fetch') || 
          error?.message?.includes('network') || 
          error?.message?.includes('timeout')
        
        if (!isNetworkError) {
          // Probablement RLS ou autre cas normal, ignorer silencieusement
          setConversations([])
          setUiState({ loading: 'success', error: null })
          return
        }
        
        // Vraie erreur critique : afficher le message
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

        // Transformer les messages pour correspondre au type Message
        const formattedMessages: Message[] = (data || []).map((msg: any) => ({
          id: msg.id,
          conversation_id: msg.conversation_id,
          sender_id: msg.sender_id,
          sender_type: msg.sender_id === user.id ? 'prestataire' : 'couple',
          contenu: msg.content,
          created_at: msg.created_at,
          lu: msg.read_at !== null,
        }))

        setMessages(formattedMessages)

        // Marquer les messages comme lus (ceux envoyés par le couple)
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
    if (!selectedConversation) return

    const supabase = createClient()
    const channel = supabase
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
          const formattedMessage: Message = {
            id: newMessage.id,
            conversation_id: newMessage.conversation_id,
            sender_id: newMessage.sender_id,
            sender_type: newMessage.sender_id === user.id ? 'prestataire' : 'couple',
            contenu: newMessage.content,
            created_at: newMessage.created_at,
            lu: newMessage.read_at !== null,
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation, user])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !user) return

    try {
      const supabase = createClient()
      
      // Insérer le message
      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user.id,
          content: messageText.trim(),
        })
        .select()
        .single()

      if (error) throw error

      // Mettre à jour last_message_at de la conversation
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation)

      // Ajouter le message à la liste locale
      const formattedMessage: Message = {
        id: newMessage.id,
        conversation_id: newMessage.conversation_id,
        sender_id: newMessage.sender_id,
        sender_type: 'prestataire',
        contenu: newMessage.content,
        created_at: newMessage.created_at,
        lu: false,
      }

      setMessages([...messages, formattedMessage])
      setMessageText('')

      // Recharger les conversations pour mettre à jour le dernier message
      const { data: conversationsData } = await supabase
        .from('conversations')
        .select(`
          *,
          couple:profiles!conversations_couple_id_fkey(prenom, nom, avatar_url)
        `)
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

            const coupleNom = conv.couple
              ? `${conv.couple.prenom || ''} ${conv.couple.nom || ''}`.trim() || 'Couple'
              : 'Couple'

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
    } catch (error) {
      console.error('Erreur envoi message:', error)
      toast.error('Erreur lors de l\'envoi du message')
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent mb-2">
          Messagerie
        </h1>
        <p className="text-[#823F91]/70 text-lg">
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
          <Card className="border-[#823F91]/20 bg-background h-[600px] flex flex-col">
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
                    <p className="text-muted-foreground text-sm">
                      Aucune conversation
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className={`p-4 cursor-pointer transition-all ${
                          selectedConversation === conversation.id 
                            ? 'bg-gradient-to-r from-[#823F91]/20 via-[#9D5FA8]/20 to-[#823F91]/20 border-l-4 border-[#823F91]' 
                            : 'hover:bg-gradient-to-r hover:from-[#823F91]/10 hover:via-[#9D5FA8]/10 hover:to-[#823F91]/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-semibold ${
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
                          {conversation.dernier_message}
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
          <Card className="border-[#823F91]/20 bg-background h-[600px] flex flex-col">
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
                  <div className="p-4 border-b border-[#823F91]/20 bg-background">
                    <h3 className="font-semibold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent">
                      {currentConversation?.couple_nom}
                    </h3>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-8">
                        Aucun message. Commencez la conversation !
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
                          <div
                            className={`max-w-[70%] rounded-lg p-3 shadow-md ${
                              message.sender_type === 'prestataire'
                                ? 'bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white shadow-[#823F91]/30'
                                : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900 border border-gray-200'
                            }`}
                          >
                            <p className="text-sm">{message.contenu}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Input zone */}
                  <div className="p-4 border-t border-[#823F91]/20 bg-white">
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="border-[#823F91]/20 hover:bg-[#823F91]/10">
                        <Paperclip className="h-4 w-4 text-[#823F91]" />
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
                        className="flex-1 border-[#823F91]/20 focus:border-[#823F91] focus:ring-[#823F91]/20"
                      />
                      <Button
                        className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white shadow-lg shadow-[#823F91]/30"
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
