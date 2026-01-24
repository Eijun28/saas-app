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
        couple_nom: coupleNom,
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
    const coupleUserIds = [...new Set(requestsData.map((r: any) => r.couple_id).filter(Boolean))]
    const couplesMap = await getCouplesByUserIds(coupleUserIds, [
      'user_id',
      'partner_1_name',
      'partner_2_name',
      'wedding_date'
    ])

    // Fusionner les données
    const data = requestsData.map((request: any) => ({
      ...request,
      couple: couplesMap.get(request.couple_id) || {
        user_id: request.couple_id,
        partner_1_name: 'Couple',
        partner_2_name: '',
        wedding_date: null,
      }
    }))

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
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full"
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent mb-2 break-words">
          Demandes reçues
        </h1>
        <p className="text-[#823F91]/70 text-sm sm:text-base lg:text-lg break-words">
          Gérez toutes vos demandes de prestations
        </p>
      </motion.div>

      {/* Bouton pour créer les conversations manquantes */}
      {demandes.en_cours.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleFixConversations}
            disabled={isFixingConversations}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFixingConversations ? 'animate-spin' : ''}`} />
            {isFixingConversations ? 'Vérification...' : 'Vérifier les conversations'}
          </Button>
        </motion.div>
      )}

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-[#823F91]/50 pointer-events-none" />
        <Input
          placeholder="Rechercher une demande..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 sm:pl-10 pr-4 h-10 sm:h-11 border-[#823F91]/20 focus:border-[#823F91] focus:ring-[#823F91]/20 text-sm sm:text-base"
        />
      </div>

      <Tabs defaultValue="nouvelles" className="w-full">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <TabsList className="mb-6 sm:mb-8 w-full sm:w-auto bg-gradient-to-r from-[#823F91]/10 via-[#9D5FA8]/10 to-[#823F91]/10 border border-[#823F91]/20 inline-flex min-w-full sm:min-w-0">
            <TabsTrigger 
              value="nouvelles" 
              className="flex-1 sm:flex-initial gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-[#823F91] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#823F91] data-[state=active]:to-[#9D5FA8] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#823F91]/30 whitespace-nowrap"
            >
              <span>Nouvelles</span>
              {demandes.nouvelles.length > 0 && (
                <Badge className="bg-[#823F91] text-white shadow-md text-xs px-1.5 py-0 min-w-[1.25rem] h-5 flex items-center justify-center">
                  {demandes.nouvelles.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="en-cours" 
              className="flex-1 sm:flex-initial gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-[#823F91] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#823F91] data-[state=active]:to-[#9D5FA8] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#823F91]/30 whitespace-nowrap"
            >
              <span>En cours</span>
              {demandes.en_cours.length > 0 && (
                <Badge className="bg-[#823F91] text-white shadow-md text-xs px-1.5 py-0 min-w-[1.25rem] h-5 flex items-center justify-center">
                  {demandes.en_cours.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="terminees" 
              className="flex-1 sm:flex-initial gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-[#823F91] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#823F91] data-[state=active]:to-[#9D5FA8] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#823F91]/30 whitespace-nowrap"
            >
              Terminées
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
                  <DemandeCard key={demande.id} demande={demande} />
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
                  <DemandeCard key={demande.id} demande={demande} />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
