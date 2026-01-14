'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Download, Loader2, Copy, CheckCircle } from 'lucide-react'

interface AIDocumentGeneratorProps {
  document: {
    id: string
    label: string
    description: string
  }
  marriageFile: any
  onClose: () => void
}

export function AIDocumentGenerator({ 
  document: doc, 
  marriageFile, 
  onClose 
}: AIDocumentGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)

    try {
      // Prépare les données selon le type de document
      let userData: any = {}
      const questionnaire = marriageFile.questionnaire_data

      if (doc.id === 'birth_certificate') {
        // Demande d'acte de naissance (Spouse A par défaut)
        userData = {
          firstName: questionnaire.spouseAFirstName,
          lastName: questionnaire.spouseALastName,
          birthDate: new Date(questionnaire.spouseABirthDate).toLocaleDateString('fr-FR'),
          birthPlace: questionnaire.spouseABirthPlace,
          weddingDate: new Date(marriageFile.wedding_date).toLocaleDateString('fr-FR'),
          municipality: marriageFile.municipality
        }
      } else if (doc.id === 'address_proof') {
        // Attestation d'hébergement
        userData = {
          hostName: '[NOM DE L\'HÉBERGEUR]',
          address: '[ADRESSE COMPLÈTE]',
          guestName: `${questionnaire.spouseAFirstName} ${questionnaire.spouseALastName}`,
          sinceDate: '[DATE DE DÉBUT]'
        }
      } else if (doc.id === 'witnesses_list') {
        // Liste des témoins
        userData = {
          witnesses: [
            {
              firstName: '[Prénom]',
              lastName: '[Nom]',
              birthDate: '[Date naissance]',
              birthPlace: '[Lieu naissance]',
              profession: '[Profession]',
              address: '[Adresse]'
            },
            {
              firstName: '[Prénom]',
              lastName: '[Nom]',
              birthDate: '[Date naissance]',
              birthPlace: '[Lieu naissance]',
              profession: '[Profession]',
              address: '[Adresse]'
            }
          ]
        }
      }

      // Appelle l'API
      const response = await fetch('/api/marriage-admin/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: doc.id === 'birth_certificate' 
            ? 'birth_certificate_request' 
            : doc.id === 'address_proof'
            ? 'housing_certificate'
            : 'witnesses_list',
          userData
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur génération')
      }

      setContent(result.content)

    } catch (err: any) {
      console.error('❌ Erreur:', err)
      setError(err.message || 'Erreur lors de la génération')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (!content) return

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `${doc.id}-${Date.now()}.txt`
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Générer avec l'IA
          </DialogTitle>
          <DialogDescription>
            {doc.label} - {doc.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          {!content && !generating && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">ℹ️ Comment ça marche ?</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• L'IA va générer un document pré-rempli</li>
                <li>• Relisez et modifiez selon vos besoins</li>
                <li>• Téléchargez ou copiez le texte</li>
                <li>• Complétez les informations manquantes</li>
              </ul>
            </div>
          )}

          {/* Bouton générer */}
          {!content && !generating && (
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleGenerate}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Générer le Document
            </Button>
          )}

          {/* Loading */}
          {generating && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-sm text-muted-foreground">
                Génération en cours...
              </p>
            </div>
          )}

          {/* Contenu généré */}
          {content && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Document généré avec succès !
              </div>

              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                placeholder="Le document généré apparaîtra ici..."
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copier
                    </>
                  )}
                </Button>

                <Button
                  className="flex-1 bg-rose-600 hover:bg-rose-700"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                ⚠️ Vérifiez et complétez les informations avant utilisation
              </p>
            </>
          )}

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Fermer */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={onClose}
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

