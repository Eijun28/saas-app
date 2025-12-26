'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Heart, 
  Send,
  Loader2,
  Euro,
  Calendar,
  Users,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Eye
} from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// Types adaptés à ta structure profiles
interface Demande {
  id: string
  couple_id: string
  prestataire_id?: string
  provider_id?: string // Alias pour compatibilité
  service_type?: string
  type_prestation?: string // Nom réel dans la DB
  message?: string
  date_mariage?: string // Nom réel dans la DB
  wedding_date?: string // Alias pour compatibilité
  guest_count?: number
  budget_min?: number
  budget_max?: number
  budget_indicatif?: number
  location?: string
  status: 'new' | 'in-progress' | 'accepted' | 'rejected' | 'completed' | 'pending' | 'viewed' | 'responded'
  created_at: string
  updated_at: string
  viewed_at?: string
  responded_at?: string
  provider?: {
    nom_entreprise: string
    service_type: string
    avatar_url?: string
    prenom?: string
    nom?: string
  }
}

interface Devis {
  id: string
  demande_id: string
  provider_id: string
  couple_id: string
  title: string
  description?: string
  amount: number
  currency: string
  included_services?: string[]
  excluded_services?: string[]
  conditions?: string
  valid_until?: string
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating' | 'expired'
  attachment_url?: string
  created_at: string
  updated_at: string
  viewed_at?: string
  accepted_at?: string
  rejected_at?: string
  provider?: {
    nom_entreprise: string
    service_type: string
    avatar_url?: string
  }
  demande?: {
    service_type: string
    wedding_date?: string
    message: string
  }
}

interface Favori {
  id: string
  couple_id: string
  prestataire_id?: string
  provider_id?: string // Alias pour compatibilité
  created_at: string
  provider?: {
    nom_entreprise: string
    service_type: string
    avatar_url?: string
    ville_principale?: string
    description_courte?: string
  }
}

const DEMANDE_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  viewed: 'Vue',
  responded: 'Répondu',
  accepted: 'Acceptée',
  rejected: 'Refusée',
}

const DEMANDE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  viewed: 'bg-blue-100 text-blue-800',
  responded: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

const DEVIS_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  accepted: 'Accepté',
  rejected: 'Refusé',
  negotiating: 'En négociation',
  expired: 'Expiré',
}

const DEVIS_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  negotiating: 'bg-blue-100 text-blue-800',
  expired: 'bg-gray-100 text-gray-800',
}

const formatAmount = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount)
}

const isDevisExpired = (devis: Devis): boolean => {
  if (!devis.valid_until) return false
  return new Date(devis.valid_until) < new Date()
}

const getDaysUntilExpiration = (validUntil: string): number => {
  const today = new Date()
  const expirationDate = new Date(validUntil)
  const diffTime = expirationDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export default function DemandesPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('demandes')
  
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [devis, setDevis] = useState<Devis[]>([])
  const [favoris, setFavoris] = useState<Favori[]>([])

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/sign-in')
      return
    }
    if (user) {
      loadAllData()
    }
  }, [user, userLoading, router])

  const loadAllData = async () => {
    setLoading(true)
    await Promise.all([
      loadDemandes(),
      loadDevis(),
      loadFavoris()
    ])
    setLoading(false)
  }

  const loadDemandes = async () => {
    if (!user) return

    const supabase = createClient()
    
    // Charger les demandes
    const { data: demandesData, error } = await supabase
      .from('demandes')
      .select('*')
      .eq('couple_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur chargement demandes:', error)
      toast.error('Erreur lors du chargement des demandes')
      return
    }

    if (!demandesData || demandesData.length === 0) {
      setDemandes([])
      return
    }

    // Charger les profils prestataires et profiles pour chaque demande
    const transformedData = await Promise.all(
      demandesData.map(async (demande: any) => {
        const prestataireId = demande.prestataire_id

        // Charger le profil prestataire
        const { data: prestataireProfile } = await supabase
          .from('prestataire_profiles')
          .select('nom_entreprise, type_prestation')
          .eq('user_id', prestataireId)
          .single()

        // Charger le profil de base pour l'avatar et le nom
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, prenom, nom')
          .eq('id', prestataireId)
          .single()

        return {
          ...demande,
          provider_id: prestataireId, // Alias pour compatibilité
          service_type: prestataireProfile?.type_prestation || demande.type_prestation, // Alias pour compatibilité
          wedding_date: demande.date_mariage, // Alias pour compatibilité
          provider: prestataireProfile ? {
            nom_entreprise: prestataireProfile.nom_entreprise || '',
            service_type: prestataireProfile.type_prestation || '',
            avatar_url: profile?.avatar_url,
            prenom: profile?.prenom,
            nom: profile?.nom
          } : undefined
        }
      })
    )

    setDemandes(transformedData)
  }

  const loadDevis = async () => {
    if (!user) return

    const supabase = createClient()
    
    // Note: Si la table devis n'existe pas encore, cette requête échouera
    // On gère l'erreur gracieusement
    const { data: devisData, error } = await supabase
      .from('devis')
      .select('*')
      .eq('couple_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      // Si la table n'existe pas, on retourne un tableau vide
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.warn('Table devis n\'existe pas encore')
        setDevis([])
        return
      }
      console.error('Erreur chargement devis:', error)
      toast.error('Erreur lors du chargement des devis')
      return
    }

    if (!devisData || devisData.length === 0) {
      setDevis([])
      return
    }

    // Charger les profils prestataires et demandes pour chaque devis
    const transformedData = await Promise.all(
      devisData.map(async (devis: any) => {
        const prestataireId = devis.prestataire_id || devis.provider_id

        // Charger le profil prestataire
        const { data: prestataireProfile } = await supabase
          .from('prestataire_profiles')
          .select('nom_entreprise, type_prestation')
          .eq('user_id', prestataireId)
          .single()

        // Charger le profil de base pour l'avatar
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', prestataireId)
          .single()

        // Charger la demande associée si elle existe
        let demandeData = null
        if (devis.demande_id) {
          const { data: demande } = await supabase
            .from('demandes')
            .select('type_prestation, date_mariage, message')
            .eq('id', devis.demande_id)
            .single()
          demandeData = demande
        }

        return {
          ...devis,
          provider: prestataireProfile ? {
            nom_entreprise: prestataireProfile.nom_entreprise || '',
            service_type: prestataireProfile.type_prestation || '',
            avatar_url: profile?.avatar_url
          } : undefined,
          demande: demandeData ? {
            service_type: demandeData.type_prestation || '',
            wedding_date: demandeData.date_mariage,
            message: demandeData.message
          } : undefined
        }
      })
    )

    setDevis(transformedData)
  }

  const loadFavoris = async () => {
    if (!user) return

    const supabase = createClient()
    
    // Charger les favoris
    const { data: favorisData, error } = await supabase
      .from('favoris')
      .select('*')
      .eq('couple_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur chargement favoris:', error)
      toast.error('Erreur lors du chargement des favoris')
      return
    }

    if (!favorisData || favorisData.length === 0) {
      setFavoris([])
      return
    }

    // Charger les profils prestataires et profiles pour chaque favori
    const transformedData = await Promise.all(
      favorisData.map(async (favori: any) => {
        const prestataireId = favori.prestataire_id

        // Charger le profil prestataire
        const { data: prestataireProfile } = await supabase
          .from('prestataire_profiles')
          .select('nom_entreprise, type_prestation, ville_exercice')
          .eq('user_id', prestataireId)
          .single()

        // Charger le profil de base pour l'avatar
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', prestataireId)
          .single()

        return {
          ...favori,
          provider_id: prestataireId, // Alias pour compatibilité
          provider: prestataireProfile ? {
            nom_entreprise: prestataireProfile.nom_entreprise || '',
            service_type: prestataireProfile.type_prestation || '',
            avatar_url: profile?.avatar_url,
            ville_principale: prestataireProfile.ville_exercice,
            description_courte: undefined
          } : undefined
        }
      })
    )

    setFavoris(transformedData)
  }

  const handleRemoveFavori = async (favoriId: string) => {
    if (!user) return

    const supabase = createClient()
    const { error } = await supabase
      .from('favoris')
      .delete()
      .eq('id', favoriId)

    if (error) {
      console.error('Erreur suppression favori:', error)
      toast.error('Erreur lors de la suppression')
      return
    }

    toast.success('Retiré des favoris')
    loadFavoris()
  }

  const handleAcceptDevis = async (devisId: string) => {
    if (!user) return

    const supabase = createClient()
    const { error } = await supabase
      .from('devis')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', devisId)

    if (error) {
      console.error('Erreur acceptation devis:', error)
      toast.error('Erreur lors de l\'acceptation')
      return
    }

    toast.success('Devis accepté !')
    loadDevis()
  }

  const handleRejectDevis = async (devisId: string) => {
    if (!user) return

    const supabase = createClient()
    const { error } = await supabase
      .from('devis')
      .update({ 
        status: 'rejected',
        rejected_at: new Date().toISOString()
      })
      .eq('id', devisId)

    if (error) {
      console.error('Erreur rejet devis:', error)
      toast.error('Erreur lors du rejet')
      return
    }

    toast.success('Devis refusé')
    loadDevis()
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
        </motion.div>
      </div>
    )
  }

  const demandesPending = demandes.filter(d => d.status === 'pending').length
  const devisCount = devis.length
  const favorisCount = favoris.length

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-[#6B7280] mt-1">Gérez vos demandes de devis et vos prestataires favoris</p>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="demandes" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span>Demandes</span>
              {demandesPending > 0 && (
                <Badge variant="secondary" className="ml-1 bg-yellow-100 text-yellow-800">
                  {demandesPending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="devis" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Devis reçus</span>
              {devisCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {devisCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="favoris" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span>Favoris</span>
              {favorisCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {favorisCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DEMANDES */}
          <TabsContent value="demandes" className="space-y-4">
            {demandes.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="pt-12 pb-12 text-center">
                  <Send className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucune demande envoyée
                  </h3>
                  <p className="text-gray-500">
                    Les demandes que vous envoyez aux prestataires apparaîtront ici
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {demandes.map((demande) => (
                  <Card key={demande.id} className="border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          {demande.provider?.avatar_url ? (
                            <img
                              src={demande.provider.avatar_url}
                              alt={demande.provider.nom_entreprise}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <Users className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-lg">
                              {demande.provider?.nom_entreprise || 'Prestataire'}
                            </CardTitle>
                            <CardDescription>
                              {demande.service_type} • {new Date(demande.created_at).toLocaleDateString('fr-FR')}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className={DEMANDE_STATUS_COLORS[demande.status]}>
                          {DEMANDE_STATUS_LABELS[demande.status]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{demande.message}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {demande.date_mariage && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(demande.date_mariage).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                          {demande.guest_count && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {demande.guest_count} invités
                            </div>
                          )}
                          {demande.budget_indicatif && (
                            <div className="flex items-center gap-1">
                              <Euro className="h-4 w-4" />
                              Budget: {formatAmount(demande.budget_indicatif)}
                            </div>
                          )}
                        </div>

                        {demande.status === 'viewed' && (
                          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                            <Eye className="h-4 w-4" />
                            Le prestataire a vu votre demande
                          </div>
                        )}

                        {demande.status === 'responded' && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                            <CheckCircle2 className="h-4 w-4" />
                            Le prestataire a répondu ! Consultez vos devis
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: DEVIS - Identique au précédent, juste les noms changent */}
          <TabsContent value="devis" className="space-y-4">
            {devis.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="pt-12 pb-12 text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucun devis reçu
                  </h3>
                  <p className="text-gray-500">
                    Les devis des prestataires apparaîtront ici une fois qu'ils auront répondu à vos demandes
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {devis.map((devisItem) => {
                  const expired = isDevisExpired(devisItem)
                  const daysLeft = devisItem.valid_until ? getDaysUntilExpiration(devisItem.valid_until) : null
                  
                  return (
                    <Card key={devisItem.id} className="border-gray-200 hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            {devisItem.provider?.avatar_url ? (
                              <img
                                src={devisItem.provider.avatar_url}
                                alt={devisItem.provider.nom_entreprise}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <Users className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <CardTitle className="text-lg">{devisItem.title}</CardTitle>
                              <CardDescription>
                                {devisItem.provider?.nom_entreprise} • {new Date(devisItem.created_at).toLocaleDateString('fr-FR')}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <Badge className={DEVIS_STATUS_COLORS[devisItem.status]}>
                              {DEVIS_STATUS_LABELS[devisItem.status]}
                            </Badge>
                            <div className="text-2xl font-bold text-[#823F91]">
                              {formatAmount(devisItem.amount, devisItem.currency)}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {devisItem.description && (
                            <p className="text-sm text-gray-700">{devisItem.description}</p>
                          )}

                          {devisItem.included_services && devisItem.included_services.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Services inclus :</h4>
                              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                {devisItem.included_services.map((service, i) => (
                                  <li key={i}>{service}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {devisItem.valid_until && (
                            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                              expired 
                                ? 'bg-red-50 text-red-700' 
                                : daysLeft && daysLeft <= 7
                                ? 'bg-orange-50 text-orange-700'
                                : 'bg-gray-50 text-gray-700'
                            }`}>
                              <Clock className="h-4 w-4" />
                              {expired ? (
                                'Devis expiré'
                              ) : daysLeft && daysLeft <= 7 ? (
                                `Expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`
                              ) : (
                                `Valide jusqu'au ${new Date(devisItem.valid_until).toLocaleDateString('fr-FR')}`
                              )}
                            </div>
                          )}

                          {devisItem.status === 'pending' && !expired && (
                            <div className="flex gap-3 pt-4 border-t">
                              <Button
                                onClick={() => handleAcceptDevis(devisItem.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Accepter le devis
                              </Button>
                              <Button
                                onClick={() => handleRejectDevis(devisItem.id)}
                                variant="outline"
                                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Refuser
                              </Button>
                            </div>
                          )}

                          {devisItem.attachment_url && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => window.open(devisItem.attachment_url, '_blank')}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Télécharger le devis PDF
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: FAVORIS */}
          <TabsContent value="favoris" className="space-y-4">
            {favoris.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="pt-12 pb-12 text-center">
                  <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucun favori
                  </h3>
                  <p className="text-gray-500">
                    Enregistrez vos prestataires préférés pour les retrouver facilement
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favoris.map((favori) => (
                  <Card key={favori.id} className="border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        {favori.provider?.avatar_url ? (
                          <img
                            src={favori.provider.avatar_url}
                            alt={favori.provider.nom_entreprise}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Users className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">
                            {favori.provider?.nom_entreprise || 'Prestataire'}
                          </CardTitle>
                          <CardDescription>
                            {favori.provider?.service_type}
                            {favori.provider?.ville_principale && ` • ${favori.provider.ville_principale}`}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {favori.provider?.description_courte && (
                        <p className="text-sm text-gray-600 mb-4">
                          {favori.provider.description_courte}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => router.push(`/provider/${favori.provider_id || favori.prestataire_id}`)}
                        >
                          Voir le profil
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveFavori(favori.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

