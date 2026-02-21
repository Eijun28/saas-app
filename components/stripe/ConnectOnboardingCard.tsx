'use client'

// components/stripe/ConnectOnboardingCard.tsx
// Card d'onboarding Stripe Connect Express pour les prestataires

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, ExternalLink, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { StripeConnectAccount } from '@/types/billing'

interface ConnectStatus {
  connected: boolean
  account: Pick<StripeConnectAccount, 'id' | 'stripe_account_id' | 'onboarding_completed' | 'charges_enabled' | 'payouts_enabled' | 'account_status'> | null
}

export function ConnectOnboardingCard() {
  const [status, setStatus] = useState<ConnectStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/stripe-connect/status')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch {
      // silencieux
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleStartOnboarding = async () => {
    setIsStarting(true)
    try {
      const res = await fetch('/api/stripe-connect/onboard', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      if (data.alreadyOnboarded) {
        toast.success('Redirection vers votre tableau de bord Stripe...')
      } else {
        toast.info('Redirection vers Stripe pour configurer votre compte...')
      }

      window.location.href = data.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la connexion Stripe')
      setIsStarting(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[#823F91]" />
            <span className="text-sm text-muted-foreground">Chargement du statut Stripe...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isActive = status?.account?.charges_enabled
  const isPending = status?.connected && !status.account?.charges_enabled
  const isNotConnected = !status?.connected

  return (
    <Card className="bg-white/70 backdrop-blur-sm shadow-sm">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-5 w-5 text-[#823F91]" />
              <h2 className="text-lg font-bold">Paiement en ligne</h2>
              {isActive && (
                <Badge className="bg-green-50 text-green-700 border-green-200">Actif</Badge>
              )}
              {isPending && (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200">En attente</Badge>
              )}
              {isNotConnected && (
                <Badge className="bg-gray-100 text-gray-600">Non configuré</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isActive
                ? 'Vos couples peuvent régler vos factures directement en ligne via Stripe.'
                : 'Connectez votre compte Stripe pour recevoir des paiements en ligne depuis vos couples.'}
            </p>
          </div>
        </div>

        {/* Statut actif */}
        {isActive && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Compte Stripe actif</p>
                <p className="text-xs text-green-600">
                  {status?.account?.payouts_enabled
                    ? 'Les virements vers votre banque sont activés.'
                    : 'Virements en attente de validation Stripe.'}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Les paiements reçus sont virés sur votre compte bancaire sous 2-3 jours ouvrés.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartOnboarding}
              disabled={isStarting}
              className="gap-2"
            >
              {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Tableau de bord Stripe
            </Button>
          </div>
        )}

        {/* Onboarding incomplet */}
        {isPending && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Configuration incomplète</p>
                <p className="text-xs text-amber-600">
                  Terminez la configuration de votre compte Stripe pour activer les paiements.
                </p>
              </div>
            </div>
            <Button
              onClick={handleStartOnboarding}
              disabled={isStarting}
              className="bg-[#823F91] hover:bg-[#6D3478] text-white gap-2"
            >
              {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Terminer la configuration
            </Button>
          </div>
        )}

        {/* Non connecté */}
        {isNotConnected && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {[
                { icon: '🔒', title: 'Sécurisé', desc: 'Paiements chiffrés SSL via Stripe' },
                { icon: '⚡', title: 'Instantané', desc: 'Le couple paie en 1 clic' },
                { icon: '💸', title: 'Viré sous 2-3j', desc: 'Directement sur votre compte' },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="font-medium text-xs">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Vous devrez fournir vos informations bancaires et fiscales sur Stripe.
                Cela prend environ 5 minutes.
              </p>
            </div>

            <Button
              onClick={handleStartOnboarding}
              disabled={isStarting}
              className="bg-[#823F91] hover:bg-[#6D3478] text-white gap-2 w-full sm:w-auto"
            >
              {isStarting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Connexion en cours...</>
                : <><CreditCard className="h-4 w-4" /> Connecter mon compte Stripe</>
              }
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
