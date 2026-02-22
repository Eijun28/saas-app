'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowLeft, Video, Phone, MoreVertical, User, BellOff, Flag, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DevisFlowButton } from '@/components/devis/DevisFlowButton'

interface ChatHeaderProps {
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
  userType: 'couple' | 'prestataire'
  isOnline?: boolean
}

export function ChatHeader({
  conversation,
  otherParty,
  userType,
  isOnline = false,
}: ChatHeaderProps) {
  const router = useRouter()
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return JSON.parse(localStorage.getItem(`conv_muted_${conversation.id}`) || 'false')
    } catch {
      return false
    }
  })

  const initials = otherParty.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  const handleBack = () => {
    const basePath = userType === 'couple' ? '/couple' : '/prestataire'
    router.push(`${basePath}/messagerie`)
  }

  const handleVideoCall = () => {
    toast.info('Fonctionnalité d\'appel vidéo à venir')
    // TODO: Implémenter WebRTC ou intégration service tiers
  }

  const handleVoiceCall = () => {
    toast.info('Fonctionnalité d\'appel vocal à venir')
    // TODO: Implémenter WebRTC ou intégration service tiers
  }

  const handleViewProfile = () => {
    const basePath = userType === 'couple' ? '/prestataire' : '/couple'
    router.push(`${basePath}/${otherParty.id}`)
  }

  const handleMute = () => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    try {
      localStorage.setItem(`conv_muted_${conversation.id}`, JSON.stringify(newMuted))
    } catch {
      // localStorage non disponible (SSR ou navigation privée)
    }
    toast.success(newMuted ? 'Notifications désactivées' : 'Notifications activées')
  }

  const handleReport = () => {
    toast.info('Fonctionnalité de signalement à venir')
    // TODO: Implémenter système de signalement
  }

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      toast.info('Fonctionnalité de suppression à venir')
      // TODO: Implémenter suppression conversation
    }
  }

  return (
    <div className="bg-white border-b border-gray-100 safe-area-top">
      <div className="px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bouton retour (mobile/tablette only) */}
          <button
            onClick={handleBack}
            className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center hover:bg-white/50 active:bg-white/70 transition-colors lg:hidden"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
          </button>

          {/* Avatar avec status online */}
          <div className="relative flex-shrink-0">
            <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
              <AvatarImage src={otherParty.avatar_url || undefined} alt={otherParty.name} />
              <AvatarFallback className="bg-white border border-gray-200 text-gray-600 text-xs sm:text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>

          {/* Nom et statut */}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate text-sm sm:text-base md:text-[17px]">
              {otherParty.name}
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 truncate font-medium">
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Bouton créer devis (prestataire only) */}
            {userType === 'prestataire' && (
              <DevisFlowButton
                conversationId={conversation.id}
                coupleId={conversation.couple_id}
                coupleName={otherParty.name}
                isPrestataire={true}
              />
            )}

            {/* Bouton appel vidéo */}
            <button
              onClick={handleVideoCall}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Appel vidéo"
            >
              <Video className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </button>

            {/* Bouton appel vocal */}
            <button
              onClick={handleVoiceCall}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Appel vocal"
            >
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </button>

            {/* Menu dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center hover:bg-white/50 active:bg-white/70 transition-colors"
                  aria-label="Menu"
                >
                  <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 sm:w-48 z-[201]">
                <DropdownMenuItem onClick={handleViewProfile} className="text-sm">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  Voir le profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleMute} className="text-sm">
                  <BellOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  {isMuted ? 'Activer les notifications' : 'Mettre en sourdine'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleReport} variant="destructive" className="text-sm">
                  <Flag className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  Signaler
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} variant="destructive" className="text-sm">
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}
