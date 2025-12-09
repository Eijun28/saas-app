'use client'

// import { formatDistanceToNow } from 'date-fns'
// import { fr } from 'date-fns/locale'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { ConversationItemProps } from '@/types/messages'
import { Circle } from 'lucide-react'

export function ConversationItem({
  conversation,
  userId,
  userType,
  isSelected,
  onClick,
}: ConversationItemProps) {
  // Déterminer l'autre participant
  const otherParticipant =
    userType === 'couple'
      ? conversation.prestataire
      : conversation.couple

  const otherParticipantName =
    userType === 'couple'
      ? conversation.prestataire?.user_metadata?.nom_entreprise ||
        `${conversation.prestataire?.user_metadata?.prenom || ''} ${conversation.prestataire?.user_metadata?.nom || ''}`.trim() ||
        conversation.prestataire?.email?.split('@')[0] ||
        'Prestataire'
      : `${conversation.couple?.user_metadata?.prenom || ''} ${conversation.couple?.user_metadata?.nom || ''}`.trim() ||
        conversation.couple?.email?.split('@')[0] ||
        'Couple'

  const lastMessagePreview = conversation.last_message
    ? conversation.last_message.length > 50
      ? conversation.last_message.substring(0, 50) + '...'
      : conversation.last_message
    : 'Aucun message'

  const timeAgo = conversation.last_message_at
    ? (() => {
        const date = new Date(conversation.last_message_at)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'À l\'instant'
        if (diffMins < 60) return `Il y a ${diffMins} min`
        if (diffHours < 24) return `Il y a ${diffHours}h`
        if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      })()
    : ''

  const unreadCount = conversation.unread_count || 0
  const hasUnread = unreadCount > 0

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg transition-all ${
        isSelected
          ? 'bg-gradient-to-r from-[#823F91]/10 to-[#9D5FA8]/10 border-l-4 border-[#823F91]'
          : 'hover:bg-gray-50 border-l-4 border-transparent'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Avatar
            src={otherParticipant?.user_metadata?.avatar_url || undefined}
            fallback={otherParticipantName}
            size="md"
          />
          {/* Indicateur en ligne (optionnel, à implémenter plus tard) */}
          {/* <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" /> */}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3
              className={`font-semibold text-sm truncate ${
                hasUnread ? 'text-gray-900' : 'text-gray-700'
              }`}
            >
              {otherParticipantName}
            </h3>
            {timeAgo && (
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                {timeAgo}
              </span>
            )}
          </div>

          <p
            className={`text-sm truncate ${
              hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'
            }`}
          >
            {lastMessagePreview}
          </p>
        </div>

        {/* Badge messages non lus */}
        {hasUnread && (
          <Badge
            variant="default"
            className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white flex-shrink-0 ml-2"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </div>
    </button>
  )
}

