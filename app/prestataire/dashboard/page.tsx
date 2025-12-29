'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, Calendar, MessageSquare, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/prestataire/dashboard/StatCard'
import { LoadingSpinner } from '@/components/prestataire/shared/LoadingSpinner'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import type { Stats, UIState } from '@/types/prestataire'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPrestatairePage() {
  const { user } = useUser()
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
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

  // Écouter les événements de recherche depuis TopBar
  useEffect(() => {
    const handleSearch = (e: CustomEvent) => {
      setSearchQuery(e.detail || '')
    }

    // Charger la recherche depuis sessionStorage au montage
    const savedQuery = sessionStorage.getItem('prestataire_search_query')
    if (savedQuery) {
      setSearchQuery(savedQuery)
    }

    window.addEventListener('prestataire-search', handleSearch as EventListener)
    
    return () => {
      window.removeEventListener('prestataire-search', handleSearch as EventListener)
    }
  }, [])

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

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return

      setUiState({ loading: 'loading', error: null })
      
      try {
        const supabase = createClient()

        // Vérifier que l'utilisateur est authentifié
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        if (authError || !authUser) {
          console.error('Erreur authentification:', authError)
          setUiState({ loading: 'error', error: 'Non authentifié' })
          return
        }

        const userId = authUser.id

        // Calculer les dates pour "ce mois"
        const now = new Date()
        const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

        // Requêtes en parallèle selon le schéma RÉEL Supabase
        const [
          nouvellesDemandesResult,
          conversationsResult,
          totalDemandesResult,
          demandesReponduesResult,
          demandesCeMoisResult
        ] = await Promise.all([
          // 1. Nouvelles demandes (status = 'pending') - ⚠️ provider_id
          supabase
            .from('demandes')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', userId)
            .eq('status', 'pending'),
          
          // 2. Conversations avec compteurs non lus - ⚠️ provider_id et unread_count_provider
          supabase
            .from('conversations')
            .select('unread_count_provider')
            .eq('provider_id', userId)
            .eq('status', 'active'),
          
          // 3. Total demandes reçues - ⚠️ provider_id
          supabase
            .from('demandes')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', userId),
          
          // 4. Demandes répondues (responded_at NOT NULL) - ⚠️ provider_id
          supabase
            .from('demandes')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', userId)
            .not('responded_at', 'is', null),
          
          // 5. Demandes ce mois - ⚠️ provider_id
          supabase
            .from('demandes')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', userId)
            .gte('created_at', debutMois)
            .lte('created_at', finMois + 'T23:59:59')
        ])

        // Traiter les erreurs individuellement
        const nouvelles_demandes = nouvellesDemandesResult.error 
          ? (console.error('Erreur nouvelles demandes:', nouvellesDemandesResult.error), 0)
          : (nouvellesDemandesResult.count || 0)

        // Événements ce mois : mettre à 0 pour l'instant (à implémenter plus tard)
        const evenements_a_venir = 0

        // Compter les messages non lus depuis unread_count_provider
        let messages_non_lus = 0
        if (conversationsResult.error) {
          console.error('Erreur conversations:', conversationsResult.error)
        } else if (conversationsResult.data) {
          messages_non_lus = conversationsResult.data.reduce(
            (sum, conv) => sum + (conv.unread_count_provider || 0),
            0
          )
        }

        const totalDemandes = totalDemandesResult.error
          ? (console.error('Erreur total demandes:', totalDemandesResult.error), 0)
          : (totalDemandesResult.count || 0)

        const demandesRepondues = demandesReponduesResult.error
          ? (console.error('Erreur demandes répondues:', demandesReponduesResult.error), 0)
          : (demandesReponduesResult.count || 0)

        const demandes_ce_mois = demandesCeMoisResult.error
          ? (console.error('Erreur demandes ce mois:', demandesCeMoisResult.error), 0)
          : (demandesCeMoisResult.count || 0)

        // Calculer le taux de réponse (basé sur responded_at)
        const taux_reponse = totalDemandes > 0
          ? Math.round((demandesRepondues / totalDemandes) * 100)
          : 0

        // Mettre à jour les stats
        setStats({
          nouvelles_demandes,
          evenements_a_venir,
          messages_non_lus,
          taux_reponse,
          demandes_ce_mois
        })

        setUiState({ loading: 'success', error: null })
      } catch (error) {
        console.error('Erreur fetch stats:', error)
        // Mettre stats à 0 en cas d'erreur (UX dégradée mais pas de crash)
        setStats({
          nouvelles_demandes: 0,
          evenements_a_venir: 0,
          messages_non_lus: 0,
          taux_reponse: 0,
          demandes_ce_mois: 0
        })
        setUiState({ 
          loading: 'error', 
          error: 'Impossible de charger les statistiques' 
        })
      }
    }

    fetchStats()
  }, [user])

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
    <div className="w-full">
      <div className="w-full space-y-8">
      {/* Affichage de la recherche active */}
      {searchQuery && (
        <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-purple-700">
              Recherche : <strong>{searchQuery}</strong>
            </span>
          </div>
          <button
            onClick={() => {
              setSearchQuery('')
              sessionStorage.removeItem('prestataire_search_query')
            }}
            className="text-sm text-purple-600 hover:text-purple-800 underline"
          >
            Effacer
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {[
          {
            icon: Bell,
            label: "Nouvelles demandes",
            value: stats.nouvelles_demandes,
            subtitle: "À traiter",
            colorClass: "from-[#9D5FA8]/10 to-[#823F91]/10 text-[#823F91]",
            delay: 0.1,
            onClick: () => window.location.href = '/prestataire/demandes-recues',
            searchTerms: ['demandes', 'nouvelles', 'traiter', 'notifications']
          },
          {
            icon: Calendar,
            label: "Événements à venir",
            value: stats.evenements_a_venir,
            subtitle: "Ce mois-ci",
            colorClass: "from-blue-100/50 to-blue-200/50 text-blue-600",
            delay: 0.2,
            onClick: () => window.location.href = '/prestataire/agenda',
            searchTerms: ['événements', 'agenda', 'calendrier', 'rendez-vous']
          },
          {
            icon: MessageSquare,
            label: "Messages non lus",
            value: stats.messages_non_lus,
            subtitle: "À répondre",
            colorClass: "from-green-100/50 to-green-200/50 text-green-600",
            delay: 0.3,
            onClick: () => window.location.href = '/prestataire/messagerie',
            searchTerms: ['messages', 'messagerie', 'répondre', 'conversations']
          },
          {
            icon: TrendingUp,
            label: "Taux de réponse",
            value: `${stats.taux_reponse}%`,
            trend: {
              value: '+5% ce mois',
              positive: true,
            },
            colorClass: "from-orange-100/50 to-orange-200/50 text-orange-600",
            delay: 0.4,
            searchTerms: ['taux', 'réponse', 'statistiques', 'performance']
          }
        ]
          .filter(card => {
            if (!searchQuery) return true
            const query = searchQuery.toLowerCase()
            return card.label.toLowerCase().includes(query) ||
                   (card.subtitle && card.subtitle.toLowerCase().includes(query)) ||
                   card.searchTerms.some(term => term.toLowerCase().includes(query))
          })
          .map((card, index) => (
            <StatCard
              key={index}
              icon={card.icon}
              label={card.label}
              value={card.value}
              subtitle={card.subtitle}
              colorClass={card.colorClass}
              delay={card.delay}
              onClick={card.onClick}
              trend={card.trend}
            />
          ))}
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
    </div>
  )
}
