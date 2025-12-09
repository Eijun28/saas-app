'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { LoadingSpinner } from '@/components/prestataire/shared/LoadingSpinner'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
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

  // TODO: Fetch demandes from Supabase
  // Table: demandes
  // Join: couples (pour couple_nom)
  // Filter: prestataire_id = current_user_id
  // Group by: statut
  useEffect(() => {
    const fetchDemandes = async () => {
      setUiState({ loading: 'loading', error: null })
      
      try {
        // const { data, error } = await supabase
        //   .from('demandes')
        //   .select(`
        //     *,
        //     couple:couples(nom, prenom)
        //   `)
        //   .eq('prestataire_id', user.id)
        //   .order('created_at', { ascending: false })
        
        setUiState({ loading: 'success', error: null })
      } catch (error) {
        setUiState({ loading: 'error', error: 'Erreur de chargement' })
      }
    }

    // fetchDemandes()
  }, [])

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
          {demandes.nouvelles.length === 0 ? (
            <EmptyState
              title="Aucune nouvelle demande"
              description="Les nouvelles demandes de couples apparaîtront ici"
            />
          ) : (
            <div className="space-y-4">
              {/* TODO: Map through demandes.nouvelles */}
              {/* <DemandeCard key={demande.id} data={demande} /> */}
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
              {/* TODO: Map through demandes.en_cours */}
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
              {/* TODO: Map through demandes.terminees */}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

