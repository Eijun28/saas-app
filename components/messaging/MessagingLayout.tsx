'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { PageTitle } from '@/components/prestataire/shared/PageTitle'
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
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const hasConversationSelected = !!selectedConversationId && !!children

  // Mobile/Tablette : afficher soit la liste soit la conversation
  if (isMobile) {
    return (
      <div className="flex-1 min-h-0 flex flex-col gap-4">
        <PageTitle
          title="Messagerie"
          description={userType === 'couple'
            ? 'Communiquez avec vos prestataires'
            : 'Communiquez avec vos clients'}
          className="pb-0"
        />
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-0">
          {isConversationPage ? children : chatListComponent}
        </div>
      </div>
    )
  }

  // Desktop : deux cartes quand conversation sélectionnée, une carte centrée sinon
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4">
      <PageTitle
        title="Messagerie"
        description={userType === 'couple'
          ? 'Communiquez avec vos prestataires'
          : 'Communiquez avec vos clients'}
        className="pb-4"
      />
      <div className={`flex-1 min-h-0 flex gap-4 overflow-hidden ${!hasConversationSelected ? 'justify-center' : ''}`}>
        {/* Carte gauche — liste des conversations (largeur mobile fixe) */}
        <div className={`
          bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden flex-shrink-0
          ${hasConversationSelected ? 'w-[340px] xl:w-[375px]' : 'w-full max-w-[375px]'}
          transition-all duration-300
        `}>
          {chatListComponent}
        </div>

        {/* Carte droite — conversation, se déploie depuis la droite */}
        {hasConversationSelected && (
          <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-right-4 duration-300">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
