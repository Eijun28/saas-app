'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Search, Check, CheckCheck } from 'lucide-react'
import type { Conversation } from '@/lib/supabase/messaging'

interface ChatListProps {
  conversations: Conversation[]
  currentUserId: string
  userType: 'couple' | 'prestataire'
  selectedConversationId?: string
}

export function ChatList({
  conversations,
  currentUserId,
  userType,
  selectedConversationId,
}: ChatListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  // Filtrer les conversations selon la recherche
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations

    const query = searchQuery.toLowerCase()
    return conversations.filter((conv) => {
      const name = conv.other_party?.name?.toLowerCase() || ''
      const lastMessage = conv.request?.initial_message?.toLowerCase() || ''
      return name.includes(query) || lastMessage.includes(query)
    })
  }, [conversations, searchQuery])

  const handleConversationClick = (conversationId: string) => {
    const basePath = userType === 'couple' ? '/couple' : '/prestataire'
    router.push(`${basePath}/messagerie/${conversationId}`)
  }

  // Format timestamp relatif
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

  // Récupérer le dernier message (pour l'instant on utilise initial_message, à remplacer par le vrai dernier message)
  const getLastMessage = (conversation: Conversation) => {
    // TODO: Remplacer par le vrai dernier message depuis la table messages
    return conversation.request?.initial_message || ''
  }

  // Vérifier si le message est lu (pour l'instant toujours false, à implémenter avec read_at)
  const isMessageRead = (conversation: Conversation) => {
    // TODO: Vérifier read_at du dernier message
    return false
  }

  // Compter les messages non-lus
  const getUnreadCount = (conversation: Conversation) => {
    return conversation.unread_count || 0
  }

  // Vérifier si l'utilisateur est en ligne (pour l'instant false, à implémenter avec user_presence)
  const isOnline = (conversation: Conversation) => {
    // TODO: Vérifier user_presence
    return false
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune conversation
          </h3>
          <p className="text-sm text-gray-500">
            {userType === 'couple'
              ? 'Vos conversations avec les prestataires apparaîtront ici une fois qu\'une demande aura été acceptée.'
              : 'Vos conversations avec les couples apparaîtront ici une fois que vous aurez accepté une demande.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* En-tête avec titre et recherche */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Messagerie</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-50 border-gray-200 focus:bg-white focus:border-gray-300 rounded-xl"
          />
        </div>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {filteredConversations.map((conversation) => {
            const otherParty = conversation.other_party
            const initials = otherParty?.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || '?'

            const lastMessage = getLastMessage(conversation)
            const unreadCount = getUnreadCount(conversation)
            const online = isOnline(conversation)
            const isSelected = selectedConversationId === conversation.id
            const isRead = isMessageRead(conversation)

            return (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className={`
                  bg-white rounded-xl p-3 cursor-pointer transition-all
                  ${isSelected ? 'ring-2 ring-gray-300 shadow-sm' : 'hover:shadow-sm border border-gray-100'}
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar avec indicateur online */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={otherParty?.avatar_url || undefined} alt={otherParty?.name} />
                      <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {online && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate text-[15px]">
                        {otherParty?.name || 'Utilisateur'}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 font-medium">
                        {formatRelativeTime(conversation.created_at)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {lastMessage && (
                        <>
                          <p className="text-sm text-gray-500 truncate flex-1">
                            {lastMessage}
                          </p>
                          {/* Checkmarks pour les messages envoyés */}
                          {conversation.couple_id === currentUserId && (
                            <div className="flex-shrink-0">
                              {isRead ? (
                                <CheckCheck className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Check className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Badge messages non-lus */}
                  {unreadCount > 0 && (
                    <div className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#823F91] text-white text-xs font-semibold flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
