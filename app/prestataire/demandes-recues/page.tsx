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
import type { Demande, UIState } from '@/types/prestataire'
import { useUser } from '@/hooks/use-user'
import { supabase } from '@/lib/supabase/client'

export default function DemandesRecuesPage() {
  const { user } = useUser()
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

  // Fonction de filtrage pour la recherche
  const filterDemandes = (list: Demande[]) => {
    if (!searchTerm) return list
    
    return list.filter(d => 
      d.couple_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.service_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.message?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  useEffect(() => {
    const fetchDemandes = async () => {
      setUiState({ loading: 'loading', error: null })
      
      try {
        // 1. Récupérer user authentifié
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        if (authError || !authUser) {
          throw new Error('Non authentifié')
        }

        // 2. Fetch toutes les demandes du prestataire
        const { data: allDemandes, error } = await supabase
          .from('demandes')
          .select('*')
          .eq('provider_id', authUser.id)  // ⚠️ provider_id
          .order('created_at', { ascending: false })

        if (error) throw error

        if (!allDemandes || allDemandes.length === 0) {
          setDemandes({
            nouvelles: [],
            en_cours: [],
            terminees: [],
          })
          setUiState({ loading: 'success', error: null })
          return
        }

        // 3. Récupérer les infos des couples
        const coupleIds = [...new Set(allDemandes.map((d: any) => d.couple_id))]
        const { data: couplesData } = await supabase
          .from('couples')
          .select('user_id, partner_1_name, partner_2_name, email')
          .in('user_id', coupleIds)

        // Créer un map pour accéder rapidement aux infos couple
        const couplesMap = new Map()
        if (couplesData) {
          couplesData.forEach((couple: any) => {
            couplesMap.set(couple.user_id, couple)
          })
        }

        // 4. Enrichir avec couple_name et couple_email
        const enrichedDemandes: Demande[] = (allDemandes || []).map((d: any) => {
          const couple = couplesMap.get(d.couple_id)
          return {
            ...d,
            couple_name: couple?.partner_1_name && couple?.partner_2_name
              ? `${couple.partner_1_name} & ${couple.partner_2_name}`
              : couple?.partner_1_name || 'Couple',
            couple_email: couple?.email
          }
        })

        // 5. Grouper par statut
        const grouped = {
          nouvelles: enrichedDemandes.filter(d => d.status === 'pending'),
          en_cours: enrichedDemandes.filter(d => ['viewed', 'responded'].includes(d.status)),
          terminees: enrichedDemandes.filter(d => ['accepted', 'rejected'].includes(d.status))
        }

        setDemandes(grouped)
        setUiState({ loading: 'success', error: null })
      } catch (error) {
        console.error('Erreur fetch demandes:', error)
        setUiState({ loading: 'error', error: 'Erreur de chargement' })
      }
    }

    fetchDemandes()
  }, [user])

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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Demandes reçues
        </h1>
        <p className="text-muted-foreground text-lg">
          Gérez toutes vos demandes de prestations
        </p>
      </motion.div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Rechercher une demande..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="nouvelles" className="w-full">
        <TabsList className="mb-8 bg-gray-100">
          <TabsTrigger value="nouvelles" className="gap-2">
            Nouvelles
            {demandes.nouvelles.length > 0 && (
              <Badge className="bg-[#823F91] text-white">
                {demandes.nouvelles.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="en-cours">
            En cours
            {demandes.en_cours.length > 0 && (
              <Badge variant="secondary">
                {demandes.en_cours.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="terminees">
            Terminées
          </TabsTrigger>
        </TabsList>

        {/* Tab Content - Nouvelles */}
        <TabsContent value="nouvelles">
          {filterDemandes(demandes.nouvelles).length === 0 ? (
            <EmptyState
              title="Aucune nouvelle demande"
              description="Les nouvelles demandes de couples apparaîtront ici"
            />
          ) : (
            <div className="space-y-4">
              {filterDemandes(demandes.nouvelles).map((demande) => (
                <DemandeCard key={demande.id} demande={demande} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Content - En cours */}
        <TabsContent value="en-cours">
          {filterDemandes(demandes.en_cours).length === 0 ? (
            <EmptyState
              title="Aucune demande en cours"
              description="Les demandes acceptées apparaîtront ici"
            />
          ) : (
            <div className="space-y-4">
              {filterDemandes(demandes.en_cours).map((demande) => (
                <DemandeCard key={demande.id} demande={demande} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Content - Terminées */}
        <TabsContent value="terminees">
          {filterDemandes(demandes.terminees).length === 0 ? (
            <EmptyState
              title="Aucune demande terminée"
              description="L'historique de vos prestations apparaîtra ici"
            />
          ) : (
            <div className="space-y-4">
              {filterDemandes(demandes.terminees).map((demande) => (
                <DemandeCard key={demande.id} demande={demande} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

