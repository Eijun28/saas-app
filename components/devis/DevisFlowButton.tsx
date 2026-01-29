'use client'

// components/devis/DevisFlowButton.tsx
// Bouton contextuel pour déclencher le flow de création de devis

import { Button } from '@/components/ui/button'
import { FileText, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { useDevisFlow, DevisFlowStep } from './useDevisFlow'
import { ConsentRequestModal } from './ConsentRequestModal'
import { CreateDevisModal, DevisFormData } from './CreateDevisModal'
import { SendDevisModal } from './SendDevisModal'

interface DevisFlowButtonProps {
  conversationId: string
  coupleId: string
  coupleName: string
  isPrestataire: boolean
}

export function DevisFlowButton({
  conversationId,
  coupleId,
  coupleName,
  isPrestataire,
}: DevisFlowButtonProps) {
  const {
    step,
    isLoading,
    error,
    generatedDevis,

    requestConsent,
    createDevis,
    sendDevis,

    showConsentModal,
    showCreateModal,
    showSendModal,
    setShowConsentModal,
    setShowCreateModal,
    setShowSendModal,
  } = useDevisFlow({
    conversationId,
    coupleId,
    coupleName,
    isPrestataire,
  })

  // Ne pas afficher si pas prestataire
  if (!isPrestataire) return null

  // Déterminer le contenu du bouton selon l'état
  const getButtonContent = () => {
    switch (step) {
      case 'idle':
        return (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Créer un devis
          </>
        )
      case 'waiting_consent':
        return (
          <>
            <Clock className="mr-2 h-4 w-4" />
            En attente de réponse
          </>
        )
      case 'consent_approved':
        return (
          <>
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Finaliser le devis
          </>
        )
      case 'generating':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Génération...
          </>
        )
      case 'completed':
        return (
          <>
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Devis envoyé
          </>
        )
      default:
        return (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Créer un devis
          </>
        )
    }
  }

  // Gérer le clic sur le bouton
  const handleClick = () => {
    switch (step) {
      case 'idle':
        setShowConsentModal(true)
        break
      case 'consent_approved':
        setShowCreateModal(true)
        break
      case 'send_devis':
        setShowSendModal(true)
        break
    }
  }

  // Déterminer si le bouton est désactivé
  const isDisabled =
    step === 'waiting_consent' ||
    step === 'generating' ||
    step === 'completed' ||
    isLoading

  const handleCreateDevis = (data: DevisFormData) => {
    createDevis(data)
  }

  return (
    <>
      <Button
        variant={step === 'consent_approved' ? 'default' : 'outline'}
        size="sm"
        onClick={handleClick}
        disabled={isDisabled}
        className={
          step === 'consent_approved'
            ? 'bg-purple-600 hover:bg-purple-700'
            : ''
        }
      >
        {getButtonContent()}
      </Button>

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      {/* Modales */}
      <ConsentRequestModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        coupleName={coupleName}
        isLoading={isLoading}
        onConfirm={requestConsent}
      />

      <CreateDevisModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        coupleName={coupleName}
        isLoading={isLoading}
        onSubmit={handleCreateDevis}
      />

      <SendDevisModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        devis={generatedDevis}
        isLoading={isLoading}
        onSend={sendDevis}
      />
    </>
  )
}
