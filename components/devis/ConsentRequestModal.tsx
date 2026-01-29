'use client'

// components/devis/ConsentRequestModal.tsx
// Modal pour demander l'accès aux infos de facturation

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Lock, Shield, Loader2 } from 'lucide-react'

interface ConsentRequestModalProps {
  isOpen: boolean
  onClose: () => void
  coupleName: string
  isLoading: boolean
  onConfirm: () => void
}

export function ConsentRequestModal({
  isOpen,
  onClose,
  coupleName,
  isLoading,
  onConfirm,
}: ConsentRequestModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-purple-600" />
            Demande d&apos;accès
          </DialogTitle>
          <DialogDescription>
            Pour créer un devis, vous devez d&apos;abord obtenir l&apos;autorisation
            d&apos;accéder aux informations de facturation du client.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="rounded-lg bg-purple-50 p-4 border border-purple-100">
            <p className="text-sm text-purple-900">
              Demander l&apos;accès aux informations de facturation de{' '}
              <span className="font-semibold">{coupleName}</span> ?
            </p>
          </div>

          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <Shield className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p>
              Ces informations sont protégées et ne seront utilisées que pour la
              création de devis et factures dans le cadre de votre collaboration.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : (
              'Demander l\'accès'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
