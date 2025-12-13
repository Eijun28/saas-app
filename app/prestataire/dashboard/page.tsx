'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, Calendar, MessageSquare, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/prestataire/dashboard/StatCard'
import { LoadingSpinner } from '@/components/prestataire/shared/LoadingSpinner'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import type { Stats, UIState } from '@/lib/types/prestataire'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPrestatairePage() {
  const { user } = useUser()
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  
  // États
  const [stats, setStats] = useState<Stats>({
    nouvelles_demandes: 0,
    evenements_a_venir: 0,
    messages_non_lus: 0,
    taux_reponse: 0,
    demandes_ce_mois: 0,
  })

  const [uiState, setUiState] = useState<UIState>({
    loading: 'idle',
    error: null,
  })

  useEffect(() => {
    if (user) {
      const supabase = createClient()
      supabase
        .from('profiles')
        .select('prenom, nom')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.prenom) setPrenom(data.prenom)
          if (data?.nom) setNom(data.nom)
        })
    }
  }, [user])

  // TODO: Fetch stats from Supabase
  // Table: demandes (count where statut = 'nouvelle')
  // Table: evenements (count where date >= today)
  // Table: messages (count where lu = false AND receiver_type = 'prestataire')
  useEffect(() => {
    const fetchStats = async () => {
      setUiState({ loading: 'loading', error: null })
      
      try {
        // Supabase queries here
        // const { data, error } = await supabase...
        
        setUiState({ loading: 'success', error: null })
      } catch (error) {
        setUiState({ 
          loading: 'error', 
          error: 'Impossible de charger les statistiques' 
        })
      }
    }

    // fetchStats()
  }, [])

  // Render loading state
  if (uiState.loading === 'loading') {
    return <LoadingSpinner size="lg" text="Chargement du dashboard..." />
  }

  // Render error state
  if (uiState.loading === 'error') {
    return (
      <EmptyState
        title="Erreur de chargement"
        description={uiState.error || 'Une erreur est survenue'}
        action={{
          label: 'Réessayer',
          onClick: () => window.location.reload(),
        }}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
          Bonjour {prenom && nom ? `${prenom} ${nom}` : prenom || '👋'}
        </h1>
        <p className="text-muted-foreground text-base md:text-lg mt-2">
          Aperçu de votre activité
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Bell}
          label="Nouvelles demandes"
          value={stats.nouvelles_demandes}
          subtitle="À traiter"
          colorClass="from-[#9D5FA8]/10 to-[#823F91]/10 text-[#823F91]"
          delay={0.1}
          onClick={() => window.location.href = '/prestataire/demandes-recues'}
        />

        <StatCard
          icon={Calendar}
          label="Événements à venir"
          value={stats.evenements_a_venir}
          subtitle="Ce mois-ci"
          colorClass="from-blue-100/50 to-blue-200/50 text-blue-600"
          delay={0.2}
          onClick={() => window.location.href = '/prestataire/agenda'}
        />

        <StatCard
          icon={MessageSquare}
          label="Messages non lus"
          value={stats.messages_non_lus}
          subtitle="À répondre"
          colorClass="from-green-100/50 to-green-200/50 text-green-600"
          delay={0.3}
          onClick={() => window.location.href = '/prestataire/messagerie'}
        />

        <StatCard
          icon={TrendingUp}
          label="Taux de réponse"
          value={`${stats.taux_reponse}%`}
          trend={{
            value: '+5% ce mois',
            positive: true,
          }}
          colorClass="from-orange-100/50 to-orange-200/50 text-orange-600"
          delay={0.4}
        />
      </div>

      {/* Activité récente */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card className="border-gray-200/50">
          <CardHeader>
            <CardTitle className="text-2xl">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Aucune activité récente"
              description="Les nouvelles demandes et messages apparaîtront ici"
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
