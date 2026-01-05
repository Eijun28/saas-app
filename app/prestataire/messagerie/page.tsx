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

  // TODO: Fetch conversations from Supabase
  // Table: conversations
  // Filter: prestataire_id = current_user_id
  // Sort: dernier_message_at DESC
  useEffect(() => {
    const fetchConversations = async () => {
      setUiState({ loading: 'loading', error: null })
      
      try {
        // const { data, error } = await supabase
        //   .from('conversations')
        //   .select(`
        //     *,
        //     couple:couples(nom, prenom, avatar_url)
        //   `)
        //   .eq('prestataire_id', user.id)
        //   .order('dernier_message_at', { ascending: false })
        
        setUiState({ loading: 'success', error: null })
      } catch (error) {
        setUiState({ loading: 'error', error: 'Erreur de chargement' })
      }
    }

    // fetchConversations()
  }, [])

  // TODO: Fetch messages from Supabase when conversation is selected
  // Table: messages
  // Filter: conversation_id = selectedConversation
  // Sort: created_at ASC
  useEffect(() => {
    if (!selectedConversation) return

    const fetchMessages = async () => {
      try {
        // const { data, error } = await supabase
        //   .from('messages')
        //   .select('*')
        //   .eq('conversation_id', selectedConversation)
        //   .order('created_at', { ascending: true })
        
        setMessages([])
      } catch (error) {
        console.error('Erreur chargement messages', error)
      }
    }

    // fetchMessages()
  }, [selectedConversation])

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return

    // TODO: Send message to Supabase
    // Table: messages
    // Insert: conversation_id, sender_id, sender_type='prestataire', contenu, lu=false
    
    setMessageText('')
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
