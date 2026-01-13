'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MessageSquare, Search, User, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { useRouter } from 'next/navigation'
import { MessageInput } from '@/components/messages/MessageInput'
import { AttachmentPreview } from '@/components/messages/AttachmentPreview'
import { ProfilePreviewDialog } from '@/components/provider/ProfilePreviewDialog'
import { CULTURES } from '@/lib/constants/cultures'
import { DEPARTEMENTS } from '@/lib/constants/zones'
import { toast } from 'sonner'
import Image from 'next/image'
import type { Attachment } from '@/types/messages'

export default function MessageriePage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  interface Conversation {
    id: string
    couple_id: string
    prestataire_id: string
    provider_id?: string // Alias pour compatibilité
    last_message_at: string | null
    created_at: string
  }

  interface Message {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    read_at: string | null
    created_at: string
    attachments?: Attachment[]
  }

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [prestataireNames, setPrestataireNames] = useState<Record<string, string>>({})
  const [prestataireAvatars, setPrestataireAvatars] = useState<Record<string, string>>({})
  const [prestataireIds, setPrestataireIds] = useState<Record<string, string>>({}) // conversationId -> providerId
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const [selectedProviderProfile, setSelectedProviderProfile] = useState<any>(null)
  const [selectedProviderCultures, setSelectedProviderCultures] = useState<Array<{ id: string; label: string }>>([])
  const [selectedProviderZones, setSelectedProviderZones] = useState<Array<{ id: string; label: string }>>([])
  const [selectedProviderPortfolio, setSelectedProviderPortfolio] = useState<Array<{ id: string; image_url: string; title?: string }>>([])

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/sign-in')
      return
    }
    if (user) {
      loadConversations()
    }
  }, [user, userLoading, router])

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time: écouter les nouveaux messages
  useEffect(() => {
    if (!selectedConversation || !user) return
    // Vérifier que nous sommes côté client et que WebSocket est disponible
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
            const newMessage = payload.new as Message
            // Parser le contenu si c'est du JSON avec attachments
            try {
              const parsed = JSON.parse(newMessage.content)
              if (parsed.attachments) {
                newMessage.content = parsed.text || ''
                newMessage.attachments = parsed.attachments
              }
            } catch {
              // C'est du texte normal
            }
            setMessages(prev => [...prev, newMessage])
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Subscription réussie
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('Erreur de subscription Realtime, utilisation du polling')
            // En cas d'erreur, on peut recharger périodiquement les messages
          }
        })
    } catch (error) {
      console.warn('Erreur lors de la configuration Realtime:', error)
      // En cas d'erreur WebSocket, on continue sans real-time
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedConversation, user])

  const loadConversations = async () => {
    if (!user) return
    
    setLoading(true)
    const supabase = createClient()
    
    try {
      // Récupérer le couple_id depuis couples (couple_id référence couples(id), pas auth.users(id))
      const { data: couple } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!couple) {
        setConversations([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('couple_id', couple.id)
        .order('last_message_at', { ascending: false })

      if (error) {
        setConversations([])
      } else {
        setConversations(data || [])
        
        const names: Record<string, string> = {}
        const avatars: Record<string, string> = {}
        const providerIdsMap: Record<string, string> = {}
        
        if (data && data.length > 0) {
          const prestataireIdsList = [...new Set(data.map((conv: Conversation) => conv.prestataire_id || conv.provider_id).filter(Boolean))]
          
          if (prestataireIdsList.length > 0) {
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, prenom, nom, nom_entreprise, avatar_url')
              .in('id', prestataireIdsList)
            
            if (profilesError) {
              console.error('Erreur chargement profils:', profilesError)
            }
            
            data.forEach((conv: Conversation) => {
              const providerId = conv.prestataire_id || conv.provider_id
              if (providerId) {
                providerIdsMap[conv.id] = providerId
              }
              
              const profile = profiles?.find(p => p.id === providerId)
              
              if (profile) {
                if (profile.nom_entreprise) {
                  names[conv.id] = profile.nom_entreprise
                } else if (profile.prenom || profile.nom) {
                  names[conv.id] = `${profile.prenom || ''} ${profile.nom || ''}`.trim()
                }
                if (profile.avatar_url) {
                  avatars[conv.id] = profile.avatar_url
                }
              }
            })
          }
        }
        
        setPrestataireNames(names)
        setPrestataireAvatars(avatars)
        setPrestataireIds(providerIdsMap)
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
      // Parser les messages avec attachments
      const parsedMessages = (data || []).map((msg: any) => {
        try {
          const parsed = JSON.parse(msg.content)
          if (parsed.attachments) {
            return {
              ...msg,
              content: parsed.text || '',
              attachments: parsed.attachments,
            }
          }
        } catch {
          // C'est du texte normal
        }
        return msg
      })
      setMessages(parsedMessages)
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId)
    loadMessages(conversationId)
  }

  const getLastMessage = (conversationId: string) => {
    const convMessages = messages.filter((m: Message) => m.conversation_id === conversationId)
    if (convMessages.length > 0) {
      const lastMsg = convMessages[convMessages.length - 1]
      let preview = lastMsg.content
      if (lastMsg.attachments && lastMsg.attachments.length > 0) {
        preview = `📎 ${lastMsg.attachments.length} fichier${lastMsg.attachments.length > 1 ? 's' : ''}`
      }
      return {
        content: preview,
        time: new Date(lastMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }
    }
    return null
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleProviderClick = async (conversationId: string) => {
    const providerId = prestataireIds[conversationId]
    if (!providerId) {
      console.warn('Pas de providerId pour la conversation:', conversationId)
      return
    }

    const supabase = createClient()
    
    try {
      // Charger le profil complet
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', providerId)
        .single()

      if (profileError || !profile) {
        console.error('Erreur chargement profil:', profileError)
        toast.error('Impossible de charger le profil')
        return
      }

      // Charger les cultures, zones et portfolio en parallèle
      const [culturesResult, zonesResult, portfolioResult] = await Promise.all([
        supabase.from('provider_cultures').select('culture_id').eq('profile_id', providerId),
        supabase.from('provider_zones').select('zone_id').eq('profile_id', providerId),
        supabase.from('provider_portfolio').select('id, image_url, title').eq('profile_id', providerId).order('display_order', { ascending: true })
      ])

      // Mapper les cultures et zones
      const cultures = (culturesResult.data || []).map(c => {
        const culture = CULTURES.find(cult => cult.id === c.culture_id)
        return culture ? { id: c.culture_id, label: culture.label } : null
      }).filter(Boolean) as Array<{ id: string; label: string }>

      const zones = (zonesResult.data || []).map(z => {
        const zone = DEPARTEMENTS.find(dept => dept.id === z.zone_id)
        return zone ? { id: z.zone_id, label: zone.label } : null
      }).filter(Boolean) as Array<{ id: string; label: string }>

      const portfolio = (portfolioResult.data || []).map(p => ({
        id: p.id,
        image_url: p.image_url,
        title: p.title || undefined,
      }))

      setSelectedProviderProfile(profile)
      setSelectedProviderCultures(cultures)
      setSelectedProviderZones(zones)
      setSelectedProviderPortfolio(portfolio)
      setSelectedProviderId(providerId)
    } catch (error) {
      console.error('Erreur chargement profil:', error)
      toast.error('Erreur lors du chargement du profil')
    }
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#823F91] mb-4"></div>
          <p className="text-[#4A4A4A]">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent mb-2">
            Messagerie
          </h1>
          <p className="text-gray-600 text-lg">Communiquez avec tous vos prestataires</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 h-[calc(100vh-200px)]">
          {/* Liste des conversations */}
          <Card className={`lg:col-span-1 border-gray-200 shadow-lg flex flex-col overflow-hidden ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
            <CardHeader className="border-b border-gray-200 bg-white">
              <CardTitle className="text-[#0D0D0D] flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#823F91]" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              {/* Barre de recherche */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                  <Input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-200 focus-visible:ring-[#823F91]"
                  />
                </div>
              </div>

              {/* Liste */}
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-[#4A4A4A]">Aucune conversation</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {conversations
                      .filter((conv: Conversation) => {
                        if (!searchQuery.trim()) return true
                        const name = prestataireNames[conv.id] || 'Prestataire'
                        return name.toLowerCase().includes(searchQuery.toLowerCase())
                      })
                      .map((conv: Conversation) => {
                        const lastMsg = getLastMessage(conv.id)
                        const avatar = prestataireAvatars[conv.id]
                        const name = prestataireNames[conv.id] || 'Prestataire'
                        
                        return (
                          <div
                            key={conv.id}
                            className={`w-full transition-all ${
                              selectedConversation === conv.id
                                ? 'bg-gradient-to-r from-[#823F91]/10 via-[#9D5FA8]/10 to-[#823F91]/10 border-l-4 border-[#823F91]'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3 p-4">
                              {/* Avatar cliquable */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (prestataireIds[conv.id]) {
                                    handleProviderClick(conv.id)
                                  }
                                }}
                                className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center hover:ring-2 hover:ring-[#823F91] transition-all cursor-pointer"
                              >
                                {avatar ? (
                                  <Image
                                    src={avatar}
                                    alt={name}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                  />
                                ) : (
                                  <span className="text-white font-semibold text-sm">
                                    {getInitials(name)}
                                  </span>
                                )}
                              </div>

                              {/* Contenu cliquable pour sélectionner la conversation */}
                              <button
                                onClick={() => handleSelectConversation(conv.id)}
                                className="flex-1 min-w-0 text-left"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className={`font-semibold truncate hover:text-[#823F91] transition-colors ${
                                    selectedConversation === conv.id ? 'text-[#823F91]' : 'text-[#1F2937]'
                                  }`}>
                                    {name}
                                  </h3>
                                  {lastMsg && (
                                    <span className="text-xs text-[#374151] flex-shrink-0 ml-2">
                                      {lastMsg.time}
                                    </span>
                                  )}
                                </div>
                                {lastMsg && (
                                  <p className="text-sm text-[#374151] truncate">{lastMsg.content}</p>
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Zone de messages */}
          <Card className="lg:col-span-2 flex flex-col border-gray-200 shadow-lg overflow-hidden">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b border-gray-200 bg-white">
                  <div className="flex items-center gap-3">
                    {/* Bouton retour sur mobile */}
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Retour à la liste"
                    >
                      <ArrowLeft className="h-5 w-5 text-[#823F91]" />
                    </button>
                    
                    {prestataireAvatars[selectedConversation] && (
                      <button
                        onClick={() => handleProviderClick(selectedConversation)}
                        className="relative h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-[#823F91] to-[#9D5FA8] hover:ring-2 hover:ring-[#823F91] transition-all cursor-pointer flex-shrink-0"
                      >
                        <Image
                          src={prestataireAvatars[selectedConversation]}
                          alt={prestataireNames[selectedConversation] || 'Prestataire'}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </button>
                    )}
                    <button
                      onClick={() => handleProviderClick(selectedConversation)}
                      className="text-left flex-1 min-w-0"
                    >
                      <CardTitle className="text-[#0D0D0D] hover:text-[#823F91] transition-colors cursor-pointer truncate">
                        {prestataireNames[selectedConversation] || 'Messages'}
                      </CardTitle>
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gradient-to-b from-white to-gray-50">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-[#4A4A4A]">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucun message dans cette conversation</p>
                        <p className="text-sm text-gray-500 mt-2">Commencez la conversation !</p>
                      </div>
                    ) : (
                      messages.map((msg: Message) => {
                        const isSender = msg.sender_id === user?.id
                        let messageContent = msg.content
                        let attachments: Attachment[] | undefined = msg.attachments

                        // Parser si nécessaire
                        if (!attachments) {
                          try {
                            const parsed = JSON.parse(msg.content)
                            if (parsed.attachments) {
                              messageContent = parsed.text || ''
                              attachments = parsed.attachments
                            }
                          } catch {
                            // C'est du texte normal
                          }
                        }

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[75%] md:max-w-[65%] space-y-2`}>
                              <div
                                className={`rounded-2xl px-4 py-3 shadow-sm ${
                                  isSender
                                    ? 'bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white'
                                    : 'bg-white border border-gray-200 text-[#0D0D0D]'
                                }`}
                              >
                                {messageContent && (
                                  <p className="text-sm whitespace-pre-wrap break-words">{messageContent}</p>
                                )}
                                {attachments && attachments.length > 0 && (
                                  <div className="mt-2">
                                    <AttachmentPreview attachments={attachments} />
                                  </div>
                                )}
                                <p
                                  className={`text-xs mt-2 ${
                                    isSender ? 'text-white/70' : 'text-[#4A4A4A]'
                                  }`}
                                >
                                  {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <MessageInput
                    conversationId={selectedConversation}
                    senderId={user!.id}
                    onMessageSent={() => {
                      loadMessages(selectedConversation)
                      loadConversations()
                    }}
                  />
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                <div className="text-center text-[#4A4A4A]">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Sélectionnez une conversation</p>
                  <p className="text-sm text-gray-500">Choisissez une conversation pour commencer à échanger</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Dialog profil prestataire */}
      {selectedProviderId && selectedProviderProfile && user && (
        <ProfilePreviewDialog
          userId={selectedProviderId}
          profile={{
            nom_entreprise: selectedProviderProfile.nom_entreprise || '',
            service_type: selectedProviderProfile.service_type || '',
            avatar_url: selectedProviderProfile.avatar_url || undefined,
            prenom: selectedProviderProfile.prenom,
            nom: selectedProviderProfile.nom,
            description_courte: selectedProviderProfile.description_courte || undefined,
            bio: selectedProviderProfile.bio || undefined,
            budget_min: selectedProviderProfile.budget_min || undefined,
            budget_max: selectedProviderProfile.budget_max || undefined,
            ville_principale: selectedProviderProfile.ville_principale || undefined,
            annees_experience: selectedProviderProfile.annees_experience || undefined,
            is_early_adopter: selectedProviderProfile.is_early_adopter || false,
            instagram_url: selectedProviderProfile.instagram_url || null,
            facebook_url: selectedProviderProfile.facebook_url || null,
            website_url: selectedProviderProfile.website_url || null,
            linkedin_url: selectedProviderProfile.linkedin_url || null,
            tiktok_url: selectedProviderProfile.tiktok_url || null,
          }}
          cultures={selectedProviderCultures}
          zones={selectedProviderZones}
          portfolio={selectedProviderPortfolio}
          open={!!selectedProviderId}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedProviderId(null)
              setSelectedProviderProfile(null)
              setSelectedProviderCultures([])
              setSelectedProviderZones([])
              setSelectedProviderPortfolio([])
            }
          }}
          isCoupleView={true}
          coupleId={user.id}
        />
      )}
    </div>
  )
}
