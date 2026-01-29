'use client'

// components/devis/CreateDevisModal.tsx
// Modal pour créer un devis avec formulaire multi-étapes

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Euro, Calendar, CheckCircle, Loader2 } from 'lucide-react'

interface CreateDevisModalProps {
  isOpen: boolean
  onClose: () => void
  coupleName: string
  isLoading: boolean
  onSubmit: (data: DevisFormData) => void
}

export interface DevisFormData {
  amount: number
  title: string
  description: string
  includedServices?: string[]
  excludedServices?: string[]
  conditions?: string
  validUntil: string
}

type Step = 'confirm' | 'form' | 'preview'

export function CreateDevisModal({
  isOpen,
  onClose,
  coupleName,
  isLoading,
  onSubmit,
}: CreateDevisModalProps) {
  const [step, setStep] = useState<Step>('confirm')
  const [formData, setFormData] = useState<DevisFormData>({
    amount: 0,
    title: '',
    description: '',
    includedServices: [],
    excludedServices: [],
    conditions: '',
    validUntil: getDefaultValidUntil(),
  })

  const handleConfirm = () => {
    setStep('form')
  }

  const handleFormSubmit = () => {
    setStep('preview')
  }

  const handleFinalSubmit = () => {
    onSubmit(formData)
  }

  const handleClose = () => {
    setStep('confirm')
    setFormData({
      amount: 0,
      title: '',
      description: '',
      includedServices: [],
      excludedServices: [],
      conditions: '',
      validUntil: getDefaultValidUntil(),
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Créer un devis
              </DialogTitle>
              <DialogDescription>
                Vous êtes sur le point de créer un devis pour{' '}
                <span className="font-semibold text-foreground">{coupleName}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Ce devis sera généré au format PDF et pourra être envoyé directement
                dans la conversation.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button onClick={handleConfirm}>Continuer</Button>
            </DialogFooter>
          </>
        )}

        {step === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle>Informations du devis</DialogTitle>
              <DialogDescription>
                Remplissez les détails de votre prestation
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de la prestation *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Photographie de mariage - Formule Premium"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre prestation en détail..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant HT *</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                    <Euro className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valable jusqu&apos;au</Label>
                  <div className="relative">
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) =>
                        setFormData({ ...formData, validUntil: e.target.value })
                      }
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="included">Services inclus (un par ligne)</Label>
                <Textarea
                  id="included"
                  placeholder="Ex:\nReportage photo 8h\nAlbum 30x30\nClé USB haute définition"
                  rows={3}
                  value={(formData.includedServices || []).join('\n')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      includedServices: e.target.value
                        .split('\n')
                        .filter((s) => s.trim()),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditions">Conditions (optionnel)</Label>
                <Textarea
                  id="conditions"
                  placeholder="Acompte de 30% à la commande..."
                  rows={2}
                  value={formData.conditions || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, conditions: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('confirm')}>
                Retour
              </Button>
              <Button
                onClick={handleFormSubmit}
                disabled={!formData.title || !formData.description || !formData.amount}
              >
                Aperçu
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'preview' && (
          <>
            <DialogHeader>
              <DialogTitle>Aperçu du devis</DialogTitle>
              <DialogDescription>
                Vérifiez les informations avant de générer le PDF
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{formData.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Pour {coupleName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(formData.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">HT</p>
                  </div>
                </div>

                <p className="text-sm">{formData.description}</p>

                {(formData.includedServices?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Services inclus :
                    </p>
                    <ul className="text-sm text-muted-foreground">
                      {formData.includedServices?.map((s, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Valable jusqu&apos;au{' '}
                  {new Date(formData.validUntil).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('form')}>
                Modifier
              </Button>
              <Button onClick={handleFinalSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  'Générer le devis'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function getDefaultValidUntil(): string {
  const date = new Date()
  date.setDate(date.getDate() + 30) // +30 jours
  return date.toISOString().split('T')[0]
}
