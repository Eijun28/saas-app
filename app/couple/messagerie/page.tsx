'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, MessageSquare, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { useRouter } from 'next/navigation'

export default function MessageriePage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [prestataireNames, setPrestataireNames] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/sign-in')
      return
    }
    if (user) {
      loadConversations()

      // Écouter les nouveaux messages en temps réel
      const supabase = createClient()
      const channel = supabase
        .channel('couple-conversations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `couple_id=eq.${user.id}`,
          },
          () => {
            loadConversations()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          () => {
            loadConversations()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, userLoading, router])

  const loadConversations = async () => {
    if (!user) {
      return
    }
    
    setLoading(true)
    const supabase = createClient()
    
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        setConversations([])
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('couple_id', user.id)
        .order('last_message_at', { ascending: false })

      if (error) {
        setConversations([])
      } else {
        setConversations(data || [])
        
        const names: Record<string, string> = {}
        
        if (data && data.length > 0) {
          for (const conv of data) {
            if (conv.prestataire_id) {
              try {
                const { data: prestataireProfile } = await supabase
                  .from('prestataire_profiles')
                  .select('nom_entreprise')
                  .eq('user_id', conv.prestataire_id)
                  .single()
                
                if (prestataireProfile?.nom_entreprise) {
                  names[conv.id] = prestataireProfile.nom_entreprise
                } else {
                  const { data: profileData } = await supabase
                    .from('profiles')
                    .select('prenom, nom')
                    .eq('id', conv.prestataire_id)
                    .single()
                  
                  if (profileData) {
                    names[conv.id] = `${profileData.prenom || ''} ${profileData.nom || ''}`.trim() || 'Prestataire'
                  } else {
                    names[conv.id] = 'Prestataire'
                  }
                }
              } catch (err) {
                names[conv.id] = 'Prestataire'
              }
            } else {
              names[conv.id] = 'Prestataire'
            }
          }
        }
        
        setPrestataireNames(names)
      }
    } catch (err) {
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      setMessages([])
    } else {
      setMessages(data || [])
    }

    // Marquer les messages comme lus
    if (user && data && data.length > 0) {
      const unreadMessages = data.filter((msg: any) => msg.sender_id !== user.id && !msg.is_read)
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map((msg: any) => msg.id)
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', messageIds)
      }
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return

    const supabase = createClient()
    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConversation,
      sender_id: user.id,
      content: newMessage.trim(),
    })

    if (!error) {
      setNewMessage('')
      loadMessages(selectedConversation)
      loadConversations()
    }
  }

  const getLastMessage = (conversationId: string) => {
    // Récupérer le dernier message de cette conversation depuis les messages chargés
    const convMessages = messages.filter(m => m.conversation_id === conversationId)
    if (convMessages.length > 0) {
      const lastMsg = convMessages[convMessages.length - 1]
      return {
        content: lastMsg.content,
        time: new Date(lastMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }
    }
    return null
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#4A4A4A]">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <p className="text-sm md:text-base text-[#4A4A4A]">Communiquez avec tous vos prestataires</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Liste des conversations */}
          <Card className="lg:col-span-1 border-gray-200">
            <CardHeader>
              <CardTitle className="text-[#0D0D0D]">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Barre de recherche */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                <Input
                  type="text"
                  placeholder="Rechercher un prestataire..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {conversations.length === 0 ? (
                <div className="text-center py-8 text-[#4A4A4A]">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune conversation</p>
                </div>
              ) : (
                conversations
                  .filter((conv) => {
                    if (!searchQuery.trim()) return true
                    const name = prestataireNames[conv.id] || 'Prestataire'
                    return name.toLowerCase().includes(searchQuery.toLowerCase())
                  })
                  .map((conv) => {
                  const lastMsg = getLastMessage(conv.id)
                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversation(conv.id)
                        loadMessages(conv.id)
                      }}
                      className={`w-full text-left p-4 rounded-lg transition-colors ${
                        selectedConversation === conv.id
                          ? 'bg-[#E8D4EF] text-[#823F91]'
                          : 'hover:bg-gray-50 text-[#4A4A4A]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-[#1F2937]">
                          {prestataireNames[conv.id] || 'Prestataire'}
                        </h3>
                        {lastMsg && (
                          <span className="text-xs text-[#374151]">{lastMsg.time}</span>
                        )}
                      </div>
                      {lastMsg && (
                        <p className="text-sm text-[#374151] truncate">{lastMsg.content}</p>
                      )}
                    </button>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Zone de messages */}
          <Card className="lg:col-span-2 flex flex-col border-gray-200">
            {selectedConversation ? (
              <>
                <CardHeader>
                  <CardTitle className="text-[#0D0D0D]">
                    {prestataireNames[selectedConversation] || 'Messages'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  <div className="flex-1 space-y-4 mb-4 overflow-y-auto max-h-[400px] md:max-h-[500px] p-4 md:p-6">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-[#4A4A4A]">
                        <p>Aucun message dans cette conversation</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              msg.sender_id === user?.id
                                ? 'bg-[#823F91] text-white'
                                : 'bg-[#E8D4EF] text-[#0D0D0D]'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                msg.sender_id === user?.id ? 'text-white/70' : 'text-[#4A4A4A]'
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-gray-200 p-4">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            sendMessage()
                          }
                        }}
                        placeholder="Tapez votre message..."
                        className="flex-1 border-gray-200 focus-visible:ring-[#823F91]"
                      />
                      <Button
                        onClick={sendMessage}
                        className="bg-[#823F91] hover:bg-[#6A1FA8] text-white"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-[#4A4A4A]">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>Sélectionnez une conversation pour commencer</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
