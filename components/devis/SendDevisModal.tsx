'use client'

// components/devis/SendDevisModal.tsx
// Modal pour envoyer le devis dans la conversation

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText, Send, Download, CheckCircle2, Loader2 } from 'lucide-react'
import type { DevisWithPdf } from '@/types/billing'

interface SendDevisModalProps {
  isOpen: boolean
  onClose: () => void
  devis: DevisWithPdf | null
  isLoading: boolean
  onSend: () => void
}

export function SendDevisModal({
  isOpen,
  onClose,
  devis,
  isLoading,
  onSend,
}: SendDevisModalProps) {
  if (!devis) return null

  const handleDownload = () => {
    if (devis.pdf_url) {
      window.open(devis.pdf_url, '_blank')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Devis généré avec succès
          </DialogTitle>
          <DialogDescription>
            Votre devis est prêt à être envoyé dans la conversation
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Aperçu du devis */}
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{devis.title}</p>
                <p className="text-sm text-muted-foreground">
                  N° {devis.devis_number}
                </p>
                <p className="text-lg font-bold text-purple-600 mt-1">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: devis.currency || 'EUR',
                  }).format(devis.amount)}
                </p>
              </div>
            </div>

            {/* Actions PDF */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Le devis sera visible dans la conversation et le client pourra
            l&apos;accepter ou le refuser directement.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Plus tard
          </Button>
          <Button onClick={onSend} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Envoyer dans la conversation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
