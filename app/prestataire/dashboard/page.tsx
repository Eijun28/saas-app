'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bell, Calendar, MessageSquare, TrendingUp, Search, X, RefreshCw } from 'lucide-react'
import { StatCard } from '@/components/prestataire/dashboard/StatCard'
import { LoadingSpinner } from '@/components/prestataire/shared/LoadingSpinner'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import type { Stats, UIState } from '@/lib/types/prestataire'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { getCouplesByUserIds, formatCoupleName } from '@/lib/supabase/queries/couples.queries'
import { toast } from 'sonner'
import { ActivityItem } from '@/components/dashboard/ActivityItem'
import { AgendaPreview } from '@/components/prestataire/dashboard/AgendaPreview'
import { PendingRequests } from '@/components/prestataire/dashboard/PendingRequests'
import { MonthlyPerformance } from '@/components/prestataire/dashboard/MonthlyPerformance'
import { cn } from '@/lib/utils'

export default function DashboardPrestatairePage() {
  const router = useRouter()
  const { user } = useUser()
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

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

  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)

  // Vérifier le succès du paiement Stripe
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const sessionId = urlParams.get('session_id')
    
    if (success === 'true' && sessionId) {
      toast.success('Abonnement activé avec succès ! Bienvenue dans votre nouveau plan.')
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/prestataire/dashboard')
    }
  }, [])

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
        
        // Paralléliser toutes les requêtes
        const [
          { count: nouvellesDemandes, error: demandesError },
          { count: evenementsAvenir, error: eventsError },
          { count: demandesCeMois },
          { count: totalDemandes }
        ] = await Promise.all([
          // Nouvelles demandes (requests.status = 'pending')
          supabase
            .from('requests')
            .select('id', { count: 'exact', head: true })
            .eq('provider_id', user.id)
            .eq('status', 'pending'),
          
          // Événements à venir (date >= today)
          supabase
            .from('evenements_prestataire')
            .select('id', { count: 'exact', head: true })
            .eq('prestataire_id', user.id)
            .gte('date', new Date().toISOString().split('T')[0]),
          
          // Demandes ce mois (créées ce mois)
          supabase
            .from('requests')
            .select('id', { count: 'exact', head: true })
            .eq('provider_id', user.id)
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
          
          // Total demandes pour calculer le taux de réponse
          supabase
            .from('requests')
            .select('id', { count: 'exact', head: true })
            .eq('provider_id', user.id)
        ])

        // Fonction pour vérifier si une erreur est ignorable
        const isIgnorableError = (err: any) => {
          if (!err) return true
          const ignorableErrorCodes = ['42P01', 'PGRST116', 'PGRST301']
          const ignorableMessages = ['does not exist', 'permission denied', 'no rows returned', 'relation', 'table']
          return ignorableErrorCodes.includes(err.code) || 
            ignorableMessages.some(msg => err.message?.toLowerCase().includes(msg.toLowerCase()))
        }
        
        // Ignorer silencieusement les erreurs non critiques (table n'existe pas, RLS, etc.)
        // Ne pas afficher de message d'erreur pour ces cas normaux
        if (demandesError && !isIgnorableError(demandesError)) {
          const isNetworkError = demandesError.message?.includes('fetch') || 
            demandesError.message?.includes('network') || 
            demandesError.message?.includes('timeout')
          if (isNetworkError) {
            throw demandesError
          }
          // Si ce n'est pas une erreur réseau, ignorer silencieusement
        }
        if (eventsError && !isIgnorableError(eventsError)) {
          const isNetworkError = eventsError.message?.includes('fetch') || 
            eventsError.message?.includes('network') || 
            eventsError.message?.includes('timeout')
          if (isNetworkError) {
            throw eventsError
          }
          // Si ce n'est pas une erreur réseau, ignorer silencieusement
        }

        // Calculer le taux de réponse (demandes acceptées / total demandes)
        const { count: demandesAcceptees, error: accepteesError } = await supabase
          .from('requests')
          .select('id', { count: 'exact', head: true })
          .eq('provider_id', user.id)
          .eq('status', 'accepted')
        
        // Ignorer l'erreur si ce n'est pas une erreur critique
        if (accepteesError && !isIgnorableError(accepteesError)) {
          const isNetworkError = accepteesError.message?.includes('fetch') || 
            accepteesError.message?.includes('network') || 
            accepteesError.message?.includes('timeout')
          if (isNetworkError) {
            throw accepteesError
          }
        }

        const tauxReponse = totalDemandes && totalDemandes > 0
          ? Math.round((demandesAcceptees || 0) / totalDemandes * 100)
          : 0

        setStats({
          nouvelles_demandes: nouvellesDemandes || 0,
          evenements_a_venir: evenementsAvenir || 0,
          messages_non_lus: 0,
          taux_reponse: tauxReponse,
          demandes_ce_mois: demandesCeMois || 0,
        })

        setLastUpdated(new Date())
        setUiState({ loading: 'success', error: null })
      } catch (error: any) {
        console.error('Erreur chargement stats:', error)
        // Codes d'erreur à ignorer (cas normaux)
        const ignorableErrorCodes = ['42P01', 'PGRST116', 'PGRST301']
        const ignorableMessages = ['does not exist', 'permission denied', 'no rows returned', 'relation', 'table']
        
        const isIgnorableError = ignorableErrorCodes.includes(error?.code) || 
          ignorableMessages.some(msg => error?.message?.toLowerCase().includes(msg.toLowerCase()))
        
        if (isIgnorableError) {
          // Initialiser avec des valeurs par défaut sans afficher d'erreur
          setStats({
            nouvelles_demandes: 0,
            evenements_a_venir: 0,
            messages_non_lus: 0,
            taux_reponse: 0,
            demandes_ce_mois: 0,
          })
          setUiState({ loading: 'success', error: null })
          return
        }
        
        // Vérifier si c'est une vraie erreur réseau
        const isNetworkError = error?.message?.includes('fetch') || 
          error?.message?.includes('network') || 
          error?.message?.includes('timeout')
        
        if (!isNetworkError) {
          // Probablement RLS ou autre cas normal, ignorer silencieusement
          // Ne pas afficher de toast d'erreur pour ces cas
          setStats({
            nouvelles_demandes: 0,
            evenements_a_venir: 0,
            messages_non_lus: 0,
            taux_reponse: 0,
            demandes_ce_mois: 0,
          })
          setUiState({ loading: 'success', error: null })
          return
        }
        
        // Vraie erreur critique réseau uniquement : afficher le message
        console.error('Erreur réseau lors du chargement des statistiques:', error)
        setUiState({ 
          loading: 'success', // Ne pas bloquer l'UI même en cas d'erreur réseau
          error: null 
        })
        // Ne pas afficher de toast pour éviter de perturber l'utilisateur
        // Les stats seront simplement à 0
      }
    }

    fetchStats()
  }, [user])

  // Fonction pour formater le temps relatif
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  }

  // Charger les activités récentes
  useEffect(() => {
    if (!user) return

    const fetchRecentActivities = async () => {
      setActivitiesLoading(true)
      try {
        const supabase = createClient()
        const activities: any[] = []

        // Récupérer les dernières demandes (5 max)
        const { data: recentRequests } = await supabase
          .from('requests')
          .select('id, couple_id, created_at, status')
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (recentRequests && recentRequests.length > 0) {
          // Récupérer les informations des couples
          const coupleUserIds = [...new Set(recentRequests.map(r => r.couple_id).filter(Boolean))]
          const couplesMap = await getCouplesByUserIds(coupleUserIds, [
            'user_id',
            'partner_1_name',
            'partner_2_name'
          ])

          // Transformer les données
          recentRequests.forEach((req: any) => {
            const couple = couplesMap.get(req.couple_id)

            activities.push({
              id: `request-${req.id}`,
              type: 'request',
              title: `Nouvelle demande de ${formatCoupleName(couple)}`,
              time: formatRelativeTime(req.created_at),
              createdAt: req.created_at, // Garder la date originale pour le tri
              icon: Bell,
              color: 'text-[#823F91]',
              href: '/prestataire/demandes-recues',
            })
          })
        }

        // Trier par date de création (pas par time formaté)
        activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setRecentActivities(activities.slice(0, 5))
      } catch (error) {
        console.error('Erreur chargement activités:', error)
      } finally {
        setActivitiesLoading(false)
      }
    }

    fetchRecentActivities()
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
      <div className="w-full space-y-5 sm:space-y-6">

      {/* Header avec greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {prenom ? `Bonjour ${prenom}` : 'Tableau de bord'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue d'ensemble de votre activite
          </p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
            <RefreshCw className="h-3 w-3" />
            <span>
              {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </motion.div>

      {/* Barre de recherche améliorée */}
      {searchQuery && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between p-4 bg-[#823F91] rounded-2xl shadow-lg shadow-[#823F91]/20"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-white/20 rounded-xl flex-shrink-0">
              <Search className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 mb-0.5">Recherche active</p>
              <p className="text-sm sm:text-base text-white font-semibold truncate">
                {searchQuery}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSearchQuery('')
              sessionStorage.removeItem('prestataire_search_query')
            }}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors active:scale-[0.98] flex-shrink-0"
            title="Effacer la recherche"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 xl:gap-5 w-full items-stretch">
        {[
          {
            icon: Bell,
            label: "Nouvelles demandes",
            value: stats.nouvelles_demandes,
            subtitle: "En attente de traitement",
            description: stats.nouvelles_demandes > 0
              ? `${stats.nouvelles_demandes} demande${stats.nouvelles_demandes > 1 ? 's' : ''} necessite${stats.nouvelles_demandes > 1 ? 'nt' : ''} votre attention`
              : "Aucune nouvelle demande pour le moment",
            colorClass: "from-[#9D5FA8]/20 via-[#823F91]/20 to-[#6D3478]/20 text-[#823F91]",
            delay: 0.1,
            onClick: () => router.push('/prestataire/demandes-recues'),
            actionLabel: "Voir toutes les demandes",
            searchTerms: ['demandes', 'nouvelles', 'traiter', 'notifications']
          },
          {
            icon: Calendar,
            label: "Evenements a venir",
            value: stats.evenements_a_venir,
            subtitle: "Ce mois-ci",
            description: stats.evenements_a_venir > 0
              ? `${stats.evenements_a_venir} evenement${stats.evenements_a_venir > 1 ? 's' : ''} planifie${stats.evenements_a_venir > 1 ? 's' : ''}`
              : "Aucun evenement prevu ce mois",
            colorClass: "from-[#9D5FA8]/20 via-[#823F91]/20 to-[#6D3478]/20 text-[#823F91]",
            delay: 0.2,
            onClick: () => router.push('/prestataire/agenda'),
            actionLabel: "Gerer mon agenda",
            searchTerms: ['evenements', 'agenda', 'calendrier', 'rendez-vous']
          },
          {
            icon: MessageSquare,
            label: "Messages non lus",
            value: stats.messages_non_lus,
            subtitle: "Necessitent une reponse",
            description: stats.messages_non_lus > 0
              ? `${stats.messages_non_lus} message${stats.messages_non_lus > 1 ? 's' : ''} en attente de reponse`
              : "Tous vos messages sont a jour",
            colorClass: "from-[#9D5FA8]/20 via-[#823F91]/20 to-[#6D3478]/20 text-[#823F91]",
            delay: 0.3,
            onClick: () => router.push('/prestataire/messagerie'),
            actionLabel: "Ouvrir la messagerie",
            searchTerms: ['messages', 'messagerie', 'repondre', 'conversations']
          },
          {
            icon: TrendingUp,
            label: "Taux de reponse",
            value: `${stats.taux_reponse}%`,
            subtitle: "Taux d'acceptation",
            description: stats.taux_reponse > 0
              ? `${stats.taux_reponse}% des demandes sont acceptees`
              : "Aucune statistique disponible pour le moment",
            colorClass: "from-[#9D5FA8]/20 via-[#823F91]/20 to-[#6D3478]/20 text-[#823F91]",
            delay: 0.4,
            actionLabel: "Voir les statistiques",
            searchTerms: ['taux', 'reponse', 'statistiques', 'performance']
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
              description={card.description}
              colorClass={card.colorClass}
              delay={card.delay}
              onClick={card.onClick}
              actionLabel={card.actionLabel}
            />
          ))}
      </div>

      {/* Activité récente - Card épurée */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Header avec fond blanc ivoire */}
        <div className="bg-gradient-to-r from-[#FFFDF7] to-[#FFF9EE] px-5 py-4 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Activité récente</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Dernières actions sur votre compte
          </p>
        </div>

        {/* Contenu avec scroll caché */}
        <div className="p-4 sm:p-5 max-h-[320px] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {activitiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 animate-pulse">
                  <div className="h-10 w-10 rounded-lg bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivities.length === 0 ? (
            <EmptyState
              title="Aucune activité récente"
              description="Vos dernières actions apparaîtront ici"
            />
          ) : (
            <div className="space-y-2">
              {recentActivities.map((activity, index) => (
                <ActivityItem
                  key={activity.id}
                  icon={activity.icon}
                  title={activity.title}
                  time={activity.time}
                  color={activity.color}
                  onClick={activity.href ? () => router.push(activity.href) : undefined}
                  delay={index * 0.05}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Grille 2 colonnes pour Agenda et Demandes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <AgendaPreview />
        <PendingRequests />
      </div>

      {/* Performance du mois */}
      <MonthlyPerformance />
      </div>

    </div>
  )
}
