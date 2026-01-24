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
    <div className="bg-white border-b border-gray-200/60 safe-area-top">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-3.5">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors -ml-1"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          
          <Avatar className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 ring-1 ring-gray-100">
            <AvatarImage src={otherParty.avatar_url || undefined} alt={otherParty.name} />
            <AvatarFallback className="bg-gradient-to-br from-[#007AFF] to-[#0051D5] text-white text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate text-[17px]">{otherParty.name}</h2>
            {request && (
              <p className="text-xs text-gray-500 truncate font-medium">
                En ligne
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
