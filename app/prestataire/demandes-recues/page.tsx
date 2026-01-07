'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { LoadingSpinner } from '@/components/prestataire/shared/LoadingSpinner'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import { DemandeCard } from '@/components/prestataire/demandes/DemandeCard'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Demande, UIState } from '@/lib/types/prestataire'

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

  const { user } = useUser()

  interface DemandeWithCouple {
    id: string
    couple_id: string
    date_mariage: string
    budget_min?: number
    budget_max?: number
    location: string
    status: string
    message?: string
    created_at: string
    couple?: {
      partner_1_name?: string
      partner_2_name?: string
      wedding_date?: string
    } | null
  }

  const formatAndGroupDemandes = (data: DemandeWithCouple[]): { nouvelles: Demande[], en_cours: Demande[], terminees: Demande[] } => {
    const nouvelles: Demande[] = []
    const en_cours: Demande[] = []
    const terminees: Demande[] = []

    data.forEach((demande) => {
      const coupleNom = demande.couple 
        ? `${demande.couple.partner_1_name || ''} & ${demande.couple.partner_2_name || ''}`.trim() || 'Couple'
        : 'Couple'

      const demandeFormatted: Demande = {
        id: demande.id,
        couple_id: demande.couple_id,
        couple_nom: coupleNom,
        date_evenement: demande.couple?.wedding_date || demande.date_mariage,
        budget_min: demande.budget_min || 0,
        budget_max: demande.budget_max || 0,
        lieu: demande.location || '',
        statut: demande.status === 'new' ? 'nouvelle' 
          : demande.status === 'in-progress' ? 'en_cours'
          : demande.status === 'accepted' ? 'en_cours'
          : demande.status === 'completed' ? 'terminee'
          : 'nouvelle',
        message: demande.message,
        created_at: demande.created_at,
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
    if (!user) return

    setUiState({ loading: 'loading', error: null })
    
    try {
      const supabase = createClient()
      
      // Récupérer les demandes avec les données du couple
      const { data: demandesData, error } = await supabase
        .from('demandes')
        .select('*')
        .eq('prestataire_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Enrichir avec les données de couples
      const coupleIds = [...new Set((demandesData || []).map((d: any) => d.couple_id))]
      
      let couplesData = null
      if (coupleIds.length > 0) {
        const { data, error: couplesError } = await supabase
          .from('couples')
          .select('user_id, partner_1_name, partner_2_name, wedding_date')
          .in('user_id', coupleIds)
        
        if (couplesError) throw couplesError
        couplesData = data
      }

      // Créer un mapping couple_id -> couple data
      const couplesMap = new Map((couplesData || []).map((c: any) => [c.user_id, c]))
      
      // Fusionner les données
      const data = (demandesData || []).map((demande: any) => ({
        ...demande,
        couple: couplesMap.get(demande.couple_id) || null
      }))

      setDemandes(formatAndGroupDemandes(data || []))
      setUiState({ loading: 'success', error: null })
    } catch (error) {
      // Improved error logging for Supabase errors
      const errorDetails = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null
        ? JSON.stringify(error, Object.getOwnPropertyNames(error))
        : String(error)
      
      console.error('Erreur chargement demandes:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: errorDetails
      })
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : 'Erreur de chargement'
      
      toast.error('Erreur lors du chargement des demandes')
      setUiState({ loading: 'error', error: errorMessage })
    }
  }

  useEffect(() => {
    fetchDemandes()
  }, [user])

  const handleAcceptDemande = async (demandeId: string) => {
    if (!user) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('demandes')
        .update({ status: 'accepted' })
        .eq('id', demandeId)

      if (error) throw error

      toast.success('Demande acceptée')
      await fetchDemandes()
    } catch (error) {
      console.error('Erreur acceptation:', error)
      toast.error('Erreur lors de l\'acceptation')
    }
  }

  const handleRejectDemande = async (demandeId: string) => {
    if (!user) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('demandes')
        .update({ status: 'rejected' })
        .eq('id', demandeId)

      if (error) throw error

      toast.success('Demande refusée')
      await fetchDemandes()
    } catch (error) {
      console.error('Erreur refus:', error)
      toast.error('Erreur lors du refus')
    }
  }

  if (uiState.loading === 'loading') {
    return <LoadingSpinner size="lg" text="Chargement des demandes..." />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent mb-2">
          Demandes reçues
        </h1>
        <p className="text-[#823F91]/70 text-lg">
          Gérez toutes vos demandes de prestations
        </p>
      </motion.div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#823F91]/50" />
        <Input
          placeholder="Rechercher une demande..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-[#823F91]/20 focus:border-[#823F91] focus:ring-[#823F91]/20"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="nouvelles" className="w-full">
        <TabsList className="mb-8 bg-gradient-to-r from-[#823F91]/10 via-[#9D5FA8]/10 to-[#823F91]/10 border border-[#823F91]/20">
          <TabsTrigger value="nouvelles" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#823F91] data-[state=active]:to-[#9D5FA8] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#823F91]/30">
            Nouvelles
            {demandes.nouvelles.length > 0 && (
              <Badge className="bg-[#823F91] text-white shadow-md">
                {demandes.nouvelles.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="en-cours" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#823F91] data-[state=active]:to-[#9D5FA8] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#823F91]/30">
            En cours
            {demandes.en_cours.length > 0 && (
              <Badge className="bg-[#823F91] text-white shadow-md">
                {demandes.en_cours.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="terminees" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#823F91] data-[state=active]:to-[#9D5FA8] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#823F91]/30">
            Terminées
          </TabsTrigger>
        </TabsList>

        {/* Tab Content - Nouvelles */}
        <TabsContent value="nouvelles">
          {demandes.nouvelles.length === 0 ? (
            <EmptyState
              title="Aucune nouvelle demande"
              description="Les nouvelles demandes de couples apparaîtront ici"
            />
          ) : (
            <div className="space-y-4">
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

        {/* Tab Content - En cours */}
        <TabsContent value="en-cours">
          {demandes.en_cours.length === 0 ? (
            <EmptyState
              title="Aucune demande en cours"
              description="Les demandes acceptées apparaîtront ici"
            />
          ) : (
            <div className="space-y-4">
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

        {/* Tab Content - Terminées */}
        <TabsContent value="terminees">
          {demandes.terminees.length === 0 ? (
            <EmptyState
              title="Aucune demande terminée"
              description="L'historique de vos prestations apparaîtra ici"
            />
          ) : (
            <div className="space-y-4">
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

