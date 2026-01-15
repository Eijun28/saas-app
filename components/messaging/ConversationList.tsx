'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare } from 'lucide-react'
import type { Conversation } from '@/lib/supabase/messaging'

interface ConversationListProps {
  conversations: Conversation[]
  currentUserId: string
  userType: 'couple' | 'prestataire'
}

export function ConversationList({ conversations, currentUserId, userType }: ConversationListProps) {
  const router = useRouter()

  const handleConversationClick = (conversationId: string) => {
    const basePath = userType === 'couple' ? '/couple' : '/prestataire'
    router.push(`${basePath}/messagerie/${conversationId}`)
  }

  if (conversations.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-200/50">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-[#007AFF]/10 to-[#0051D5]/10 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-[#007AFF]" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Aucune conversation
            </h3>
            <p className="text-sm sm:text-[15px] text-gray-500 leading-relaxed px-2">
              {userType === 'couple' 
                ? 'Vos conversations avec les prestataires apparaîtront ici une fois qu\'une demande aura été acceptée.'
                : 'Vos conversations avec les couples apparaîtront ici une fois que vous aurez accepté une demande.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 px-1 sm:px-2">Messagerie</h1>
        
        <div className="space-y-2">
          {conversations.map((conversation) => {
            const otherParty = conversation.other_party
            const initials = otherParty?.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || '?'

            return (
              <div
                key={conversation.id}
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:bg-gray-50/50 transition-colors cursor-pointer border border-gray-200/30 shadow-sm active:scale-[0.98]"
                onClick={() => handleConversationClick(conversation.id)}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                    <AvatarImage src={otherParty?.avatar_url || undefined} alt={otherParty?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-[#007AFF] to-[#0051D5] text-white text-xs sm:text-sm font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5 sm:mb-1">
                      <h3 className="font-semibold text-gray-900 truncate text-base sm:text-[17px]">
                        {otherParty?.name || 'Utilisateur'}
                      </h3>
                      <span className="text-[10px] sm:text-xs text-gray-400 flex-shrink-0">
                        {new Date(conversation.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    {conversation.request && (
                      <p className="text-xs sm:text-sm text-gray-500 truncate leading-relaxed">
                        {conversation.request.initial_message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
