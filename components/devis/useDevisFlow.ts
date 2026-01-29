// components/devis/useDevisFlow.ts
// Hook pour gérer le flow complet de création de devis

import { useState, useCallback, useEffect } from 'react'
import type { BillingConsentRequest, ConsentStatusResponse, DevisWithPdf } from '@/types/billing'

export type DevisFlowStep =
  | 'idle'
  | 'request_consent'
  | 'waiting_consent'
  | 'consent_approved'
  | 'create_devis'
  | 'generating'
  | 'send_devis'
  | 'completed'

interface UseDevisFlowOptions {
  conversationId: string
  coupleId: string
  coupleName: string
  isPrestataire: boolean
}

interface UseDevisFlowReturn {
  // State
  step: DevisFlowStep
  isLoading: boolean
  error: string | null
  consentStatus: ConsentStatusResponse | null
  generatedDevis: DevisWithPdf | null

  // Actions
  checkConsentStatus: () => Promise<void>
  requestConsent: () => Promise<void>
  createDevis: (data: CreateDevisData) => Promise<void>
  sendDevis: () => Promise<void>
  reset: () => void

  // Modal controls
  showConsentModal: boolean
  showCreateModal: boolean
  showSendModal: boolean
  setShowConsentModal: (show: boolean) => void
  setShowCreateModal: (show: boolean) => void
  setShowSendModal: (show: boolean) => void
}

interface CreateDevisData {
  amount: number
  title: string
  description: string
  includedServices?: string[]
  excludedServices?: string[]
  conditions?: string
  validUntil: string
}

export function useDevisFlow({
  conversationId,
  coupleId,
  coupleName,
  isPrestataire,
}: UseDevisFlowOptions): UseDevisFlowReturn {
  const [step, setStep] = useState<DevisFlowStep>('idle')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consentStatus, setConsentStatus] = useState<ConsentStatusResponse | null>(null)
  const [generatedDevis, setGeneratedDevis] = useState<DevisWithPdf | null>(null)

  // Modal visibility
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)

  // Vérifier le statut du consentement
  const checkConsentStatus = useCallback(async () => {
    if (!isPrestataire) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/billing-consent?conversation_id=${conversationId}`
      )

      if (!response.ok) {
        throw new Error('Erreur lors de la vérification du consentement')
      }

      const data: ConsentStatusResponse = await response.json()
      setConsentStatus(data)

      // Mettre à jour le step en fonction du statut
      if (data.hasConsent) {
        setStep('consent_approved')
      } else if (data.status === 'pending') {
        setStep('waiting_consent')
      } else {
        setStep('idle')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, isPrestataire])

  // Demander le consentement
  const requestConsent = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/billing-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          couple_id: coupleId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la demande')
      }

      setStep('waiting_consent')
      setShowConsentModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, coupleId])

  // Créer le devis
  const createDevis = useCallback(
    async (data: CreateDevisData) => {
      setIsLoading(true)
      setError(null)
      setStep('generating')

      try {
        const response = await fetch('/api/devis/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: conversationId,
            couple_id: coupleId,
            amount: data.amount,
            title: data.title,
            description: data.description,
            included_services: data.includedServices || [],
            excluded_services: data.excludedServices || [],
            conditions: data.conditions,
            valid_until: data.validUntil,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erreur lors de la génération')
        }

        const result = await response.json()
        setGeneratedDevis(result.devis)
        setStep('send_devis')
        setShowCreateModal(false)
        setShowSendModal(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
        setStep('consent_approved')
      } finally {
        setIsLoading(false)
      }
    },
    [conversationId, coupleId]
  )

  // Envoyer le devis dans la conversation
  const sendDevis = useCallback(async () => {
    if (!generatedDevis) return

    setIsLoading(true)
    setError(null)

    try {
      // Ici on pourrait envoyer un message spécial dans la conversation
      // Pour l'instant, on marque juste comme terminé
      setStep('completed')
      setShowSendModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }, [generatedDevis])

  // Reset
  const reset = useCallback(() => {
    setStep('idle')
    setError(null)
    setGeneratedDevis(null)
    setShowConsentModal(false)
    setShowCreateModal(false)
    setShowSendModal(false)
  }, [])

  // Vérifier le consentement au mount
  useEffect(() => {
    if (isPrestataire && conversationId) {
      checkConsentStatus()
    }
  }, [isPrestataire, conversationId, checkConsentStatus])

  return {
    step,
    isLoading,
    error,
    consentStatus,
    generatedDevis,

    checkConsentStatus,
    requestConsent,
    createDevis,
    sendDevis,
    reset,

    showConsentModal,
    showCreateModal,
    showSendModal,
    setShowConsentModal,
    setShowCreateModal,
    setShowSendModal,
  }
}
