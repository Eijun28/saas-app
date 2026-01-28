'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, MessageSquare, Search, UserRound, Check, CheckCheck } from 'lucide-react'
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
  const [prestataireAvatars, setPrestataireAvatars] = useState<Record<string, string>>({})
  const [lastMessages, setLastMessages] = useState<Record<string, { content: string; time: string; sender_id: string }>>({})

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
        .select('id, prestataire_id, couple_id, last_message, last_message_at, updated_at, created_at, status, unread_count_couple')
        .eq('couple_id', user.id)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false })

      if (error) {
        setConversations([])
      } else {
        setConversations(data || [])
        
        const names: Record<string, string> = {}
        const avatars: Record<string, string> = {}
        const lastMsgs: Record<string, { content: string; time: string; sender_id: string }> = {}
        
        if (data && data.length > 0) {
          // Charger tous les profils en une seule fois
          const prestataireIds = [...new Set(data.map(conv => conv.prestataire_id).filter(Boolean))]
          
          const [prestataireProfiles, profiles] = await Promise.all([
            prestataireIds.length > 0 ? supabase
              .from('prestataire_profiles')
              .select('user_id, nom_entreprise')
              .in('user_id', prestataireIds) : { data: null },
            prestataireIds.length > 0 ? supabase
              .from('profiles')
              .select('id, prenom, nom, avatar_url')
              .in('id', prestataireIds) : { data: null }
          ])
          
          const prestataireMap = new Map(prestataireProfiles.data?.map(p => [p.user_id, p]) || [])
          const profileMap = new Map(profiles.data?.map(p => [p.id, p]) || [])
          
          // Charger les derniers messages pour chaque conversation
          for (const conv of data) {
            if (conv.prestataire_id) {
              const prestataireProfile = prestataireMap.get(conv.prestataire_id)
              const profile = profileMap.get(conv.prestataire_id)
              
              // Nom de l'entreprise en priorité
              if (prestataireProfile?.nom_entreprise) {
                names[conv.id] = prestataireProfile.nom_entreprise
              } else if (profile) {
                names[conv.id] = `${profile.prenom || ''} ${profile.nom || ''}`.trim() || 'Prestataire'
              } else {
                names[conv.id] = 'Prestataire'
              }
              
              // Avatar
              if (profile?.avatar_url) {
                avatars[conv.id] = profile.avatar_url
              }
              
              // Dernier message
              if (conv.last_message) {
                const lastMsgDate = conv.last_message_at || conv.updated_at
                lastMsgs[conv.id] = {
                  content: conv.last_message,
                  time: lastMsgDate ? formatRelativeTime(lastMsgDate) : '',
                  sender_id: '' // On ne peut pas savoir sans charger les messages
                }
              }
            } else {
              names[conv.id] = 'Prestataire'
            }
          }
          
          // Charger les vrais derniers messages depuis la table messages
          const conversationIds = data.map(conv => conv.id)
          if (conversationIds.length > 0) {
            const { data: lastMessagesData } = await supabase
              .from('messages')
              .select('conversation_id, content, created_at, sender_id')
              .in('conversation_id', conversationIds)
              .order('created_at', { ascending: false })
            
            if (lastMessagesData) {
              const messagesByConv = new Map<string, { conversation_id: string; content: string; created_at: string; sender_id: string }>()
              for (const msg of lastMessagesData) {
                if (!messagesByConv.has(msg.conversation_id)) {
                  messagesByConv.set(msg.conversation_id, msg)
                }
              }
              
              messagesByConv.forEach((msg, convId) => {
                lastMsgs[convId] = {
                  content: msg.content,
                  time: formatRelativeTime(msg.created_at),
                  sender_id: msg.sender_id
                }
              })
            }
          }
        }
        
        setPrestataireNames(names)
        setPrestataireAvatars(avatars)
        setLastMessages(lastMsgs)
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

  // Format timestamp relatif style iPhone
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#4A4A4A]">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 md:p-6 pb-2"
        >
          <p className="text-sm md:text-base text-gray-600">Communiquez avec tous vos prestataires</p>
        </motion.div>

        <div className="flex-1 flex overflow-hidden">
          {/* Liste des conversations - Style iPhone */}
          <div className="w-full lg:w-[380px] xl:w-[420px] border-r border-gray-200 bg-white flex flex-col">
            {/* En-tête */}
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Messagerie</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un prestataire..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 h-9 sm:h-10 text-sm sm:text-base bg-gray-50 border-gray-200 focus:bg-white focus:border-gray-300 rounded-xl"
                />
              </div>
            </div>

            {/* Liste des conversations */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3">
              {conversations.length === 0 ? (
                <div className="flex-1 flex items-center justify-center px-4">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Aucune conversation</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 sm:space-y-2">
                  {conversations
                    .filter((conv) => {
                      if (!searchQuery.trim()) return true
                      const name = prestataireNames[conv.id] || 'Prestataire'
                      return name.toLowerCase().includes(searchQuery.toLowerCase())
                    })
                    .map((conv) => {
                      const name = prestataireNames[conv.id] || 'Prestataire'
                      const avatar = prestataireAvatars[conv.id]
                      const lastMsg = lastMessages[conv.id]
                      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
                      const isSelected = selectedConversation === conv.id
                      const unreadCount = conv.unread_count_couple || 0
                      const isFromMe = lastMsg?.sender_id === user?.id

                      return (
                        <div
                          key={conv.id}
                          onClick={() => {
                            setSelectedConversation(conv.id)
                            loadMessages(conv.id)
                          }}
                          className={`
                            bg-white rounded-xl p-2.5 sm:p-3 cursor-pointer transition-all active:scale-[0.98]
                            ${isSelected ? 'ring-2 ring-[#823F91] shadow-sm bg-[#F9F5FB]' : 'hover:shadow-sm border border-gray-100'}
                          `}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                                <AvatarImage src={avatar || undefined} alt={name} />
                                <AvatarFallback className="bg-gradient-to-br from-[#823F91] to-[#c081e3] text-white text-xs sm:text-sm font-semibold">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                            </div>

                            {/* Contenu */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5 sm:mb-1">
                                <h3 className={`font-semibold truncate text-sm sm:text-[15px] ${
                                  unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {name}
                                </h3>
                                {lastMsg && (
                                  <span className="text-[10px] sm:text-xs text-gray-500 flex-shrink-0 font-medium">
                                    {lastMsg.time}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                {lastMsg && (
                                  <>
                                    <p className={`text-xs sm:text-sm truncate flex-1 ${
                                      unreadCount > 0 
                                        ? 'text-gray-900 font-medium' 
                                        : 'text-gray-500'
                                    }`}>
                                      {lastMsg.content}
                                    </p>
                                    {/* Checkmarks pour les messages envoyés */}
                                    {isFromMe && (
                                      <div className="flex-shrink-0">
                                        <CheckCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#823F91]" />
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Badge messages non-lus style iPhone */}
                            {unreadCount > 0 && (
                              <div className="flex-shrink-0 min-w-[18px] sm:min-w-[20px] h-4.5 sm:h-5 px-1 sm:px-1.5 rounded-full bg-[#823F91] text-white text-[10px] sm:text-xs font-semibold flex items-center justify-center shadow-sm">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Zone de messages - Style iPhone */}
          <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
            {selectedConversation ? (
              <>
                {/* En-tête de conversation */}
                <div className="bg-white border-b border-gray-200 safe-area-top">
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Avatar avec status online */}
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                          <AvatarImage src={prestataireAvatars[selectedConversation] || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-[#823F91] to-[#c081e3] text-white text-xs sm:text-sm font-semibold">
                            {(prestataireNames[selectedConversation] || 'P').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Nom et statut */}
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-gray-900 truncate text-sm sm:text-base md:text-[17px]">
                          {prestataireNames[selectedConversation] || 'Messages'}
                        </h2>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate font-medium">
                          Hors ligne
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto bg-gray-50 px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 scroll-smooth"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(0, 0, 0, 0.1) transparent',
                  }}
                >
                  <div className="max-w-3xl mx-auto space-y-1">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Aucun message dans cette conversation</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isFromMe = msg.sender_id === user?.id
                      const prevMessage = index > 0 ? messages[index - 1] : null
                      const nextMessage = index < messages.length - 1 ? messages[index + 1] : null
                      const isConsecutive = prevMessage?.sender_id === msg.sender_id
                      const showTime = !nextMessage || nextMessage.sender_id !== msg.sender_id
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} ${
                            !isConsecutive ? 'mt-2' : 'mt-0.5'
                          }`}
                        >
                          <div className={`flex flex-col ${isFromMe ? 'items-end' : 'items-start'} max-w-[90%] xs:max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%]`}>
                            <div className="relative group">
                              <div
                                className={`relative rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 ${
                                  isFromMe
                                    ? 'bg-[#823F91] text-white rounded-br-sm'
                                    : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200 shadow-sm'
                                }`}
                                style={isFromMe ? { backgroundColor: '#823F91' } : {}}
                              >
                                {/* Contenu texte - FORCER LE BLANC pour les messages envoyés */}
                                <p 
                                  className={`text-sm sm:text-[15px] md:text-[16px] leading-relaxed whitespace-pre-wrap break-words select-text font-normal ${
                                    isFromMe ? 'text-white' : 'text-gray-900'
                                  }`}
                                  style={isFromMe ? { color: '#FFFFFF' } : {}}
                                >
                                  {msg.content}
                                </p>
                              </div>
                            </div>
                            
                            {/* Timestamp et checkmarks */}
                            {showTime && (
                              <div className="flex items-center gap-1 mt-0.5 px-1 sm:px-1.5">
                                <span className={`text-[10px] sm:text-[11px] ${
                                  isFromMe ? 'text-white/70' : 'text-gray-400'
                                }`}>
                                  {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {isFromMe && (
                                  <div className="flex-shrink-0">
                                    <CheckCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white/70" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                  </div>
                </div>

                {/* Zone de saisie - Style iPhone */}
                <div className="bg-white border-t border-gray-200/60 safe-area-bottom">
                  <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
                    <div className="flex items-end gap-2 bg-gray-100 rounded-full px-4 py-2.5 border border-gray-200/60 focus-within:bg-white focus-within:border-gray-300 focus-within:shadow-sm transition-all">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        placeholder="Message"
                        className="flex-1 bg-transparent border-0 resize-none outline-none text-[15px] sm:text-[16px] text-gray-900 placeholder:text-gray-500 min-h-[22px] max-h-[120px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] leading-relaxed"
                        rows={1}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                          newMessage.trim()
                            ? 'bg-[#007AFF] text-white shadow-sm hover:bg-[#0051D5] active:scale-95'
                            : 'bg-transparent text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Send className="h-4 w-4 sm:h-4.5 sm:w-4.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50 p-4 sm:p-6">
                <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 max-w-md w-full text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                    Sélectionnez une conversation
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 px-2">
                    Choisissez une conversation dans la liste pour commencer à discuter
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
