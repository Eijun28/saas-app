'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { activateFreePlan } from '@/lib/actions/stripe'
import { Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'

interface CheckoutButtonProps {
  planType: 'premium' | 'pro'
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'glow'
}

export function CheckoutButton({ planType, children, className, variant = 'default' }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleActivate = async () => {
    setLoading(true)
    try {
      const result = await activateFreePlan(planType)
      
      if (result.success) {
        setSuccess(true)
        toast.success(`Abonnement ${planType} activé avec succès !`)
        // Rediriger vers le dashboard après 1 seconde
        setTimeout(() => {
          router.push('/prestataire/dashboard?plan=activated')
          router.refresh()
        }, 1000)
      } else {
        throw new Error(result.error || 'Erreur lors de l\'activation du plan')
      }
    } catch (error: any) {
      console.error('Erreur activation:', error)
      toast.error(error.message || 'Erreur lors de l\'activation. Veuillez réessayer.')
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleActivate}
      disabled={loading || success}
      className={className}
      variant={variant === 'glow' ? 'default' : variant}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Activation...
        </>
      ) : success ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Activé !
        </>
      ) : (
        children
      )}
    </Button>
  )
}
