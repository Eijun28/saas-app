'use client'

// import { format } from 'date-fns'
// import { fr } from 'date-fns/locale'
import { Check, CheckCheck, Image as ImageIcon, FileText } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import type { Message } from '@/types/messages'
import Image from 'next/image'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar?: boolean
}

export function MessageBubble({ message, isOwn, showAvatar = false }: MessageBubbleProps) {
  const senderName = message.sender?.user_metadata?.prenom || 
                     message.sender?.user_metadata?.nom || 
                     message.sender?.email?.split('@')[0] || 
                     'Utilisateur'

  const formattedTime = new Date(message.created_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const isRead = !!message.read_at

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end mb-4`}>
      {!isOwn && showAvatar && (
        <Avatar
          src={message.sender?.user_metadata?.avatar_url || undefined}
          fallback={senderName}
          size="sm"
          className="flex-shrink-0"
        />
      )}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {!isOwn && showAvatar && (
          <span className="text-xs text-gray-500 mb-1 px-1">{senderName}</span>
        )}

        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white'
              : 'bg-white border border-gray-200 text-gray-900'
          }`}
        >
          {/* Contenu du message */}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {/* Pièces jointes */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, idx) => {
                const isImage = attachment.type.startsWith('image/')
                const isPdf = attachment.type === 'application/pdf'

                return (
                  <div key={idx} className="rounded-lg overflow-hidden">
                    {isImage ? (
                      <div className="relative w-full max-w-xs">
                        <Image
                          src={attachment.url}
                          alt={attachment.name}
                          width={300}
                          height={200}
                          className="rounded-lg object-cover"
                          unoptimized
                        />
                      </div>
                    ) : isPdf ? (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 p-3 rounded-lg border ${
                          isOwn
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        } hover:opacity-80 transition-opacity`}
                      >
                        <FileText className="h-5 w-5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.name}</p>
                          <p className="text-xs opacity-70">
                            {(attachment.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </a>
                    ) : (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 p-2 rounded ${
                          isOwn ? 'bg-white/10 text-white' : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-xs truncate">{attachment.name}</span>
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Métadonnées (heure + statut lu) */}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-xs ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
              {formattedTime}
            </span>
            {isOwn && (
              <span className={isRead ? 'text-blue-300' : 'text-white/50'}>
                {isRead ? (
                  <CheckCheck className="h-3 w-3" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

