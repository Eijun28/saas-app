'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Send, UserRound } from 'lucide-react'
import { useUser } from '@/hooks/use-user'

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
  details: string
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

const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: 'En attente',
  accepted: 'Acceptée',
  rejected: 'Refusée',
  cancelled: 'Annulée',
}

const STATUS_BADGE_CLASS: Record<RequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
}

function getProviderDisplayName(p?: ProviderProfile): string {
  if (!p) return 'Prestataire'
  if (p.nom_entreprise) return p.nom_entreprise
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

  // Fonction optimisée pour charger les demandes
  async function loadDemandes() {
    if (!user?.id) return

    const supabase = createClient()
    
    // Récupérer toutes les demandes en une seule requête
    const { data: demandesData, error: demandesError } = await supabase
      .from('requests')
      .select('id, couple_id, provider_id, status, initial_message, created_at, cancelled_at, responded_at, type_prestation, wedding_date, date_mariage')
      .eq('couple_id', user.id)
      .order('created_at', { ascending: false })

    if (demandesError) {
      console.error('Erreur chargement demandes:', demandesError)
      setError(`Erreur: ${demandesError.message}`)
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
        service_type: prestataireProfile?.type_prestation || demande.type_prestation || null,
        wedding_date: demande.wedding_date || demande.date_mariage || null,
        prestataire: prestataireProfile ? {
          nom_entreprise: prestataireProfile.nom_entreprise || '',
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
    
    // Récupérer tous les devis en une seule requête
    const { data: devisData, error: devisError } = await supabase
      .from('devis')
      .select('id, demande_id, prestataire_id, couple_id, amount, details, validity_date, status, created_at, updated_at, type_prestation')
      .eq('couple_id', user.id)
      .order('created_at', { ascending: false })

    if (devisError) {
      console.error('Erreur chargement devis:', devisError)
      // Ne pas bloquer si la table devis n'existe pas encore
      if (devisError.code !== '42P01') {
        setError(`Erreur devis: ${devisError.message}`)
      }
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
        service_type: prestataireProfile?.type_prestation || devis.type_prestation || null,
        prestataire: prestataireProfile ? {
          nom_entreprise: prestataireProfile.nom_entreprise || '',
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
    
    // Récupérer tous les favoris en une seule requête
    const { data: favorisData, error: favorisError } = await supabase
      .from('favoris')
      .select('id, couple_id, prestataire_id, provider_id, created_at, type_prestation')
      .eq('couple_id', user.id)
      .order('created_at', { ascending: false })

    if (favorisError) {
      console.error('Erreur chargement favoris:', favorisError)
      // Ne pas bloquer si la table favoris n'existe pas encore
      if (favorisError.code !== '42P01') {
        setError(`Erreur favoris: ${favorisError.message}`)
      }
      return
    }

    if (!favorisData || favorisData.length === 0) {
      setFavoris([])
      return
    }

    // Extraire tous les IDs de prestataires uniques
    const prestataireIds = [...new Set(
      favorisData.map(f => f.provider_id || f.prestataire_id).filter(Boolean)
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
      const prestataireId = favori.provider_id || favori.prestataire_id
      const prestataireProfile = prestataireMap.get(prestataireId)
      const profile = profileMap.get(prestataireId)

      return {
        ...favori,
        provider_id: prestataireId,
        service_type: prestataireProfile?.type_prestation || favori.type_prestation || null,
        prestataire: prestataireProfile ? {
          nom_entreprise: prestataireProfile.nom_entreprise || '',
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
      setError(`Erreur: ${error.message}`)
      return
    }

    // Recharger les demandes
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
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <p className="text-[#6B7280]">
            Vos demandes sont envoyées à des prestataires. Le chat s'active uniquement quand une demande est acceptée.
          </p>
        </div>

        {!demandes || demandes.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="pt-12 pb-12 text-center">
              <Send className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune demande envoyée</h3>
              <p className="text-gray-500">Quand vous contactez un prestataire, la demande apparaîtra ici.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {demandes.map((r) => {
              const provider = providerById.get(r.provider_id) || (r as any).prestataire
              const name = getProviderDisplayName(provider)

              return (
                <Card key={r.id} className="border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {provider?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={provider.avatar_url}
                            alt={name}
                            className="h-11 w-11 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-gray-100 border flex items-center justify-center">
                            <UserRound className="h-5 w-5 text-gray-500" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{name}</CardTitle>
                          <CardDescription className="text-sm">
                            Envoyée le {new Date(r.created_at).toLocaleDateString('fr-FR')}
                          </CardDescription>
                        </div>
                      </div>

                      <Badge variant="outline" className={STATUS_BADGE_CLASS[r.status]}>
                        {STATUS_LABEL[r.status]}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.initial_message}</p>

                    {r.status === 'pending' ? (
                      <form onSubmit={(e) => {
                        e.preventDefault()
                        cancelRequest(r.id)
                      }} className="flex justify-end">
                        <Button type="submit" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                          Annuler la demande
                        </Button>
                      </form>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
