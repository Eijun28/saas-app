'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, FileText, Sparkles, Loader2, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Service {
  id: string
  nom: string
  description: string
  prix: number
}

interface ServiceImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onImportServices: (services: Omit<Service, 'id'>[]) => void
}

export function ServiceImportDialog({ isOpen, onClose, onImportServices }: ServiceImportDialogProps) {
  const [mode, setMode] = useState<'pdf' | 'ia' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedServices, setExtractedServices] = useState<Omit<Service, 'id'>[]>([])
  const [iaQuestionnaire, setIaQuestionnaire] = useState({
    type_activite: '',
    specialites: '',
    tarifs_habituels: '',
    autres_info: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Veuillez sélectionner un fichier PDF')
      return
    }

    setIsProcessing(true)

    try {
      // Upload PDF et envoi à n8n pour extraction avec IA
      const formData = new FormData()
      formData.append('file', file)

      const N8N_EXTRACT_URL = process.env.NEXT_PUBLIC_N8N_EXTRACT_SERVICES_URL
      if (!N8N_EXTRACT_URL) {
        toast.error('Service d\'extraction non configuré. Veuillez utiliser le questionnaire IA.')
        setIsProcessing(false)
        return
      }

      const response = await fetch(N8N_EXTRACT_URL, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'extraction')
      }

      const data = await response.json()
      
      // Format attendu: { services: [{ nom, description, prix }] }
      if (data.services && Array.isArray(data.services)) {
        setExtractedServices(data.services)
      } else {
        throw new Error('Format de réponse invalide')
      }

    } catch (error) {
      console.error('Erreur extraction PDF:', error)
      toast.error('Erreur lors de l\'extraction des services depuis le PDF. Veuillez réessayer ou utiliser le questionnaire IA.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleIAQuestionnaire = async () => {
    if (!iaQuestionnaire.type_activite.trim()) {
      toast.error('Veuillez indiquer votre type d\'activité')
      return
    }

    setIsProcessing(true)

    try {
      const N8N_GENERATE_URL = process.env.NEXT_PUBLIC_N8N_GENERATE_SERVICES_URL
      if (!N8N_GENERATE_URL) {
        toast.error('Service de génération non configuré. Veuillez ajouter vos services manuellement.')
        setIsProcessing(false)
        return
      }

      const response = await fetch(N8N_GENERATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type_activite: iaQuestionnaire.type_activite,
          specialites: iaQuestionnaire.specialites,
          tarifs_habituels: iaQuestionnaire.tarifs_habituels,
          autres_info: iaQuestionnaire.autres_info,
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la génération')
      }

      const data = await response.json()
      
      // Format attendu: { services: [{ nom, description, prix }] }
      if (data.services && Array.isArray(data.services)) {
        setExtractedServices(data.services)
      } else {
        throw new Error('Format de réponse invalide')
      }

    } catch (error) {
      console.error('Erreur génération IA:', error)
      toast.error('Erreur lors de la génération des services. Veuillez réessayer.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = () => {
    if (extractedServices.length === 0) {
      toast.error('Aucun service à importer')
      return
    }

    onImportServices(extractedServices)
    handleClose()
  }

  const handleClose = () => {
    setMode(null)
    setExtractedServices([])
    setIaQuestionnaire({
      type_activite: '',
      specialites: '',
      tarifs_habituels: '',
      autres_info: ''
    })
    setIsProcessing(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[70vh] sm:max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importer des services</DialogTitle>
        </DialogHeader>

        {!mode ? (
          // Choix du mode
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground mb-6">
              Choisissez comment vous souhaitez ajouter vos services :
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option PDF */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode('pdf')}
                className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#823F91] hover:bg-purple-50/50 transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Importer depuis PDF
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Téléchargez votre catalogue ou liste de services en PDF. Notre IA extraira automatiquement les informations.
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* Option Questionnaire IA */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode('ia')}
                className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#823F91] hover:bg-purple-50/50 transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Questionnaire IA
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Répondez à quelques questions et notre IA créera vos services automatiquement.
                    </p>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        ) : mode === 'pdf' ? (
          // Mode PDF
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Télécharger votre PDF</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                  "hover:border-[#823F91] hover:bg-purple-50/50",
                  isProcessing && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isProcessing}
                />
                {isProcessing ? (
                  <div className="space-y-3">
                    <Loader2 className="h-12 w-12 text-[#823F91] mx-auto animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      Extraction des services en cours...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Cliquez pour sélectionner un PDF
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Formats acceptés : PDF uniquement
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {extractedServices.length > 0 && (
              <div className="space-y-3">
                <Label>Services extraits ({extractedServices.length})</Label>
                <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-4">
                  {extractedServices.map((service, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900">
                            {service.nom}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {service.description}
                          </p>
                          <p className="text-sm font-semibold text-[#823F91] mt-2">
                            {service.prix.toFixed(2)}€
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setExtractedServices(extractedServices.filter((_, i) => i !== index))
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Mode Questionnaire IA
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type_activite">
                Type d'activité *
              </Label>
              <Input
                id="type_activite"
                value={iaQuestionnaire.type_activite}
                onChange={(e) => setIaQuestionnaire({ ...iaQuestionnaire, type_activite: e.target.value })}
                placeholder="Ex: Photographe, Traiteur, DJ, Fleuriste..."
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialites">
                Spécialités (optionnel)
              </Label>
              <Textarea
                id="specialites"
                value={iaQuestionnaire.specialites}
                onChange={(e) => setIaQuestionnaire({ ...iaQuestionnaire, specialites: e.target.value })}
                placeholder="Ex: Mariages multiculturels, événements en extérieur, cuisine végétarienne..."
                className="min-h-[80px] resize-none"
                rows={3}
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tarifs_habituels">
                Fourchette de tarifs habituels (optionnel)
              </Label>
              <Input
                id="tarifs_habituels"
                value={iaQuestionnaire.tarifs_habituels}
                onChange={(e) => setIaQuestionnaire({ ...iaQuestionnaire, tarifs_habituels: e.target.value })}
                placeholder="Ex: 500€ - 2000€, ou décrivez vos tarifs..."
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="autres_info">
                Autres informations (optionnel)
              </Label>
              <Textarea
                id="autres_info"
                value={iaQuestionnaire.autres_info}
                onChange={(e) => setIaQuestionnaire({ ...iaQuestionnaire, autres_info: e.target.value })}
                placeholder="Tout autre détail qui pourrait aider à générer vos services..."
                className="min-h-[80px] resize-none"
                rows={3}
                disabled={isProcessing}
              />
            </div>

            {isProcessing ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-[#823F91] mx-auto animate-spin mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Génération de vos services en cours...
                  </p>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleIAQuestionnaire}
                disabled={!iaQuestionnaire.type_activite.trim()}
                className="w-full bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91]"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Générer mes services avec l'IA
              </Button>
            )}

            {extractedServices.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <Label>Services générés ({extractedServices.length})</Label>
                <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-4">
                  {extractedServices.map((service, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900">
                            {service.nom}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {service.description}
                          </p>
                          <p className="text-sm font-semibold text-[#823F91] mt-2">
                            {service.prix.toFixed(2)}€
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setExtractedServices(extractedServices.filter((_, i) => i !== index))
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {mode && (
            <Button
              variant="outline"
              onClick={() => {
                setMode(null)
                setExtractedServices([])
                setIsProcessing(false)
              }}
            >
              Retour
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleClose}
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          {extractedServices.length > 0 && (
            <Button
              onClick={handleImport}
              className="bg-[#823F91] hover:bg-[#6D3478] text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              Importer {extractedServices.length} service{extractedServices.length > 1 ? 's' : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

