'use client'

import { useEffect, useState } from 'react'
import { Search, MessageSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ConversationItem } from './ConversationItem'
import { getConversations } from '@/lib/supabase/messages'
import { createClient } from '@/lib/supabase/client'
import type { ConversationListProps, Conversation } from '@/types/messages'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export function ConversationList({
  userId,
  userType,
  onSelectConversation,
  selectedConversationId,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Charger les conversations
  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true)
      try {
        const data = await getConversations(userId, userType)
        setConversations(data)
        setFilteredConversations(data)
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [userId, userType])

  // Filtrer par recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = conversations.filter((conv) => {
      const otherParticipant =
        userType === 'couple'
          ? conv.prestataire
          : conv.couple

      const name =
        userType === 'couple'
          ? conv.prestataire?.user_metadata?.nom_entreprise ||
            `${conv.prestataire?.user_metadata?.prenom || ''} ${conv.prestataire?.user_metadata?.nom || ''}`.trim() ||
            conv.prestataire?.email || ''
          : `${conv.couple?.user_metadata?.prenom || ''} ${conv.couple?.user_metadata?.nom || ''}`.trim() ||
            conv.couple?.email || ''

      return (
        name.toLowerCase().includes(query) ||
        conv.last_message?.toLowerCase().includes(query)
      )
    })

    setFilteredConversations(filtered)
  }, [searchQuery, conversations, userType])

  // Realtime subscription pour nouveaux messages
  useEffect(() => {
    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: userType === 'couple' 
            ? `couple_id=eq.${userId}`
            : `prestataire_id=eq.${userId}`,
        },
        (payload) => {
          // Mettre à jour la conversation dans la liste
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === payload.new.id ? { ...conv, ...payload.new } : conv
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: userType === 'couple'
            ? `couple_id=eq.${userId}`
            : `prestataire_id=eq.${userId}`,
        },
        async () => {
          // Recharger les conversations
          try {
            const data = await getConversations(userId, userType)
            setConversations(data)
          } catch (error) {
            console.error('Erreur lors du rechargement:', error)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, userType, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="md" text="Chargement des conversations..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header avec recherche */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Mes Conversations
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium mb-1">
              {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
            </p>
            <p className="text-sm text-gray-400">
              {searchQuery
                ? 'Essayez avec d\'autres mots-clés'
                : 'Commencez une nouvelle conversation'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                userId={userId}
                userType={userType}
                isSelected={conversation.id === selectedConversationId}
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

