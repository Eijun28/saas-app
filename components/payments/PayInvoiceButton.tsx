'use client'

// components/payments/PayInvoiceButton.tsx
// Bouton de paiement en ligne d'une facture (côté couple)

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Facture } from '@/types/billing'

interface PayInvoiceButtonProps {
  facture: Facture
  onPaymentInitiated?: () => void
  className?: string
}

export function PayInvoiceButton({ facture, onPaymentInitiated, className }: PayInvoiceButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  // La facture n'est payable que si elle est envoyée ou en retard et que le paiement en ligne est activé
  const isPayable =
    facture.online_payment_enabled &&
    ['sent', 'overdue'].includes(facture.status) &&
    facture.status !== 'paid'

  if (!isPayable) return null

  const handlePay = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facture_id: facture.id }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création du paiement')
      }

      onPaymentInitiated?.()
      toast.info('Redirection vers le paiement sécurisé...')
      window.location.href = data.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors du paiement')
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePay}
      disabled={isLoading}
      className={`bg-[#823F91] hover:bg-[#6D3478] text-white gap-2 ${className ?? ''}`}
    >
      {isLoading
        ? <><Loader2 className="h-4 w-4 animate-spin" /> Redirection...</>
        : <><CreditCard className="h-4 w-4" /> Payer en ligne</>
      }
    </Button>
  )
}
