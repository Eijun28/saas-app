'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConversationList } from '@/components/messages/ConversationList'
import { MessageThread } from '@/components/messages/MessageThread'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { UserType } from '@/types/messages'

export const dynamic = 'force-dynamic'

function MessagesContent() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [userType, setUserType] = useState<UserType | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showConversation, setShowConversation] = useState(false)

  // Détecter la taille d'écran
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Récupérer le type d'utilisateur
  useEffect(() => {
    if (!user) return

    const supabase = createClient()
    // Vérifier d'abord dans la table couples
    supabase
      .from('couples')
      .select('id')
      .eq('user_id', user.id)
      .single()
      .then(({ data: couple }) => {
        if (couple) {
          setUserType('couple')
          return
        }
        // Sinon vérifier dans profiles (prestataires)
        supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
          .then(({ data, error }) => {
            if (data?.role === 'prestataire') {
              setUserType('prestataire')
            }
          })
      })
  }, [user])

  // Récupérer la conversation depuis l'URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const urlParams = new URLSearchParams(window.location.search)
    const conversationId = urlParams.get('conversation')
    if (conversationId) {
      setSelectedConversationId(conversationId)
      if (isMobile) {
        setShowConversation(true)
      }
    }
  }, [isMobile])

  // Redirection si non connecté
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, userLoading, router])

  if (userLoading || !user || !userType) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    if (isMobile) {
      setShowConversation(true)
    }
    // Mettre à jour l'URL sans recharger
    router.push(`/messages?conversation=${conversationId}`, { scroll: false })
  }

  const handleBackToList = () => {
    setShowConversation(false)
    setSelectedConversationId(null)
    router.push('/messages', { scroll: false })
  }

  // Vue mobile : afficher soit la liste soit la conversation
  if (isMobile) {
    if (showConversation && selectedConversationId) {
      return (
        <div className="h-screen flex flex-col bg-white">
          {/* Header avec bouton retour */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToList}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
          </div>

          {/* Thread de messages */}
          <MessageThread
            conversationId={selectedConversationId}
            userId={user.id}
            userType={userType}
          />
        </div>
      )
    }

    // Vue liste (mobile)
    return (
      <div className="h-screen flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <ConversationList
            userId={user.id}
            userType={userType}
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversationId || undefined}
          />
        </div>
      </div>
    )
  }

  // Vue desktop : split view
  return (
    <div className="h-screen flex bg-white">
      {/* Sidebar gauche - Liste des conversations */}
      <div className="w-full md:w-1/3 lg:w-96 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
        </div>
        <ConversationList
          userId={user.id}
          userType={userType}
          onSelectConversation={handleSelectConversation}
          selectedConversationId={selectedConversationId || undefined}
        />
      </div>

      {/* Panel droit - Conversation active */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <MessageThread
            conversationId={selectedConversationId}
            userId={user.id}
            userType={userType}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Aucune conversation sélectionnée</p>
              <p className="text-sm">Sélectionnez une conversation pour commencer</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <MessagesContent />
    </Suspense>
  )
}
