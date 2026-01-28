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
          : 'nouvelle',
        message: request.initial_message,
        created_at: request.created_at,
      }

      if (demandeFormatted.statut === 'nouvelle') {
        nouvelles.push(demandeFormatted)
      } else if (demandeFormatted.statut === 'en_cours') {
        en_cours.push(demandeFormatted)
      } else {
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
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 px-3 sm:px-4 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full"
      >
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent mb-1 sm:mb-2 break-words">
          Demandes reçues
        </h1>
        <p className="text-[#823F91]/70 text-xs sm:text-sm md:text-base lg:text-lg break-words">
          Gérez toutes vos demandes de prestations
        </p>
      </motion.div>

      {/* Bouton pour créer les conversations manquantes */}
      {demandes.en_cours.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end px-3 sm:px-0"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleFixConversations}
            disabled={isFixingConversations}
            className="gap-2 text-xs sm:text-sm h-8 sm:h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isFixingConversations ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">{isFixingConversations ? 'Vérification...' : 'Vérifier les conversations'}</span>
            <span className="xs:hidden">{isFixingConversations ? 'Vérif...' : 'Vérifier'}</span>
          </Button>
        </motion.div>
      )}

      <div className="relative w-full px-3 sm:px-0">
        <Search className="absolute left-3 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-[#823F91]/50 pointer-events-none" />
        <Input
          placeholder="Rechercher une demande..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 h-9 sm:h-10 md:h-11 border-[#823F91]/20 focus:border-[#823F91] focus:ring-[#823F91]/20 text-xs sm:text-sm md:text-base"
        />
      </div>

      <Tabs defaultValue="nouvelles" className="w-full">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <TabsList className="mb-6 sm:mb-8 w-full sm:w-auto bg-gradient-to-r from-[#823F91]/10 via-[#9D5FA8]/10 to-[#823F91]/10 border border-[#823F91]/20 inline-flex min-w-full sm:min-w-0">
            <TabsTrigger 
              value="nouvelles" 
              className="bg-transparent text-[#823F91] flex-1 sm:flex-initial gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#823F91] data-[state=active]:to-[#9D5FA8] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#823F91]/30 whitespace-nowrap"
            >
              <span className="text-[#823F91] data-[state=active]:text-white transition-colors">Nouvelles</span>
              {demandes.nouvelles.length > 0 && (
                <Badge className="bg-[#823F91] text-white data-[state=active]:bg-white data-[state=active]:text-[#823F91] shadow-md text-xs px-1.5 py-0 min-w-[1.25rem] h-5 flex items-center justify-center transition-colors">
                  {demandes.nouvelles.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="en-cours" 
              className="bg-transparent text-[#823F91] flex-1 sm:flex-initial gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#823F91] data-[state=active]:to-[#9D5FA8] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#823F91]/30 whitespace-nowrap"
            >
              <span className="text-[#823F91] data-[state=active]:text-white transition-colors">En cours</span>
              {demandes.en_cours.length > 0 && (
                <Badge className="bg-[#823F91] text-white data-[state=active]:bg-white data-[state=active]:text-[#823F91] shadow-md text-xs px-1.5 py-0 min-w-[1.25rem] h-5 flex items-center justify-center transition-colors">
                  {demandes.en_cours.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="terminees" 
              className="bg-transparent text-[#823F91] flex-1 sm:flex-initial gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#823F91] data-[state=active]:to-[#9D5FA8] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#823F91]/30 whitespace-nowrap"
            >
              <span className="text-[#823F91] data-[state=active]:text-white transition-colors">Terminées</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="nouvelles" className="mt-0">
          {demandes.nouvelles.length === 0 ? (
            <EmptyState
              title="Aucune nouvelle demande"
              description="Les nouvelles demandes de couples apparaîtront ici"
            />
          ) : (
            <div className="space-y-3 sm:space-y-4 w-full">
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

        <TabsContent value="en-cours" className="mt-0">
          {demandes.en_cours.length === 0 ? (
            <EmptyState
              title="Aucune demande en cours"
              description="Les demandes acceptées apparaîtront ici"
            />
          ) : (
            <div className="space-y-3 sm:space-y-4 w-full">
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

        <TabsContent value="terminees" className="mt-0">
          {demandes.terminees.length === 0 ? (
            <EmptyState
              title="Aucune demande terminée"
              description="L'historique de vos prestations apparaîtra ici"
            />
          ) : (
            <div className="space-y-3 sm:space-y-4 w-full">
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
