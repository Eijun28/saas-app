'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, RefreshCw } from 'lucide-react'
import { LoadingSpinner } from '@/components/prestataire/shared/LoadingSpinner'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import { DemandeCard } from '@/components/prestataire/demandes/DemandeCard'
import { PageTitle } from '@/components/prestataire/shared/PageTitle'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Demande, UIState } from '@/lib/types/prestataire'
import { createMissingConversations } from '@/lib/supabase/fix-conversations'
import { extractSupabaseError } from '@/lib/utils'
import { getCouplesByUserIds } from '@/lib/supabase/queries/couples.queries'

export default function DemandesRecuesPage() {
  const [demandes, setDemandes] = useState<{
    nouvelles: Demande[]
    en_cours: Demande[]
    terminees: Demande[]
  }>({
    nouvelles: [],
    en_cours: [],
    terminees: [],
  })
  const [conversationIdsMap, setConversationIdsMap] = useState<Map<string, string>>(new Map())

  const [searchTerm, setSearchTerm] = useState('')
  const [uiState, setUiState] = useState<UIState>({
    loading: 'idle',
    error: null,
  })
  const [isFixingConversations, setIsFixingConversations] = useState(false)

  const { user } = useUser()

  interface RequestWithCouple {
    id: string
    couple_id: string
    provider_id: string
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
    initial_message: string
    created_at: string
    couple?: {
      partner_1_name?: string
      partner_2_name?: string
      wedding_date?: string
    } | null
  }

  const formatAndGroupDemandes = (data: RequestWithCouple[]): { nouvelles: Demande[], en_cours: Demande[], terminees: Demande[] } => {
    const nouvelles: Demande[] = []
    const en_cours: Demande[] = []
    const terminees: Demande[] = []

    data.forEach((request) => {
      let coupleNom = 'Couple'
      
      if (request.couple) {
        const name1 = request.couple.partner_1_name?.trim() || ''
        const name2 = request.couple.partner_2_name?.trim() || ''
        if (name1 && name2) {
          coupleNom = `${name1} & ${name2}`
        } else if (name1) {
          coupleNom = name1
        } else if (name2) {
          coupleNom = name2
        }
      }

      const demandeFormatted: Demande = {
        id: request.id,
        couple_id: request.couple_id,
        couple_nom: coupleNom || 'Couple',
        date_evenement: request.couple?.wedding_date || '',
        budget_min: 0,
        budget_max: 0,
        lieu: '',
        statut: request.status === 'pending' ? 'nouvelle'
          : request.status === 'accepted' ? 'en_cours'
          : request.status === 'rejected' ? 'terminee'
          : request.status === 'cancelled' ? 'annulee'
          : 'nouvelle',
        message: request.initial_message,
        created_at: request.created_at,
      }

      if (demandeFormatted.statut === 'nouvelle') {
        nouvelles.push(demandeFormatted)
      } else if (demandeFormatted.statut === 'en_cours') {
        en_cours.push(demandeFormatted)
      } else {
        // Les demandes annulées et terminées vont dans terminées
        terminees.push(demandeFormatted)
      }
    })

    return { nouvelles, en_cours, terminees }
  }

  const fetchDemandes = async () => {
    if (!user?.id) return

    setUiState({ loading: 'loading', error: null })
    
    const supabase = createClient()
    
    // Récupérer les requests depuis la nouvelle table
    const { data: requestsData, error } = await supabase
      .from('requests')
      .select('id, couple_id, provider_id, status, initial_message, created_at')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      const errorDetails = extractSupabaseError(error)
      const errorMsg = errorDetails.message || errorDetails.code || 'Erreur inconnue'
      
      // Log détaillé pour le débogage
      console.error('Erreur chargement demandes:', {
        message: errorDetails.message,
        code: errorDetails.code,
        details: errorDetails.details,
        hint: errorDetails.hint,
        statusCode: errorDetails.statusCode,
        fullError: errorDetails,
      })
      
      toast.error(`Erreur: ${errorMsg}`)
      setUiState({ loading: 'error', error: errorMsg })
      return
    }

    if (!requestsData || requestsData.length === 0) {
      setDemandes({ nouvelles: [], en_cours: [], terminees: [] })
      setUiState({ loading: 'success', error: null })
      return
    }

    // Récupérer les couples via couples.user_id = requests.couple_id
    interface RequestRow {
      id: string;
      couple_id: string;
      provider_id: string;
      status: string;
      initial_message?: string | null;
      created_at?: string | null;
      responded_at?: string | null;
      cancelled_at?: string | null;
      [key: string]: unknown;
    }
    
    const coupleUserIds = [...new Set(requestsData.map((r: RequestRow) => r.couple_id).filter(Boolean))]
    const couplesMap = await getCouplesByUserIds(coupleUserIds, [
      'user_id',
      'partner_1_name',
      'partner_2_name',
      'wedding_date'
    ])

    // Fusionner les données
    const data: RequestWithCouple[] = requestsData.map((request: RequestRow) => {
      const coupleData = couplesMap.get(request.couple_id);
      return {
        id: request.id,
        couple_id: request.couple_id,
        provider_id: request.provider_id,
        status: (request.status || 'pending') as 'pending' | 'accepted' | 'rejected' | 'cancelled',
        initial_message: request.initial_message || '',
        created_at: request.created_at || new Date().toISOString(),
        couple: coupleData ? {
          partner_1_name: coupleData.partner_1_name || undefined,
          partner_2_name: coupleData.partner_2_name || undefined,
          wedding_date: coupleData.wedding_date || undefined,
        } : {
          partner_1_name: 'Couple',
          partner_2_name: '',
          wedding_date: undefined,
        }
      };
    })

    // Récupérer les IDs de conversation pour les demandes acceptées/en cours
    const acceptedRequestIds = requestsData
      .filter((r: RequestRow) => r.status === 'accepted')
      .map((r: RequestRow) => r.id)
    
    const conversationIds = new Map<string, string>()
    if (acceptedRequestIds.length > 0) {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, request_id')
        .in('request_id', acceptedRequestIds)
      
      if (conversations) {
        interface ConversationRow {
          id: string;
          request_id: string;
        }
        conversations.forEach((conv: ConversationRow) => {
          conversationIds.set(conv.request_id, conv.id)
        })
      }
    }

    setConversationIdsMap(conversationIds)
    setDemandes(formatAndGroupDemandes(data))
    setUiState({ loading: 'success', error: null })
  }

  useEffect(() => {
    if (user?.id) {
      fetchDemandes()
    }
  }, [user?.id])

  const handleAcceptDemande = async (requestId: string) => {
    if (!user?.id) return

    const supabase = createClient()
    
    // Récupérer d'abord la demande pour obtenir couple_id
    const { data: requestData, error: fetchError } = await supabase
      .from('requests')
      .select('id, couple_id, provider_id, status')
      .eq('id', requestId)
      .eq('provider_id', user.id)
      .single()

    if (fetchError || !requestData) {
      if (fetchError) {
        const errorDetails = extractSupabaseError(fetchError)
        console.error('Erreur récupération demande:', {
          message: errorDetails.message,
          code: errorDetails.code,
          details: errorDetails.details,
          hint: errorDetails.hint,
          statusCode: errorDetails.statusCode,
          fullError: errorDetails,
        })
        toast.error(`Erreur: ${errorDetails.message || 'Demande introuvable'}`)
      } else {
        toast.error('Demande introuvable')
      }
      return
    }

    // Mettre à jour le statut de la demande
    const { error: updateError } = await supabase
      .from('requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .eq('provider_id', user.id)

    if (updateError) {
      const errorDetails = extractSupabaseError(updateError)
      console.error('Erreur mise à jour demande:', {
        message: errorDetails.message,
        code: errorDetails.code,
        details: errorDetails.details,
        hint: errorDetails.hint,
        statusCode: errorDetails.statusCode,
        fullError: errorDetails,
      })
      toast.error(`Erreur: ${errorDetails.message || 'Erreur lors de la mise à jour'}`)
      return
    }

    // Envoyer l'email de notification au couple (sans bloquer le flow)
    try {
      const { sendRequestAcceptedEmail } = await import('@/lib/email/notifications')
      await sendRequestAcceptedEmail(
        requestData.couple_id,
        requestData.provider_id,
        requestId
      )
    } catch (emailError) {
      // Ne pas bloquer si l'email échoue
      console.error('Erreur envoi email notification:', emailError)
    }

    // Le trigger devrait créer automatiquement la conversation lors du changement de statut
    // Attendre un court délai pour laisser le trigger s'exécuter
    await new Promise(resolve => setTimeout(resolve, 100))

    // Vérifier si une conversation existe déjà, sinon la créer manuellement
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('request_id', requestId)
      .maybeSingle()

    if (!existingConv) {
      // Créer la conversation manuellement si le trigger ne l'a pas fait
      const { error: convError } = await supabase
        .from('conversations')
        .insert({
          request_id: requestId,
          couple_id: requestData.couple_id,
          provider_id: requestData.provider_id,
        })

      if (convError) {
        const errorDetails = extractSupabaseError(convError)
        console.error('Erreur création conversation:', {
          message: errorDetails.message,
          code: errorDetails.code,
          details: errorDetails.details,
          hint: errorDetails.hint,
          statusCode: errorDetails.statusCode,
          fullError: errorDetails,
        })
        // Ne pas bloquer l'acceptation si la conversation existe déjà (code 23505 = violation contrainte unique)
        // ou si c'est une erreur de permission RLS (code 42501)
        if (errorDetails.code !== '23505' && errorDetails.code !== '42501') {
          toast.error('Demande acceptée mais erreur lors de la création de la conversation')
        }
      }
    }

    // Créer automatiquement un événement dans l'agenda si le couple a une date de mariage
    try {
      const allDemandes = [...demandes.nouvelles, ...demandes.en_cours, ...demandes.terminees]
      const demande = allDemandes.find(d => d.id === requestId)
      if (demande?.date_evenement) {
        await supabase
          .from('evenements_prestataire')
          .insert({
            prestataire_id: user.id,
            titre: `Mariage - ${demande.couple_nom}`,
            date: demande.date_evenement,
            heure_debut: '09:00',
            notes: demande.message ? `Demande initiale : ${demande.message.substring(0, 200)}` : null,
          })
      }
    } catch (agendaError) {
      console.error('Erreur création événement agenda:', agendaError)
    }

    toast.success('Demande acceptée - La conversation est maintenant disponible dans la messagerie')
    fetchDemandes()
  }

  const handleRejectDemande = async (requestId: string) => {
    if (!user?.id) return

    const supabase = createClient()
    
    // Récupérer d'abord la demande pour obtenir couple_id
    const { data: requestData, error: fetchError } = await supabase
      .from('requests')
      .select('id, couple_id, provider_id, status')
      .eq('id', requestId)
      .eq('provider_id', user.id)
      .single()

    if (fetchError || !requestData) {
      const errorDetails = extractSupabaseError(fetchError)
      console.error('Erreur récupération demande:', {
        message: errorDetails.message,
        code: errorDetails.code,
        details: errorDetails.details,
        hint: errorDetails.hint,
        statusCode: errorDetails.statusCode,
        fullError: errorDetails,
      })
      toast.error(`Erreur: ${errorDetails.message || 'Demande introuvable'}`)
      return
    }

    const { error } = await supabase
      .from('requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
      .eq('provider_id', user.id) // Sécurité supplémentaire

    if (error) {
      const errorDetails = extractSupabaseError(error)
      console.error('Erreur rejet demande:', {
        message: errorDetails.message,
        code: errorDetails.code,
        details: errorDetails.details,
        hint: errorDetails.hint,
        statusCode: errorDetails.statusCode,
        fullError: errorDetails,
      })
      toast.error(`Erreur: ${errorDetails.message || 'Erreur lors du rejet'}`)
      return
    }

    // Envoyer l'email de notification au couple (sans bloquer le flow)
    try {
      const { sendRequestRejectedEmail } = await import('@/lib/email/notifications')
      await sendRequestRejectedEmail(
        requestData.couple_id,
        requestData.provider_id,
        requestId
      )
    } catch (emailError) {
      // Ne pas bloquer si l'email échoue
      console.error('Erreur envoi email notification:', emailError)
    }

    toast.success('Demande refusée')
    fetchDemandes()
  }

  const handleFixConversations = async () => {
    setIsFixingConversations(true)
    try {
      const result = await createMissingConversations()
      if (result.success) {
        toast.success(result.message || 'Conversations vérifiées')
        // Rafraîchir les demandes
        fetchDemandes()
      } else {
        toast.error(`Erreur: ${result.error?.message || 'Erreur inconnue'}`)
      }
    } catch (error: unknown) {
      const errorDetails = extractSupabaseError(error)
      console.error('Erreur vérification conversations:', {
        message: errorDetails.message,
        code: errorDetails.code,
        details: errorDetails.details,
        hint: errorDetails.hint,
        statusCode: errorDetails.statusCode,
        fullError: errorDetails,
      })
      toast.error(`Erreur: ${errorDetails.message || 'Erreur inconnue'}`)
    } finally {
      setIsFixingConversations(false)
    }
  }

  if (uiState.loading === 'loading') {
    return <LoadingSpinner size="lg" text="Chargement des demandes..." />
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-5">
      <PageTitle
        title="Demandes reçues"
        description="Gérez toutes vos demandes de prestations"
      />

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          placeholder="Rechercher une demande..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 h-10 bg-white border-gray-200 focus:border-[#823F91] focus:ring-[#823F91]/20 text-sm rounded-xl"
        />
      </div>

      <Tabs defaultValue="nouvelles" className="w-full">
        <TabsList className="w-full h-auto p-1 bg-gray-100/80 rounded-xl grid grid-cols-3 gap-1">
          <TabsTrigger
            value="nouvelles"
            className="rounded-lg py-2.5 text-sm font-medium text-gray-600 data-[state=active]:bg-white data-[state=active]:text-[#823F91] data-[state=active]:shadow-sm transition-all"
          >
            Nouvelles
            {demandes.nouvelles.length > 0 && (
              <Badge className="ml-1.5 bg-[#823F91] text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px]">
                {demandes.nouvelles.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="en-cours"
            className="rounded-lg py-2.5 text-sm font-medium text-gray-600 data-[state=active]:bg-white data-[state=active]:text-[#823F91] data-[state=active]:shadow-sm transition-all"
          >
            En cours
            {demandes.en_cours.length > 0 && (
              <Badge className="ml-1.5 bg-[#823F91] text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px]">
                {demandes.en_cours.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="terminees"
            className="rounded-lg py-2.5 text-sm font-medium text-gray-600 data-[state=active]:bg-white data-[state=active]:text-[#823F91] data-[state=active]:shadow-sm transition-all"
          >
            Terminées
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nouvelles" className="mt-4">
          {demandes.nouvelles.length === 0 ? (
            <EmptyState
              title="Aucune nouvelle demande"
              description="Les nouvelles demandes de couples apparaîtront ici"
            />
          ) : (
            <div className="space-y-3">
              {demandes.nouvelles
                .filter((d) =>
                  !searchTerm ||
                  d.couple_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  d.lieu.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((demande) => (
                  <DemandeCard
                    key={demande.id}
                    demande={demande}
                    onAccept={handleAcceptDemande}
                    onReject={handleRejectDemande}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="en-cours" className="mt-4">
          {demandes.en_cours.length === 0 ? (
            <EmptyState
              title="Aucune demande en cours"
              description="Les demandes acceptées apparaîtront ici"
            />
          ) : (
            <div className="space-y-3">
              {demandes.en_cours
                .filter((d) =>
                  !searchTerm ||
                  d.couple_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  d.lieu.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((demande) => (
                  <DemandeCard
                    key={demande.id}
                    demande={demande}
                    conversationId={conversationIdsMap.get(demande.id) || null}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="terminees" className="mt-4">
          {demandes.terminees.length === 0 ? (
            <EmptyState
              title="Aucune demande terminée"
              description="L'historique de vos prestations apparaîtra ici"
            />
          ) : (
            <div className="space-y-3">
              {demandes.terminees
                .filter((d) =>
                  !searchTerm ||
                  d.couple_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  d.lieu.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((demande) => (
                  <DemandeCard
                    key={demande.id}
                    demande={demande}
                    conversationId={conversationIdsMap.get(demande.id) || null}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
