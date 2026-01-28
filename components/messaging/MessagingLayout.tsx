'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import type { Conversation } from '@/lib/supabase/messaging'

interface MessagingLayoutProps {
  conversations: Conversation[]
  currentUserId: string
  userType: 'couple' | 'prestataire'
  chatListComponent: React.ReactNode
  selectedConversationId?: string
  children?: React.ReactNode
}

export function MessagingLayout({
  conversations,
  currentUserId,
  userType,
  chatListComponent,
  selectedConversationId,
  children,
}: MessagingLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const isConversationPage = pathname.includes('/messagerie/') && pathname.split('/').length > 3

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint pour tablette
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Mobile/Tablette: afficher soit la liste soit la conversation
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {isConversationPage ? children : chatListComponent}
      </div>
    )
  }

  // Desktop: split-view avec liste à gauche et conversation à droite
  // Si aucune conversation, afficher l'état vide sur tout l'écran
  if (conversations.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 max-w-md w-full text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
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
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
              Aucune conversation
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 px-2">
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
    <div className="flex h-screen bg-gray-50">
      {/* Liste des conversations - responsive width */}
      <div className="w-full lg:w-[380px] xl:w-[420px] border-r border-gray-200 bg-white flex flex-col overflow-hidden">
        {chatListComponent}
      </div>
      
      {/* Zone de conversation */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children || (
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-4 sm:p-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 max-w-md w-full text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
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
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 px-2">
                Choisissez une conversation dans la liste pour commencer à discuter
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
