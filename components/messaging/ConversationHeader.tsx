'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ConversationHeaderProps {
  conversation: {
    id: string
    couple_id: string
    provider_id: string
    request_id: string
    created_at: string
  }
  otherParty: {
    id: string
    name: string
    avatar_url?: string | null
  }
  request?: {
    id: string
    initial_message: string
    status: string
  } | null
  userType?: 'couple' | 'prestataire'
}

export function ConversationHeader({ conversation, otherParty, request, userType }: ConversationHeaderProps) {
  const router = useRouter()
  const initials = otherParty.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  const handleBack = () => {
    const basePath = userType === 'couple' ? '/couple' : '/prestataire'
    router.push(`${basePath}/messagerie`)
  }

  return (
    <div className="bg-white/95 backdrop-blur-xl border-b border-gray-200/50 safe-area-top">
      <div className="max-w-3xl mx-auto px-2 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleBack}
            className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors -ml-1 sm:-ml-2"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          </button>
          
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
            <AvatarImage src={otherParty.avatar_url || undefined} alt={otherParty.name} />
            <AvatarFallback className="bg-gradient-to-br from-[#007AFF] to-[#0051D5] text-white text-xs sm:text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate text-base sm:text-[17px]">{otherParty.name}</h2>
            {request && (
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                En ligne
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
