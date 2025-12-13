'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Upload, 
  Sparkles, 
  AlertCircle,
  FileText,
  Clock,
  Download,
  Loader2
} from 'lucide-react'
import { DocumentUploader } from '@/components/marriage-admin/DocumentUploader'
import { AIDocumentGenerator } from '@/components/marriage-admin/AIDocumentGenerator'

interface Document {
  id: string
  label: string
  description: string
  required: boolean
  bothSpouses: boolean
  expiryMonths?: number
  aiGeneratable: boolean
  category: string
  helpText?: string
}

interface UploadedDoc {
  id: string
  document_type: string
  status: string
  file_url: string
  original_filename: string
  uploaded_at: string
}

export default function ChecklistPage() {
  const router = useRouter()
  const [marriageFile, setMarriageFile] = useState<any>(null)
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [showUploader, setShowUploader] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Charge le dossier
      const { data: fileData, error: fileError } = await supabase
        .from('marriage_administrative_files')
        .select('*')
        .eq('couple_id', user.id)
        .single()

      if (fileError) throw fileError
      setMarriageFile(fileData)

      // Charge les documents uploadés
      const { data: docsData, error: docsError } = await supabase
        .from('uploaded_documents')
        .select('*')
        .eq('marriage_file_id', fileData.id)

      if (docsError) throw docsError
      setUploadedDocs(docsData || [])

    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  function getDocumentStatus(docId: string) {
    const uploaded = uploadedDocs.find(d => d.document_type === docId)
    if (!uploaded) return 'missing'
    return uploaded.status
  }

  function handleUploadClick(doc: Document) {
    setSelectedDoc(doc)
    setShowUploader(true)
  }

  function handleGenerateClick(doc: Document) {
    setSelectedDoc(doc)
    setShowGenerator(true)
  }

  function handleUploadSuccess() {
    setShowUploader(false)
    loadData() // Recharge les données
  }

  async function handleDownloadPDF() {
    setDownloadingPDF(true)

    try {
      const response = await fetch('/api/marriage-admin/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marriageFileId: marriageFile.id
        })
      })

      if (!response.ok) {
        throw new Error('Erreur génération PDF')
      }

      // Télécharge le PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Dossier-Mariage-${marriageFile.municipality}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      console.log('✅ PDF téléchargé')

    } catch (error: any) {
      console.error('❌ Erreur:', error)
      alert('Erreur lors du téléchargement: ' + error.message)
    } finally {
      setDownloadingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <div className="text-center">Chargement...</div>
      </div>
    )
  }

  if (!marriageFile) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore de dossier de mariage.
            </p>
            <Button onClick={() => router.push('/dashboard/dossier-mariage/questionnaire')}>
              Créer Mon Dossier
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const checklist: Document[] = marriageFile.documents_checklist || []
  const requiredDocs = checklist.filter(d => d.required)
  const completedDocs = requiredDocs.filter(d => getDocumentStatus(d.id) === 'validated')
  const progress = requiredDocs.length > 0 
    ? Math.round((completedDocs.length / requiredDocs.length) * 100)
    : 0

  // Groupe par catégorie
  const categories = {
    identity: { label: 'Identité', docs: [] as Document[] },
    civil_status: { label: 'État Civil', docs: [] as Document[] },
    address: { label: 'Domicile', docs: [] as Document[] },
    witnesses: { label: 'Témoins', docs: [] as Document[] },
    other: { label: 'Autres', docs: [] as Document[] }
  }

  checklist.forEach(doc => {
    const cat = doc.category as keyof typeof categories
    if (categories[cat]) {
      categories[cat].docs.push(doc)
    }
  })

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => router.push('/dashboard/dossier-mariage')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour au Dashboard
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Ma Checklist de Documents
        </h1>
        <p className="text-muted-foreground">
          Mariage à {marriageFile.municipality} - {new Date(marriageFile.wedding_date).toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* Progression */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Progression Globale</CardTitle>
            <span className="text-2xl font-bold">{progress}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="mb-4" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{completedDocs.length} sur {requiredDocs.length} documents validés</span>
            <span>{requiredDocs.length - completedDocs.length} restants</span>
          </div>
        </CardContent>
      </Card>

      {/* Bouton Télécharger PDF */}
      {progress === 100 && (
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  ✅ Dossier Complet !
                </h3>
                <p className="text-sm text-muted-foreground">
                  Tous vos documents sont validés. Téléchargez votre dossier complet au format PDF.
                </p>
              </div>

              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
              >
                {downloadingPDF ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Télécharger PDF
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Légende */}
      <div className="flex gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4 text-gray-400" />
          <span>Manquant</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          <span>En attente</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>Validé</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Générable par IA</span>
        </div>
      </div>

      {/* Documents par catégorie */}
      <div className="space-y-8">
        {Object.entries(categories).map(([key, cat]) => {
          if (cat.docs.length === 0) return null

          return (
            <div key={key}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {cat.label}
              </h2>

              <div className="grid gap-4">
                {cat.docs.map((doc) => {
                  const status = getDocumentStatus(doc.id)
                  const uploaded = uploadedDocs.find(d => d.document_type === doc.id)

                  const statusConfig = {
                    missing: {
                      icon: Circle,
                      color: 'text-gray-400',
                      badge: 'Manquant',
                      badgeVariant: 'secondary' as const
                    },
                    uploaded: {
                      icon: Clock,
                      color: 'text-orange-500',
                      badge: 'En attente',
                      badgeVariant: 'outline' as const
                    },
                    validated: {
                      icon: CheckCircle2,
                      color: 'text-green-600',
                      badge: 'Validé',
                      badgeVariant: 'default' as const
                    }
                  }

                  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.missing
                  const StatusIcon = config.icon

                  return (
                    <Card key={doc.id} className={status === 'validated' ? 'border-green-200' : ''}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          {/* Info document */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <StatusIcon className={`w-5 h-5 ${config.color}`} />
                              <h3 className="font-semibold">{doc.label}</h3>
                              {doc.required && (
                                <Badge variant="destructive" className="text-xs">Obligatoire</Badge>
                              )}
                              {doc.bothSpouses && (
                                <Badge variant="outline" className="text-xs">Les 2</Badge>
                              )}
                              {doc.aiGeneratable && (
                                <Sparkles className="w-4 h-4 text-blue-600" />
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground mb-2">
                              {doc.description}
                            </p>

                            {doc.helpText && (
                              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>{doc.helpText}</span>
                              </div>
                            )}

                            {uploaded && (
                              <div className="mt-3">
                                <Badge variant={config.badgeVariant}>
                                  {config.badge}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {uploaded.original_filename}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Uploadé le {new Date(uploaded.uploaded_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            {status !== 'validated' && (
                              <>
                                <Button 
                                  size="sm"
                                  onClick={() => handleUploadClick(doc)}
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Uploader
                                </Button>

                                {doc.aiGeneratable && (
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleGenerateClick(doc)}
                                  >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Générer
                                  </Button>
                                )}
                              </>
                            )}

                            {uploaded && (
                              <Button 
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(uploaded.file_url, '_blank')}
                              >
                                Voir
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      {showUploader && selectedDoc && (
        <DocumentUploader
          document={selectedDoc}
          marriageFileId={marriageFile.id}
          onSuccess={handleUploadSuccess}
          onClose={() => setShowUploader(false)}
        />
      )}

      {showGenerator && selectedDoc && (
        <AIDocumentGenerator
          document={selectedDoc}
          marriageFile={marriageFile}
          onClose={() => setShowGenerator(false)}
        />
      )}
    </div>
  )
}

