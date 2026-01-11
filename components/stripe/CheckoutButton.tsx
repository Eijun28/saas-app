'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createCheckoutSession } from '@/lib/actions/stripe'
import { Loader2 } from 'lucide-react'

interface CheckoutButtonProps {
  planType: 'premium' | 'pro'
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'glow'
}

export function CheckoutButton({ planType, children, className, variant = 'default' }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const result = await createCheckoutSession(planType)
      
      if (result.success && result.url) {
        // Rediriger vers Stripe Checkout
        window.location.href = result.url
      } else {
        throw new Error(result.error || 'Erreur lors de la création de la session')
      }
    } catch (error: any) {
      console.error('Erreur checkout:', error)
      alert('Erreur lors du démarrage du paiement. Veuillez réessayer.')
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className={className}
      variant={variant === 'glow' ? 'default' : variant}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirection...
        </>
      ) : (
        children
      )}
    </Button>
  )
}
