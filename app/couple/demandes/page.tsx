'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Send, UserRound, X, RefreshCw, Clock, CheckCircle, XCircle, Ban, MoreVertical, MessageSquare } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { extractSupabaseError } from '@/lib/utils'
import { PageTitle } from '@/components/couple/shared/PageTitle'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion } from 'framer-motion'

type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

type RequestRow = {
  id: string
  couple_id: string
  provider_id: string
  status: RequestStatus
  initial_message: string
  created_at: string
  cancelled_at: string | null
  responded_at: string | null
  type_prestation?: string | null
  wedding_date?: string | null
  date_mariage?: string | null
}

type ProviderProfile = {
  id: string
  user_id?: string
  prenom: string | null
  nom: string | null
  nom_entreprise: string | null
  avatar_url: string | null
  service_type: string | null
  type_prestation?: string | null
}

type DevisRow = {
  id: string
  demande_id: string
  prestataire_id: string
  provider_id?: string
  couple_id: string
  amount: number
  details?: string | null
  description?: string | null
  validity_date?: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating'
  created_at: string
  updated_at: string
  type_prestation?: string | null
}

type FavoriRow = {
  id: string
  couple_id: string
  prestataire_id: string
  provider_id?: string
  created_at: string
  type_prestation?: string | null
}

const STATUS_CONFIG: Record<RequestStatus, { label: string; icon: any; className: string; bgClass: string }> = {
  pending: {
    label: 'En attente',
    icon: Clock,
    className: 'text-amber-600',
    bgClass: 'bg-amber-50 border-amber-200',
  },
  accepted: {
    label: 'Acceptée',
    icon: CheckCircle,
    className: 'text-green-600',
    bgClass: 'bg-green-50 border-green-200',
  },
  rejected: {
    label: 'Refusée',
    icon: XCircle,
    className: 'text-red-600',
    bgClass: 'bg-red-50 border-red-200',
  },
  cancelled: {
    label: 'Annulée',
    icon: Ban,
    className: 'text-gray-500',
    bgClass: 'bg-gray-50 border-gray-200',
  },
}

function getProviderDisplayName(p?: ProviderProfile): string {
  if (!p) return 'Prestataire'
  // Priorité au nom de l'entreprise s'il existe et n'est pas vide
  if (p.nom_entreprise && p.nom_entreprise.trim()) return p.nom_entreprise.trim()
  // Sinon, utiliser le nom complet (prénom + nom)
  const full = [p.prenom, p.nom].filter(Boolean).join(' ').trim()
  return full || 'Prestataire'
}

export default function DemandesPage() {
  const { user } = useUser()
  const [demandes, setDemandes] = useState<RequestRow[]>([])
  const [devis, setDevis] = useState<DevisRow[]>([])
  const [favoris, setFavoris] = useState<FavoriRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper pour obtenir le couple_id depuis user_id
  async function getCoupleId(): Promise<string | null> {
    if (!user?.id) return null
    const supabase = createClient()
    const { data } = await supabase
      .from('couples')
      .select('id')
      .eq('user_id', user.id)
      .single()
    return data?.id || null
  }

  // Fonction optimisée pour charger les demandes
  async function loadDemandes() {
    if (!user?.id) return

    const supabase = createClient()
    
    // Récupérer toutes les demandes en une seule requête
    // Note: requests.couple_id référence couples.user_id directement
    const { data: demandesData, error: demandesError } = await supabase
      .from('requests')
      .select('id, couple_id, provider_id, status, initial_message, created_at, cancelled_at, responded_at')
      .eq('couple_id', user.id)
      .order('created_at', { ascending: false })

    if (demandesError) {
      const errorDetails = extractSupabaseError(demandesError)
      console.error('Erreur chargement demandes:', {
        message: errorDetails.message,
        code: errorDetails.code,
        details: errorDetails.details,
        hint: errorDetails.hint,
        statusCode: errorDetails.statusCode,
        userId: user.id,
        fullError: errorDetails,
      })
      setError(`Erreur: ${errorDetails.message || 'Erreur inconnue'}`)
      return
    }

    if (!demandesData || demandesData.length === 0) {
      setDemandes([])
      return
    }

    // Extraire tous les IDs de prestataires uniques
    const prestataireIds = [...new Set(
      demandesData.map(d => d.provider_id || (d as any).prestataire_id).filter(Boolean)
    )]

    if (prestataireIds.length === 0) {
      setDemandes(demandesData as RequestRow[])
      return
    }

    // Charger tous les profils prestataires en une seule requête
    const { data: prestataireProfiles } = await supabase
      .from('prestataire_profiles')
      .select('user_id, nom_entreprise, type_prestation')
      .in('user_id', prestataireIds)

    // Charger tous les profils utilisateurs en une seule requête
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, avatar_url, prenom, nom')
      .in('id', prestataireIds)

    // Créer des Maps pour accès rapide
    const prestataireMap = new Map(prestataireProfiles?.map(p => [p.user_id, p]) || [])
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Transformer les données avec les informations des prestataires
    const transformedData = demandesData.map(demande => {
      const prestataireId = demande.provider_id || (demande as any).prestataire_id
      const prestataireProfile = prestataireMap.get(prestataireId)
      const profile = profileMap.get(prestataireId)

      return {
        ...demande,
        provider_id: prestataireId,
        service_type: prestataireProfile?.type_prestation || null,
        wedding_date: null,
        prestataire: prestataireProfile ? {
          nom_entreprise: prestataireProfile.nom_entreprise || null,
          service_type: prestataireProfile.type_prestation || '',
          avatar_url: profile?.avatar_url || null,
          prenom: profile?.prenom || null,
          nom: profile?.nom || null,
        } : undefined
      } as RequestRow & { prestataire?: ProviderProfile }
    })

    setDemandes(transformedData as RequestRow[])
  }

  // Fonction optimisée pour charger les devis
  async function loadDevis() {
    if (!user?.id) return

    const supabase = createClient()
    const coupleId = await getCoupleId()
    if (!coupleId) {
      console.warn('loadDevis: coupleId non trouvé pour user.id:', user.id)
      setDevis([])
      return
    }
    
    // Récupérer tous les devis en une seule requête
    // Note: devis.couple_id référence couples.id
    // Utiliser valid_until au lieu de validity_date (nom de colonne dans la DB)
    // Utiliser description au lieu de details (la colonne details peut ne pas exister)
    const { data: devisData, error: devisError } = await supabase
      .from('devis')
      .select('id, demande_id, prestataire_id, couple_id, amount, description, valid_until, status, created_at, updated_at')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })

    if (devisError) {
      // Extraire toutes les propriétés de l'erreur pour un meilleur débogage
      const errorDetails = extractSupabaseError(devisError)
      
      // Log détaillé pour comprendre l'erreur
      console.error('Erreur chargement devis:', {
        message: errorDetails.message,
        code: errorDetails.code,
        details: errorDetails.details,
        hint: errorDetails.hint,
        statusCode: errorDetails.statusCode,
        coupleId,
        userId: user.id,
        fullError: errorDetails,
      })
      
      // Ne pas bloquer si la table devis n'existe pas encore ou si erreur 400 (colonne inexistante)
      if (errorDetails.code !== '42P01' && errorDetails.code !== '42703') {
        setError(`Erreur devis: ${errorDetails.message || 'Erreur inconnue'}`)
      }
      setDevis([])
      return
    }

    if (!devisData || devisData.length === 0) {
      setDevis([])
      return
    }

    // Extraire tous les IDs de prestataires uniques
    const prestataireIds = [...new Set(
      devisData.map(d => d.prestataire_id).filter(Boolean)
    )]

    if (prestataireIds.length === 0) {
      setDevis(devisData as DevisRow[])
      return
    }

    // Charger tous les profils prestataires en une seule requête
    const { data: prestataireProfiles } = await supabase
      .from('prestataire_profiles')
      .select('user_id, nom_entreprise, type_prestation')
      .in('user_id', prestataireIds)

    // Charger tous les profils utilisateurs en une seule requête
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, avatar_url, prenom, nom')
      .in('id', prestataireIds)

    // Créer des Maps pour accès rapide
    const prestataireMap = new Map(prestataireProfiles?.map(p => [p.user_id, p]) || [])
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Transformer les données avec les informations des prestataires
    const transformedData = devisData.map(devis => {
      const prestataireId = devis.prestataire_id
      const prestataireProfile = prestataireMap.get(prestataireId)
      const profile = profileMap.get(prestataireId)

      return {
        ...devis,
        prestataire_id: prestataireId,
        provider_id: prestataireId, // Pour compatibilité avec le type DevisRow
        validity_date: devis.valid_until || null, // Mapper valid_until vers validity_date pour le type
        details: devis.description || null, // Mapper description vers details pour le type (compatibilité)
        service_type: prestataireProfile?.type_prestation || null,
        prestataire: prestataireProfile ? {
          nom_entreprise: prestataireProfile.nom_entreprise || null,
          service_type: prestataireProfile.type_prestation || '',
          avatar_url: profile?.avatar_url || null,
          prenom: profile?.prenom || null,
          nom: profile?.nom || null,
        } : undefined
      } as DevisRow & { prestataire?: ProviderProfile }
    })

    setDevis(transformedData as DevisRow[])
  }

  // Fonction optimisée pour charger les favoris
  async function loadFavoris() {
    if (!user?.id) return

    const supabase = createClient()
    const coupleId = await getCoupleId()
    if (!coupleId) return
    
    // Récupérer tous les favoris en une seule requête
    // Note: favoris.couple_id référence couples.id
    const { data: favorisData, error: favorisError } = await supabase
      .from('favoris')
      .select('id, couple_id, prestataire_id, created_at')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })

    if (favorisError) {
      const errorDetails = extractSupabaseError(favorisError)
      console.error('Erreur chargement favoris:', {
        message: errorDetails.message,
        code: errorDetails.code,
        details: errorDetails.details,
        hint: errorDetails.hint,
        statusCode: errorDetails.statusCode,
        coupleId,
        userId: user.id,
        fullError: errorDetails,
      })
      // Ne pas bloquer si la table favoris n'existe pas encore ou si erreur 400 (colonne inexistante)
      if (errorDetails.code !== '42P01' && errorDetails.code !== '42703') {
        setError(`Erreur favoris: ${errorDetails.message || 'Erreur inconnue'}`)
      }
      setFavoris([])
      return
    }

    if (!favorisData || favorisData.length === 0) {
      setFavoris([])
      return
    }

    // Extraire tous les IDs de prestataires uniques
    const prestataireIds = [...new Set(
      favorisData.map(f => f.prestataire_id).filter(Boolean)
    )]

    if (prestataireIds.length === 0) {
      setFavoris(favorisData as FavoriRow[])
      return
    }

    // Charger tous les profils prestataires en une seule requête
    const { data: prestataireProfiles } = await supabase
      .from('prestataire_profiles')
      .select('user_id, nom_entreprise, type_prestation')
      .in('user_id', prestataireIds)

    // Charger tous les profils utilisateurs en une seule requête
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, avatar_url, prenom, nom')
      .in('id', prestataireIds)

    // Créer des Maps pour accès rapide
    const prestataireMap = new Map(prestataireProfiles?.map(p => [p.user_id, p]) || [])
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Transformer les données avec les informations des prestataires
    const transformedData = favorisData.map(favori => {
      const prestataireId = favori.prestataire_id
      const prestataireProfile = prestataireMap.get(prestataireId)
      const profile = profileMap.get(prestataireId)

      return {
        ...favori,
        provider_id: prestataireId,
        service_type: prestataireProfile?.type_prestation || null,
        prestataire: prestataireProfile ? {
          nom_entreprise: prestataireProfile.nom_entreprise || null,
          service_type: prestataireProfile.type_prestation || '',
          avatar_url: profile?.avatar_url || null,
          prenom: profile?.prenom || null,
          nom: profile?.nom || null,
        } : undefined
      } as FavoriRow & { prestataire?: ProviderProfile }
    })

    setFavoris(transformedData as FavoriRow[])
  }

  // Charger toutes les données au montage
  useEffect(() => {
    if (user?.id) {
      setLoading(true)
      Promise.all([
        loadDemandes(),
        loadDevis(),
        loadFavoris()
      ]).finally(() => {
        setLoading(false)
      })
    }
  }, [user?.id])

  async function cancelRequest(requestId: string) {
    if (!user?.id) return

    const supabase = createClient()

    // RLS + trigger garantissent la sécurité (pending only)
    const { error } = await supabase
      .from('requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)
      .eq('couple_id', user.id)
      .eq('status', 'pending')

    if (error) {
      console.error('Erreur annulation demande:', error)
      toast.error('Erreur lors de l\'annulation')
      return
    }

    toast.success('Demande annulée')
    await loadDemandes()
  }

  async function resendRequest(request: RequestRow) {
    if (!user?.id) return

    const supabase = createClient()

    // Créer une nouvelle demande avec les mêmes informations
    const { error } = await supabase
      .from('requests')
      .insert({
        couple_id: user.id,
        provider_id: request.provider_id,
        initial_message: request.initial_message,
        status: 'pending',
      })

    if (error) {
      console.error('Erreur renvoi demande:', error)
      toast.error('Erreur lors du renvoi de la demande')
      return
    }

    toast.success('Demande renvoyée avec succès')
    await loadDemandes()
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card className="border-gray-200">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-gray-500">Chargement...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error && demandes.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Demandes</CardTitle>
          <CardDescription>Impossible de charger vos demandes pour le moment.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Détail technique : <code className="text-xs">{error}</code>
          </p>
        </CardContent>
      </Card>
    )
  }

  // Créer un Map pour associer rapidement les profils aux demandes
  const providerById = new Map<string, ProviderProfile>()
  
  // Remplir le Map avec les données des demandes
  demandes.forEach(d => {
    if (d.provider_id && (d as any).prestataire) {
      providerById.set(d.provider_id, (d as any).prestataire)
    }
  })

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <PageTitle
          title="Demandes & Devis"
          description="Suivez vos demandes envoyées aux prestataires"
        />

        {!demandes || demandes.length === 0 ? (
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="pt-12 pb-12 text-center px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <Send className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune demande envoyée</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Recherchez des prestataires et envoyez-leur une demande pour commencer.
              </p>
              <Button
                className="mt-6 bg-[#823F91] hover:bg-[#6D3478]"
                onClick={() => window.location.href = '/couple/recherche'}
              >
                Rechercher des prestataires
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {demandes.map((r, index) => {
              const provider = providerById.get(r.provider_id) || (r as any).prestataire
              const name = getProviderDisplayName(provider)
              const serviceType = provider?.service_type || provider?.type_prestation || ''
              const status = STATUS_CONFIG[r.status]
              const StatusIcon = status.icon

              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`border shadow-sm hover:shadow-md transition-shadow ${status.bgClass}`}>
                    <CardContent className="p-4 sm:p-5">
                      {/* Header avec prestataire et statut */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-white shadow-sm flex-shrink-0">
                            <AvatarImage src={provider?.avatar_url || ''} alt={name} />
                            <AvatarFallback className="bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white text-sm sm:text-base font-semibold">
                              {name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                              {name}
                            </h3>
                            {serviceType && (
                              <p className="text-xs sm:text-sm text-gray-500 truncate">{serviceType}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(r.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Statut et actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 border ${status.className}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">{status.label}</span>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4 text-gray-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {r.status === 'pending' && (
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onClick={() => cancelRequest(r.id)}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Annuler la demande
                                </DropdownMenuItem>
                              )}
                              {(r.status === 'cancelled' || r.status === 'rejected') && (
                                <DropdownMenuItem
                                  className="text-[#823F91] focus:text-[#823F91] focus:bg-purple-50"
                                  onClick={() => resendRequest(r)}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Renvoyer la demande
                                </DropdownMenuItem>
                              )}
                              {r.status === 'accepted' && (
                                <DropdownMenuItem
                                  className="text-[#823F91] focus:text-[#823F91] focus:bg-purple-50"
                                  onClick={() => window.location.href = '/couple/messagerie'}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Envoyer un message
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Message */}
                      <div className="bg-white/60 rounded-lg p-3 border border-white/80">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words line-clamp-3">
                          {r.initial_message}
                        </p>
                      </div>

                      {/* Actions rapides pour pending */}
                      {r.status === 'pending' && (
                        <div className="mt-4 flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs"
                            onClick={() => cancelRequest(r.id)}
                          >
                            <X className="h-3.5 w-3.5 mr-1.5" />
                            Annuler
                          </Button>
                        </div>
                      )}

                      {/* Actions rapides pour cancelled/rejected */}
                      {(r.status === 'cancelled' || r.status === 'rejected') && (
                        <div className="mt-4 flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-[#823F91] hover:bg-[#6D3478] h-8 text-xs"
                            onClick={() => resendRequest(r)}
                          >
                            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                            Renvoyer
                          </Button>
                        </div>
                      )}

                      {/* Actions rapides pour accepted */}
                      {r.status === 'accepted' && (
                        <div className="mt-4 flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-[#823F91] hover:bg-[#6D3478] h-8 text-xs"
                            onClick={() => window.location.href = '/couple/messagerie'}
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                            Discuter
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
