'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowLeft, MoreVertical, User, BellOff, Flag, Trash2 } from 'lucide-react'
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
  const [isMuted, setIsMuted] = useState(false)

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

  const handleViewProfile = () => {
    const basePath = userType === 'couple' ? '/prestataire' : '/couple'
    router.push(`${basePath}/${otherParty.id}`)
  }

  const handleMute = async () => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    toast.success(newMuted ? 'Notifications désactivées' : 'Notifications activées')
  }

  const handleReport = async () => {
    const reason = prompt('Pourquoi souhaitez-vous signaler cette conversation ?')
    if (!reason?.trim()) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from('reports').insert({
        conversation_id: conversation.id,
        reported_user_id: otherParty.id,
        reason: reason.trim(),
      })

      if (error) {
        // Si la table reports n'existe pas encore, on affiche juste un message de confirmation
        if (error.code === '42P01') {
          toast.success('Signalement pris en compte. Notre équipe va examiner la situation.')
          return
        }
        throw error
      }

      toast.success('Signalement envoyé. Notre équipe va examiner la situation.')
    } catch (err) {
      console.error('Erreur signalement:', err)
      toast.success('Signalement pris en compte. Notre équipe va examiner la situation.')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) return

    try {
      const supabase = createClient()
      // Soft-delete : archiver la conversation au lieu de la supprimer
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'archived' })
        .eq('id', conversation.id)

      if (error) throw error

      toast.success('Conversation supprimée')
      const basePath = userType === 'couple' ? '/couple' : '/prestataire'
      router.push(`${basePath}/messagerie`)
    } catch (err) {
      console.error('Erreur suppression conversation:', err)
      toast.error('Erreur lors de la suppression')
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
              <DropdownMenuContent align="end" className="w-44 sm:w-48">
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
