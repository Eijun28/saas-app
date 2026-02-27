'use client'

// components/stripe/ConnectOnboardingCard.tsx

import { Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function StripeLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-label="Stripe"
    >
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
    </svg>
  )
}

export function ConnectOnboardingCard() {
  return (
    <Card className="bg-white/70 backdrop-blur-sm shadow-sm">
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StripeLogo className="h-5 w-5 text-[#635BFF]" />
              <h2 className="text-lg font-bold">Paiement en ligne</h2>
              <Badge className="bg-violet-50 text-violet-600 border border-violet-100 text-[11px] font-semibold">
                Bientôt disponible
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Permettez à vos couples de régler leurs factures directement en ligne via Stripe.
            </p>
          </div>
        </div>

        {/* Aperçu fonctionnalités (grisé) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm opacity-40 pointer-events-none select-none">
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

        {/* Bandeau info */}
        <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-lg border border-violet-100">
          <Clock className="h-5 w-5 text-violet-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-violet-800">Disponible prochainement</p>
            <p className="text-xs text-violet-600">
              La connexion Stripe sera activée dans une prochaine mise à jour.
            </p>
          </div>
        </div>

        {/* Bouton désactivé */}
        <Button
          disabled
          className="gap-2 w-full sm:w-auto cursor-not-allowed opacity-40"
        >
          <StripeLogo className="h-4 w-4" />
          Connecter mon compte Stripe
        </Button>
      </CardContent>
    </Card>
  )
}
