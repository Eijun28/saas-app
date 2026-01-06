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
import { toast } from 'sonner'

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
    if (!user) return

    const fetchStats = async () => {
      setUiState({ loading: 'loading', error: null })
      
      try {
        const supabase = createClient()
        
        // Récupérer d'abord les IDs des conversations
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id')
          .eq('prestataire_id', user.id)

        const conversationIds = conversations?.map(c => c.id) || []

        // Paralléliser toutes les requêtes
        const [
          { count: nouvellesDemandes },
          { count: evenementsAvenir },
          { count: messagesNonLus },
          { count: demandesCeMois },
          { count: totalDemandes }
        ] = await Promise.all([
          // Nouvelles demandes (status = 'new')
          supabase
            .from('demandes')
            .select('id', { count: 'exact', head: true })
            .eq('prestataire_id', user.id)
            .eq('status', 'new'),
          
          // Événements à venir (date >= today)
          supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .eq('prestataire_id', user.id)
            .gte('date', new Date().toISOString().split('T')[0]),
          
          // Messages non lus dans les conversations du prestataire
          conversationIds.length > 0
            ? supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .eq('is_read', false)
                .neq('sender_id', user.id)
                .in('conversation_id', conversationIds)
            : Promise.resolve({ count: 0, error: null }),
          
          // Demandes ce mois (créées ce mois)
          supabase
            .from('demandes')
            .select('id', { count: 'exact', head: true })
            .eq('prestataire_id', user.id)
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
          
          // Total demandes pour calculer le taux de réponse
          supabase
            .from('demandes')
            .select('id', { count: 'exact', head: true })
            .eq('prestataire_id', user.id)
        ])

        // Calculer le taux de réponse (demandes acceptées / total demandes)
        const { count: demandesAcceptees } = await supabase
          .from('demandes')
          .select('id', { count: 'exact', head: true })
          .eq('prestataire_id', user.id)
          .eq('status', 'accepted')

        const tauxReponse = totalDemandes && totalDemandes > 0
          ? Math.round((demandesAcceptees || 0) / totalDemandes * 100)
          : 0

        setStats({
          nouvelles_demandes: nouvellesDemandes || 0,
          evenements_a_venir: evenementsAvenir || 0,
          messages_non_lus: messagesNonLus || 0,
          taux_reponse: tauxReponse,
          demandes_ce_mois: demandesCeMois || 0,
        })
        
        setUiState({ loading: 'success', error: null })
      } catch (error: any) {
        console.error('Erreur chargement stats:', error)
        toast.error('Erreur lors du chargement des statistiques')
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
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#823F91]/10 via-[#9D5FA8]/10 to-[#823F91]/10 border border-[#823F91]/20 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#823F91] font-medium">
              Recherche : <strong className="text-[#6D3478]">{searchQuery}</strong>
            </span>
          </div>
          <button
            onClick={() => {
              setSearchQuery('')
              sessionStorage.removeItem('prestataire_search_query')
            }}
            className="text-sm text-[#823F91] hover:text-[#6D3478] underline transition-colors"
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
            colorClass: "from-[#9D5FA8]/20 via-[#823F91]/20 to-[#6D3478]/20 text-[#823F91]",
            delay: 0.1,
            onClick: () => window.location.href = '/prestataire/demandes-recues',
            searchTerms: ['demandes', 'nouvelles', 'traiter', 'notifications']
          },
          {
            icon: Calendar,
            label: "Événements à venir",
            value: stats.evenements_a_venir,
            subtitle: "Ce mois-ci",
            colorClass: "from-[#9D5FA8]/20 via-[#823F91]/20 to-[#6D3478]/20 text-[#823F91]",
            delay: 0.2,
            onClick: () => window.location.href = '/prestataire/agenda',
            searchTerms: ['événements', 'agenda', 'calendrier', 'rendez-vous']
          },
          {
            icon: MessageSquare,
            label: "Messages non lus",
            value: stats.messages_non_lus,
            subtitle: "À répondre",
            colorClass: "from-[#9D5FA8]/20 via-[#823F91]/20 to-[#6D3478]/20 text-[#823F91]",
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
            colorClass: "from-[#9D5FA8]/20 via-[#823F91]/20 to-[#6D3478]/20 text-[#823F91]",
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
        <Card className="border-[#823F91]/20 bg-background">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent">
              Activité récente
            </CardTitle>
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
