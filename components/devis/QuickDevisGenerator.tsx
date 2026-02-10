'use client'

// components/devis/QuickDevisGenerator.tsx
// Composant pour générer un devis en un clic

import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText,
  Euro,
  User,
  Calendar,
  CheckCircle,
  Loader2,
  AlertCircle,
  Sparkles,
  FileCheck,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Eye,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import type { CoupleForDevis, DevisTemplate } from '@/types/billing'
import { cn } from '@/lib/utils'

interface QuickDevisGeneratorProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (devis: { id: string; pdfUrl: string }) => void
}

interface FormData {
  couple_id: string
  template_id: string
  amount: number
  title: string
  description: string
  includedServices: string[]
  excludedServices: string[]
  conditions: string
  validityDays: number
}

type Step = 'select_couple' | 'fill_form' | 'preview' | 'success'

export function QuickDevisGenerator({
  isOpen,
  onClose,
  onSuccess,
}: QuickDevisGeneratorProps) {
  const [step, setStep] = useState<Step>('select_couple')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCouples, setIsLoadingCouples] = useState(true)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)

  const [couples, setCouples] = useState<CoupleForDevis[]>([])
  const [templates, setTemplates] = useState<DevisTemplate[]>([])
  const [selectedCouple, setSelectedCouple] = useState<CoupleForDevis | null>(null)
  const [generatedDevis, setGeneratedDevis] = useState<{ id: string; pdfUrl: string } | null>(null)

  const [formData, setFormData] = useState<FormData>({
    couple_id: '',
    template_id: '',
    amount: 0,
    title: '',
    description: '',
    includedServices: [],
    excludedServices: [],
    conditions: '',
    validityDays: 30,
  })

  // Charger les couples au montage
  useEffect(() => {
    if (isOpen) {
      fetchCouples()
      fetchTemplates()
    }
  }, [isOpen])

  const fetchCouples = async () => {
    setIsLoadingCouples(true)
    try {
      const response = await fetch('/api/devis/couples')
      if (response.ok) {
        const data = await response.json()
        setCouples(data.couples || [])
      }
    } catch (error) {
      console.error('Erreur chargement couples:', error)
    } finally {
      setIsLoadingCouples(false)
    }
  }

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true)
    try {
      const response = await fetch('/api/devis/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Erreur chargement templates:', error)
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const handleCoupleSelect = (coupleId: string) => {
    const couple = couples.find(c => c.id === coupleId)
    if (couple) {
      if (!couple.has_billing_info) {
        toast.error('Ce couple n\'a pas renseigné ses informations de facturation')
        return
      }
      setSelectedCouple(couple)
      setFormData(prev => ({ ...prev, couple_id: coupleId }))
      setStep('fill_form')
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setFormData(prev => ({
        ...prev,
        template_id: templateId,
        title: template.title_template,
        description: template.description_template || '',
        amount: template.default_amount || 0,
        includedServices: template.included_services || [],
        excludedServices: template.excluded_services || [],
        conditions: template.conditions || '',
        validityDays: template.validity_days || 30,
      }))
    } else {
      setFormData(prev => ({ ...prev, template_id: '' }))
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/devis/quick-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couple_id: formData.couple_id,
          template_id: formData.template_id || undefined,
          amount: formData.amount,
          title: formData.title,
          description: formData.description,
          included_services: formData.includedServices,
          excluded_services: formData.excludedServices,
          conditions: formData.conditions || undefined,
          validity_days: formData.validityDays,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération')
      }

      setGeneratedDevis({ id: data.devis.id, pdfUrl: data.pdfUrl })
      setStep('success')
      toast.success('Devis généré avec succès !')
      onSuccess?.({ id: data.devis.id, pdfUrl: data.pdfUrl })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep('select_couple')
    setSelectedCouple(null)
    setGeneratedDevis(null)
    setFormData({
      couple_id: '',
      template_id: '',
      amount: 0,
      title: '',
      description: '',
      includedServices: [],
      excludedServices: [],
      conditions: '',
      validityDays: 30,
    })
    onClose()
  }

  const formatCoupleName = (couple: CoupleForDevis) => {
    const name1 = couple.partner_1_name || ''
    const name2 = couple.partner_2_name || ''
    if (name1 && name2) return `${name1} & ${name2}`
    return name1 || name2 || 'Couple sans nom'
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: 'select_couple', label: 'Couple', icon: <User className="h-3.5 w-3.5" /> },
    { key: 'fill_form', label: 'Détails', icon: <FileText className="h-3.5 w-3.5" /> },
    { key: 'preview', label: 'Aperçu', icon: <Eye className="h-3.5 w-3.5" /> },
    { key: 'success', label: 'Terminé', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === step)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-between px-2 pt-2 pb-1">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300',
                    i < currentStepIndex
                      ? 'bg-[#823F91] text-white'
                      : i === currentStepIndex
                      ? 'bg-[#823F91]/15 text-[#823F91] ring-2 ring-[#823F91]/30'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {i < currentStepIndex ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    s.icon
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    i <= currentStepIndex ? 'text-[#823F91]' : 'text-gray-400'
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-1 rounded-full transition-all duration-300 -mt-4',
                    i < currentStepIndex ? 'bg-[#823F91]' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Étape 1: Sélection du couple */}
        {step === 'select_couple' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Génération rapide de devis
              </DialogTitle>
              <DialogDescription>
                Sélectionnez le couple pour lequel vous souhaitez créer un devis
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              {isLoadingCouples ? (
                <>
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </>
              ) : couples.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Aucun couple disponible. Vous devez d&apos;abord avoir une conversation avec un couple.
                  </p>
                </div>
              ) : (
                couples.map(couple => (
                  <Card
                    key={couple.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md',
                      !couple.has_billing_info && 'opacity-60'
                    )}
                    onClick={() => handleCoupleSelect(couple.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{formatCoupleName(couple)}</p>
                            {couple.wedding_date && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(couple.wedding_date).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {couple.has_billing_info ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Prêt
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Infos manquantes
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Étape 2: Formulaire */}
        {step === 'fill_form' && selectedCouple && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Créer un devis pour {formatCoupleName(selectedCouple)}
              </DialogTitle>
              <DialogDescription>
                Remplissez les informations du devis ou utilisez un modèle
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Sélection de modèle */}
              {!isLoadingTemplates && templates.length > 0 && (
                <div className="space-y-2">
                  <Label>Utiliser un modèle (optionnel)</Label>
                  <Select
                    value={formData.template_id}
                    onValueChange={handleTemplateSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un modèle..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun modèle</SelectItem>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                          {template.is_default && ' (Par défaut)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Titre */}
              <div className="space-y-2">
                <Label htmlFor="title">Titre de la prestation *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Photographie de mariage - Formule Premium"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre prestation..."
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Montant et validité */}
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
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        amount: parseFloat(e.target.value) || 0,
                      }))}
                    />
                    <Euro className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validity">Validité (jours)</Label>
                  <Input
                    id="validity"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.validityDays}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      validityDays: parseInt(e.target.value) || 30,
                    }))}
                  />
                </div>
              </div>

              {/* Services inclus */}
              <div className="space-y-2">
                <Label htmlFor="included">Services inclus (un par ligne)</Label>
                <Textarea
                  id="included"
                  placeholder="Ex:&#10;Reportage photo 8h&#10;Album 30x30&#10;Clé USB"
                  rows={3}
                  value={formData.includedServices.join('\n')}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    includedServices: e.target.value.split('\n').filter(s => s.trim()),
                  }))}
                />
              </div>

              {/* Conditions */}
              <div className="space-y-2">
                <Label htmlFor="conditions">Conditions (optionnel)</Label>
                <Textarea
                  id="conditions"
                  placeholder="Acompte de 30% à la commande..."
                  rows={2}
                  value={formData.conditions}
                  onChange={e => setFormData(prev => ({ ...prev, conditions: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('select_couple')} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button
                onClick={() => setStep('preview')}
                disabled={!formData.title || !formData.description || !formData.amount}
                className="gap-1.5 bg-[#823F91] hover:bg-[#6D3478] text-white"
              >
                Aperçu
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>

            {/* Aide contextuelle */}
            {(!formData.title || !formData.description || !formData.amount) && (
              <p className="text-xs text-amber-600 text-center mt-2 flex items-center justify-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Remplissez les champs obligatoires (*) pour continuer
              </p>
            )}
          </>
        )}

        {/* Étape 3: Aperçu */}
        {step === 'preview' && selectedCouple && (
          <>
            <DialogHeader>
              <DialogTitle>Aperçu du devis</DialogTitle>
              <DialogDescription>
                Vérifiez les informations avant de générer le PDF
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Card className="border-purple-200 bg-purple-50/30">
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{formData.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Pour {formatCoupleName(selectedCouple)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">
                        {formatAmount(formData.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">HT</p>
                    </div>
                  </div>

                  <p className="text-sm">{formData.description}</p>

                  {formData.includedServices.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">
                        Services inclus :
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {formData.includedServices.map((s, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground pt-2 border-t">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Valable {formData.validityDays} jours
                  </p>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('fill_form')} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Modifier
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="gap-1.5 bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Générer et envoyer
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Étape 4: Succès */}
        {step === 'success' && generatedDevis && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Devis généré avec succès !
              </DialogTitle>
            </DialogHeader>

            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center shadow-lg shadow-green-100">
                <FileCheck className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">
                  Votre devis a été créé
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Le PDF a été généré et enregistré dans votre historique de devis.
                </p>
              </div>
              {generatedDevis.pdfUrl && (
                <Button
                  variant="outline"
                  onClick={() => window.open(generatedDevis.pdfUrl, '_blank')}
                  className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  Voir le PDF
                </Button>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="bg-[#823F91] hover:bg-[#6D3478] text-white">
                Fermer
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
