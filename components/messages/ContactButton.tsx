'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getOrCreateConversation } from '@/lib/supabase/messages'
import { useUser } from '@/hooks/use-user'
import { useToast } from '@/hooks/use-toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Note: Ce composant peut être utilisé dans n'importe quelle page pour permettre aux couples
// de contacter un prestataire. Exemple d'utilisation :
//
// <ContactButton
//   prestataireId={prestataire.id}
//   demandeType="traiteur"
//   cultures={["algérien", "français"]}
//   eventDate="2024-06-15"
//   eventLocation="Paris"
//   estimatedBudget={5000}
//   guestCount={150}
// />

interface ContactButtonProps {
  prestataireId: string
  demandeType?: string
  cultures?: string[]
  eventDate?: string
  eventLocation?: string
  estimatedBudget?: number
  guestCount?: number
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ContactButton({
  prestataireId,
  demandeType,
  cultures,
  eventDate,
  eventLocation,
  estimatedBudget,
  guestCount,
  variant = 'default',
  size = 'md',
  className,
}: ContactButtonProps) {
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleContact = async () => {
    if (!user) {
      router.push('/sign-in')
      return
    }

    setIsLoading(true)

    try {
      const conversationId = await getOrCreateConversation(
        user.id,
        prestataireId,
        demandeType,
        cultures,
        eventDate,
        eventLocation,
        estimatedBudget,
        guestCount
      )

      // Rediriger vers la messagerie
      router.push(`/messages?conversation=${conversationId}`)
    } catch (error: any) {
      console.error('Erreur lors de la création de la conversation:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de contacter le prestataire',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleContact}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className || 'bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white'}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          <span>Connexion...</span>
        </>
      ) : (
        <>
          <MessageSquare className="h-4 w-4 mr-2" />
          <span>Contacter</span>
        </>
      )}
    </Button>
  )
}

