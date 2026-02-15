'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Bell,
  Calendar,
  MessageSquare,
  TrendingUp,
  Search,
  X,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Gift,
  Copy,
  Check,
  Zap,
} from 'lucide-react'
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
import { calculateProviderProfileCompletion } from '@/lib/profile/completion'

type PeriodFilter = '7d' | '30d' | 'month'

export default function DashboardPrestatairePage() {
  const router = useRouter()
  const { user } = useUser()
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('30d')

  const [stats, setStats] = useState<Stats>({
    nouvelles_demandes: 0,
    evenements_a_venir: 0,
    conversations_en_cours: 0,
    taux_reponse: 0,
    demandes_ce_mois: 0,
  })

  const [prevStats, setPrevStats] = useState<Partial<Stats>>({})

  const [uiState, setUiState] = useState<UIState>({
    loading: 'idle',
    error: null,
  })

  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [profileCompletion, setProfileCompletion] = useState<number | null>(null)
  const [profileBannerDismissed, setProfileBannerDismissed] = useState(false)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referralCount, setReferralCount] = useState(0)
  const [referralCopied, setReferralCopied] = useState(false)
  const [urgentDemandes, setUrgentDemandes] = useState(0)

  // Verifier le succes du paiement Stripe
  useEffect(() => {
    if (typeof window === 'undefined') return
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const sessionId = urlParams.get('session_id')
    if (success === 'true' && sessionId) {
      toast.success('Abonnement active avec succes ! Bienvenue dans votre nouveau plan.')
      window.history.replaceState({}, '', '/prestataire/dashboard')
    }
  }, [])

  // Ecouter les evenements de recherche depuis TopBar
  useEffect(() => {
    const handleSearch = (e: CustomEvent) => {
      setSearchQuery(e.detail || '')
    }
    const savedQuery = sessionStorage.getItem('prestataire_search_query')
    if (savedQuery) setSearchQuery(savedQuery)
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

  // Calcul completion profil
  useEffect(() => {
    if (!user) return
    const fetchProfileCompletion = async () => {
      try {
        const supabase = createClient()
        const [profileResult, culturesResult, zonesResult, portfolioResult] = await Promise.all([
          supabase.from('profiles').select('avatar_url, nom_entreprise, description_courte, budget_min, budget_max, ville_principale, instagram_url, facebook_url, website_url').eq('id', user.id).maybeSingle(),
          supabase.from('provider_cultures').select('culture_id').eq('profile_id', user.id),
          supabase.from('provider_zones').select('zone_id').eq('profile_id', user.id),
          supabase.from('provider_portfolio').select('id').eq('profile_id', user.id),
        ])
        const result = calculateProviderProfileCompletion(profileResult.data, culturesResult.data?.length || 0, zonesResult.data?.length || 0, portfolioResult.data?.length || 0)
        setProfileCompletion(result.percentage)
      } catch (error) {
        console.error('Erreur calcul completion profil:', error)
      }
    }
    fetchProfileCompletion()
  }, [user])

  // Charger code parrainage
  useEffect(() => {
    if (!user) return
    const fetchReferralCode = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase.from('provider_referrals').select('referral_code, total_referrals').eq('provider_id', user.id).maybeSingle()
        if (data) {
          setReferralCode(data.referral_code)
          setReferralCount(data.total_referrals || 0)
        }
      } catch (error) { /* table may not exist */ }
    }
    fetchReferralCode()
  }, [user])

  // Fetch stats
  useEffect(() => {
    if (!user) return
    const fetchStats = async () => {
      setUiState({ loading: 'loading', error: null })
      try {
        const supabase = createClient()
        const [
          { count: nouvellesDemandes, error: demandesError },
          { count: evenementsAvenir, error: eventsError },
          { count: demandesCeMois },
          { count: totalDemandes },
          { count: conversationsEnCours }
        ] = await Promise.all([
          supabase.from('requests').select('id', { count: 'exact', head: true }).eq('provider_id', user.id).eq('status', 'pending'),
          supabase.from('evenements_prestataire').select('id', { count: 'exact', head: true }).eq('prestataire_id', user.id).gte('date', new Date().toISOString().split('T')[0]),
          supabase.from('requests').select('id', { count: 'exact', head: true }).eq('provider_id', user.id).gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
          supabase.from('requests').select('id', { count: 'exact', head: true }).eq('provider_id', user.id),
          supabase.from('requests').select('id', { count: 'exact', head: true }).eq('provider_id', user.id).eq('status', 'accepted'),
        ])

        const isIgnorableError = (err: any) => {
          if (!err) return true
          const codes = ['42P01', 'PGRST116', 'PGRST301']
          const msgs = ['does not exist', 'permission denied', 'no rows returned', 'relation', 'table']
          return codes.includes(err.code) || msgs.some(m => err.message?.toLowerCase().includes(m.toLowerCase()))
        }

        if (demandesError && !isIgnorableError(demandesError)) {
          if (demandesError.message?.includes('fetch') || demandesError.message?.includes('network') || demandesError.message?.includes('timeout')) throw demandesError
        }
        if (eventsError && !isIgnorableError(eventsError)) {
          if (eventsError.message?.includes('fetch') || eventsError.message?.includes('network') || eventsError.message?.includes('timeout')) throw eventsError
        }

        const { count: demandesAcceptees } = await supabase.from('requests').select('id', { count: 'exact', head: true }).eq('provider_id', user.id).eq('status', 'accepted')
        const tauxReponse = totalDemandes && totalDemandes > 0 ? Math.round((demandesAcceptees || 0) / totalDemandes * 100) : 0

        // Urgent demandes (> 24h pending)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { count: urgentCount } = await supabase.from('requests').select('id', { count: 'exact', head: true }).eq('provider_id', user.id).eq('status', 'pending').lt('created_at', oneDayAgo)
        setUrgentDemandes(urgentCount || 0)

        // Previous month delta
        const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString()
        const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString()
        const { count: prevMonthDemandes } = await supabase.from('requests').select('id', { count: 'exact', head: true }).eq('provider_id', user.id).gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd)
        setPrevStats({ demandes_ce_mois: prevMonthDemandes || 0 })

        setStats({
          nouvelles_demandes: nouvellesDemandes || 0,
          evenements_a_venir: evenementsAvenir || 0,
          conversations_en_cours: conversationsEnCours || 0,
          taux_reponse: tauxReponse,
          demandes_ce_mois: demandesCeMois || 0,
        })
        setLastUpdated(new Date())
        setUiState({ loading: 'success', error: null })
      } catch (error: any) {
        console.error('Erreur chargement stats:', error)
        const codes = ['42P01', 'PGRST116', 'PGRST301']
        const msgs = ['does not exist', 'permission denied', 'no rows returned', 'relation', 'table']
        const isIgnorable = codes.includes(error?.code) || msgs.some(m => error?.message?.toLowerCase().includes(m.toLowerCase()))
        if (isIgnorable || !(error?.message?.includes('fetch') || error?.message?.includes('network') || error?.message?.includes('timeout'))) {
          setStats({ nouvelles_demandes: 0, evenements_a_venir: 0, conversations_en_cours: 0, taux_reponse: 0, demandes_ce_mois: 0 })
          setUiState({ loading: 'success', error: null })
          return
        }
        setUiState({ loading: 'error', error: error?.message || 'Erreur de chargement des statistiques' })
      }
    }
    fetchStats()
  }, [user])

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return "A l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  }

  // Charger activites recentes
  useEffect(() => {
    if (!user) return
    const fetchRecentActivities = async () => {
      setActivitiesLoading(true)
      try {
        const supabase = createClient()
        const activities: any[] = []
        const { data: recentRequests } = await supabase.from('requests').select('id, couple_id, created_at, status').eq('provider_id', user.id).order('created_at', { ascending: false }).limit(5)
        if (recentRequests && recentRequests.length > 0) {
          const coupleUserIds = [...new Set(recentRequests.map(r => r.couple_id).filter(Boolean))]
          const couplesMap = await getCouplesByUserIds(coupleUserIds, ['user_id', 'partner_1_name', 'partner_2_name'])
          recentRequests.forEach((req: any) => {
            const couple = couplesMap.get(req.couple_id)
            activities.push({
              id: `request-${req.id}`,
              type: 'request',
              title: `Nouvelle demande de ${formatCoupleName(couple)}`,
              time: formatRelativeTime(req.created_at),
              createdAt: req.created_at,
              icon: Bell,
              color: 'text-[#823F91]',
              href: '/prestataire/demandes-recues',
            })
          })
        }
        activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setRecentActivities(activities.slice(0, 5))
      } catch (error) {
        console.error('Erreur chargement activites:', error)
      } finally {
        setActivitiesLoading(false)
      }
    }
    fetchRecentActivities()
  }, [user])

  if (uiState.loading === 'loading') return <LoadingSpinner size="lg" text="Chargement du dashboard..." />
  if (uiState.loading === 'error') return <EmptyState title="Erreur de chargement" description={uiState.error || 'Une erreur est survenue'} action={{ label: 'Reessayer', onClick: () => window.location.reload() }} />

  const demandesDelta = prevStats.demandes_ce_mois !== undefined ? stats.demandes_ce_mois - (prevStats.demandes_ce_mois || 0) : null

  // Next best actions
  const nextActions: { text: string; cta: string; href: string }[] = []
  if (urgentDemandes > 0) nextActions.push({ text: `${urgentDemandes} demande${urgentDemandes > 1 ? 's' : ''} en attente depuis plus de 24h`, cta: 'Repondre maintenant', href: '/prestataire/demandes-recues' })
  // Ne pas dupliquer l'info profil ici car le bandeau dédié (amber) l'affiche déjà
  if (profileCompletion !== null && profileCompletion < 70 && profileBannerDismissed) nextActions.push({ text: `Votre profil est a ${profileCompletion}% — completez-le pour etre visible`, cta: 'Completer le profil', href: '/prestataire/profil-public' })
  if (stats.conversations_en_cours > 0) nextActions.push({ text: `${stats.conversations_en_cours} conversation${stats.conversations_en_cours > 1 ? 's' : ''} en cours`, cta: 'Ouvrir la messagerie', href: '/prestataire/messagerie' })

  return (
    <div className="w-full">
      <div className="w-full space-y-5 sm:space-y-6">

        {/* Header: greeting + period filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <h1 className="text-[22px] sm:text-[26px] font-bold text-gray-900 tracking-tight">
              {prenom ? `Bonjour ${prenom}` : 'Tableau de bord'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Vue d&apos;ensemble de votre activite</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full">
              {([
                { value: '7d' as PeriodFilter, label: '7j' },
                { value: '30d' as PeriodFilter, label: '30j' },
                { value: 'month' as PeriodFilter, label: 'Ce mois' },
              ]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setPeriodFilter(value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150",
                    periodFilter === value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {lastUpdated && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <RefreshCw className="h-3 w-3" />
                <span>{lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Profile completion banner */}
        {profileCompletion !== null && profileCompletion < 70 && !profileBannerDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900">Votre profil est complete a {profileCompletion}%</p>
                <p className="text-xs text-amber-700 mt-0.5">Completez-le a au moins 70% pour etre visible par les couples.</p>
              </div>
              <button onClick={() => setProfileBannerDismissed(true)} className="p-1.5 hover:bg-amber-100 rounded-lg transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center flex-shrink-0 sm:hidden" title="Masquer">
                <X className="h-3.5 w-3.5 text-amber-400" />
              </button>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => router.push('/prestataire/profil-public')}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#823F91] hover:bg-[#5C2B66] text-white text-sm font-medium rounded-xl transition-colors w-full sm:w-auto justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/40 focus-visible:ring-offset-2"
              >
                Completer <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setProfileBannerDismissed(true)} className="p-1.5 hover:bg-amber-100 rounded-lg transition-colors min-w-[28px] min-h-[28px] hidden sm:flex items-center justify-center flex-shrink-0" title="Masquer">
                <X className="h-3.5 w-3.5 text-amber-400" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Next best action */}
        {nextActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="p-4 bg-gradient-to-br from-[#F5F0F7] to-[#E8D4EF]/40 border border-[#823F91]/8 rounded-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#823F91]/10 rounded-xl flex-shrink-0">
                <Zap className="h-4 w-4 text-[#823F91]" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#823F91]/60">Prochaine action recommandee</p>
                <p className="text-sm font-medium text-gray-800">{nextActions[0].text}</p>
                <button
                  onClick={() => router.push(nextActions[0].href)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#823F91] hover:text-[#5C2B66] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/40 rounded"
                >
                  {nextActions[0].cta} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search bar */}
        {searchQuery && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="flex items-center justify-between p-4 bg-[#823F91] rounded-2xl shadow-lg shadow-[#823F91]/20">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-white/20 rounded-xl flex-shrink-0"><Search className="h-4 w-4 text-white" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/70 mb-0.5">Recherche active</p>
                <p className="text-sm sm:text-base text-white font-semibold truncate">{searchQuery}</p>
              </div>
            </div>
            <button onClick={() => { setSearchQuery(''); sessionStorage.removeItem('prestataire_search_query') }} className="p-2 hover:bg-white/20 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center" title="Effacer la recherche">
              <X className="h-4 w-4 text-white" />
            </button>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full items-stretch">
          {[
            {
              icon: Bell, label: "Nouvelles demandes", value: stats.nouvelles_demandes, subtitle: "En attente de traitement",
              description: stats.nouvelles_demandes > 0 ? `${stats.nouvelles_demandes} demande${stats.nouvelles_demandes > 1 ? 's' : ''} necessite${stats.nouvelles_demandes > 1 ? 'nt' : ''} votre attention` : "Aucune nouvelle demande",
              delay: 0.1, onClick: () => router.push('/prestataire/demandes-recues'), actionLabel: "Voir toutes les demandes",
              actionHref: '/prestataire/demandes-recues', searchTerms: ['demandes', 'nouvelles', 'traiter'], delta: demandesDelta, sparkline: [2, 3, 1, 4, 2, 5, stats.nouvelles_demandes],
              emptyStateAction: "Optimiser votre profil", alert: urgentDemandes > 0 ? `${urgentDemandes} demande${urgentDemandes > 1 ? 's' : ''} > 24h` : undefined,
            },
            {
              icon: Calendar, label: "Evenements a venir", value: stats.evenements_a_venir, subtitle: "Ce mois-ci",
              description: stats.evenements_a_venir > 0 ? `${stats.evenements_a_venir} evenement${stats.evenements_a_venir > 1 ? 's' : ''} planifie${stats.evenements_a_venir > 1 ? 's' : ''}` : "Aucun evenement prevu",
              delay: 0.2, onClick: () => router.push('/prestataire/agenda'), actionLabel: "Gerer mon agenda",
              actionHref: '/prestataire/agenda', searchTerms: ['evenements', 'agenda', 'calendrier'], emptyStateAction: "Creer un evenement",
            },
            {
              icon: MessageSquare, label: "Conversations", value: stats.conversations_en_cours, subtitle: "En cours avec des couples",
              description: stats.conversations_en_cours > 0 ? `${stats.conversations_en_cours} conversation${stats.conversations_en_cours > 1 ? 's' : ''} active${stats.conversations_en_cours > 1 ? 's' : ''}` : "Aucune conversation",
              delay: 0.3, onClick: () => router.push('/prestataire/messagerie'), actionLabel: "Ouvrir la messagerie",
              actionHref: '/prestataire/messagerie', searchTerms: ['messages', 'messagerie', 'conversations'], emptyStateAction: "Accepter une demande",
            },
            {
              icon: TrendingUp, label: "Taux de reponse", value: `${stats.taux_reponse}%`, subtitle: "Taux d'acceptation",
              description: stats.taux_reponse > 0 ? `${stats.taux_reponse}% acceptees` : "Aucune statistique",
              delay: 0.4, onClick: () => router.push('/prestataire/demandes-recues'), actionLabel: "Voir les statistiques",
              actionHref: '/prestataire/demandes-recues', searchTerms: ['taux', 'reponse', 'statistiques'],
              sparkline: [20, 35, 40, 30, 45, 50, stats.taux_reponse],
            }
          ]
            .filter(card => {
              if (!searchQuery) return true
              const query = searchQuery.toLowerCase()
              return card.label.toLowerCase().includes(query) || (card.subtitle && card.subtitle.toLowerCase().includes(query)) || card.searchTerms.some(term => term.toLowerCase().includes(query))
            })
            .map((card, index) => (
              <StatCard
                key={index}
                icon={card.icon}
                label={card.label}
                value={card.value}
                subtitle={card.subtitle}
                description={card.description}
                delay={card.delay}
                onClick={card.onClick}
                actionLabel={card.actionLabel}
                actionHref={card.actionHref}
                delta={card.delta}
                sparkline={card.sparkline}
                emptyStateAction={card.emptyStateAction}
                alert={card.alert}
              />
            ))}
        </div>

        {/* Activite recente */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Activite recente</h2>
            <p className="text-sm text-gray-500 mt-0.5">Dernieres actions sur votre compte</p>
          </div>
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
              <EmptyState title="Aucune activite recente" description="Vos dernieres actions apparaitront ici" />
            ) : (
              <div className="space-y-2">
                {recentActivities.map((activity, index) => (
                  <ActivityItem key={activity.id} icon={activity.icon} title={activity.title} time={activity.time} color={activity.color} onClick={activity.href ? () => router.push(activity.href) : undefined} delay={index * 0.05} />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Grille 2 colonnes: Agenda et Demandes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <AgendaPreview />
          <PendingRequests />
        </div>

        {/* Performance du mois */}
        <MonthlyPerformance />

        {/* Parrainage */}
        {referralCode && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 }}
            className="bg-gradient-to-r from-[#823F91]/5 via-purple-50 to-[#9D5FA8]/5 rounded-2xl border border-[#823F91]/10 overflow-hidden">
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#823F91]/10 rounded-xl"><Gift className="h-5 w-5 text-[#823F91]" /></div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Parrainez des prestataires</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Partagez votre code et gagnez des avantages
                    {referralCount > 0 && <span className="ml-1 text-[#823F91] font-medium">{referralCount} filleul{referralCount > 1 ? 's' : ''}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 bg-white rounded-xl border border-[#823F91]/20 font-mono text-sm font-bold text-[#823F91] tracking-wider">{referralCode}</div>
                <button
                  onClick={() => { navigator.clipboard.writeText(referralCode); setReferralCopied(true); toast.success('Code copie !'); setTimeout(() => setReferralCopied(false), 2000) }}
                  className={cn('p-2.5 rounded-xl transition-all min-w-[40px] min-h-[40px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/40', referralCopied ? 'bg-green-100 text-green-600' : 'bg-[#823F91]/10 text-[#823F91] hover:bg-[#823F91]/20')}
                  title="Copier le code"
                >
                  {referralCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
