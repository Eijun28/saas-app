'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Edit3,
  FolderOpen,
  Sparkles,
  Upload,
  Calendar,
  MapPin,
  Users,
  ArrowRight
} from 'lucide-react'

export default function DossierMariagePage() {
  const router = useRouter()
  const [marriageFile, setMarriageFile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadMarriageFile()
  }, [])

  async function loadMarriageFile() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/sign-in')
        return
      }

      setUserId(user.id)

      const { data, error } = await supabase
        .from('marriage_administrative_files')
        .select('*')
        .eq('couple_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur:', error)
      }

      setMarriageFile(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  // Pas de dossier = Landing page
  if (!marriageFile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
        <div className="container max-w-6xl mx-auto py-20 px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 mb-6 shadow-lg shadow-rose-200">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              Assistant Administratif Mariage
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
              L'IA qui simplifie votre dossier de mariage.
              <br />
              <span className="font-semibold text-rose-600">Plus rapide, plus simple, sans stress.</span>
            </p>

            <Button 
              size="lg" 
              className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-rose-200 hover:shadow-xl transition-all"
              onClick={() => router.push('/dashboard/dossier-mariage/questionnaire')}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Commencer Mon Dossier
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Checklist Personnalisée</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Liste exacte des documents selon votre situation (binational, divorcé, etc.)
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Génération IA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Lettres et attestations générées automatiquement par l'IA
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Suivi en Temps Réel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Rappels automatiques et alertes pour documents qui expirent
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur border border-rose-100">
              <div className="text-3xl font-bold text-rose-600 mb-1">500+</div>
              <div className="text-sm text-slate-600">Couples aidés</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur border border-rose-100">
              <div className="text-3xl font-bold text-rose-600 mb-1">2h</div>
              <div className="text-sm text-slate-600">Temps économisé</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur border border-rose-100">
              <div className="text-3xl font-bold text-rose-600 mb-1">98%</div>
              <div className="text-sm text-slate-600">Dossiers validés</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Dossier existe = Dashboard
  const statusConfig = {
    draft: { 
      label: 'Brouillon', 
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: FileText,
      gradient: 'from-slate-400 to-slate-600'
    },
    in_progress: { 
      label: 'En cours', 
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Clock,
      gradient: 'from-blue-400 to-blue-600'
    },
    submitted: { 
      label: 'Déposé', 
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      icon: CheckCircle,
      gradient: 'from-orange-400 to-orange-600'
    },
    approved: { 
      label: 'Validé', 
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle,
      gradient: 'from-green-400 to-green-600'
    }
  }

  const status = statusConfig[marriageFile.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      <div className="container max-w-7xl mx-auto py-12 px-4">
        {/* Header avec gradient */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-200">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                Dossier de Mariage
              </h1>
              <div className="flex items-center gap-4 mt-2 text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {new Date(marriageFile.wedding_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{marriageFile.municipality}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Statut & Documents */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Statut Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${status.gradient}`}></div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${status.color} border flex items-center justify-center`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Statut</div>
                    <div className="text-xl font-bold">{status.label}</div>
                  </div>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 font-medium">Progression</span>
                  <span className="font-bold text-rose-600">{marriageFile.progress_percentage}%</span>
                </div>
                <Progress 
                  value={marriageFile.progress_percentage} 
                  className="h-3"
                />
                {marriageFile.progress_percentage === 100 && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg mt-4">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Dossier complet !</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Documents requis</div>
                  <div className="text-5xl font-bold mt-2">
                    {marriageFile.documents_checklist?.filter((d: any) => d.required).length || 0}
                  </div>
                </div>
                <FileText className="w-12 h-12 opacity-40" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm opacity-90">
                Documents personnalisés selon votre situation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card 
            className="border-2 border-dashed border-slate-200 hover:border-rose-300 hover:shadow-lg transition-all cursor-pointer bg-white/60 backdrop-blur group"
            onClick={() => router.push('/dashboard/dossier-mariage/questionnaire')}
          >
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-14 h-14 rounded-xl bg-slate-100 group-hover:bg-rose-100 flex items-center justify-center mx-auto mb-4 transition-colors">
                <Edit3 className="w-7 h-7 text-slate-600 group-hover:text-rose-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Modifier mes infos</h3>
              <p className="text-sm text-slate-500">Mettre à jour le questionnaire</p>
            </CardContent>
          </Card>

          <Card 
            className="border-2 border-rose-600 hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-rose-500 to-pink-600 text-white group"
            onClick={() => router.push('/dashboard/dossier-mariage/checklist')}
          >
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-14 h-14 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center mx-auto mb-4 transition-colors">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Voir ma checklist</h3>
              <p className="text-sm opacity-90">Gérer mes documents</p>
            </CardContent>
          </Card>

          <Card 
            className="border-2 border-dashed border-slate-200 hover:border-rose-300 hover:shadow-lg transition-all cursor-pointer bg-white/60 backdrop-blur group"
            onClick={() => router.push('/dashboard/dossier-mariage/documents')}
          >
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-14 h-14 rounded-xl bg-slate-100 group-hover:bg-rose-100 flex items-center justify-center mx-auto mb-4 transition-colors">
                <FolderOpen className="w-7 h-7 text-slate-600 group-hover:text-rose-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Mes documents</h3>
              <p className="text-sm text-slate-500">Voir tous les fichiers</p>
            </CardContent>
          </Card>
        </div>

        {/* Prochaines Actions */}
        {marriageFile.progress_percentage < 100 && (
          <Card className="border-0 shadow-xl bg-gradient-to-r from-orange-50 to-rose-50 border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-orange-900">Prochaines Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Complétez votre checklist</p>
                    <p className="text-slate-600 text-xs mt-1">Uploadez tous les documents requis</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Utilisez l'IA pour générer les documents</p>
                    <p className="text-slate-600 text-xs mt-1">Lettres et attestations automatiques</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Téléchargez votre dossier PDF</p>
                    <p className="text-slate-600 text-xs mt-1">Tous vos documents en un seul fichier</p>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full mt-6 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white"
                onClick={() => router.push('/dashboard/dossier-mariage/checklist')}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Continuer Mon Dossier
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
