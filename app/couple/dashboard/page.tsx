'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Heart,
  Wallet,
  Calendar,
  ArrowRight,
  FileText,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { getCached, setCached } from '@/lib/cache'
import { UpcomingTasksCouple } from '@/components/dashboard/UpcomingTasksCouple'
import { RecentActivityCouple } from '@/components/dashboard/RecentActivityCouple'
import { QuickActionsCouple } from '@/components/dashboard/QuickActionsCouple'
import { UpcomingPaymentsWidget } from '@/components/dashboard/UpcomingPaymentsWidget'
import { NextProgramWidget } from '@/components/dashboard/NextProgramWidget'

export default function CoupleDashboardPage() {
  const router = useRouter()
  const { user } = useUser()
  const [coupleData, setCoupleData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [budgetTotal, setBudgetTotal] = useState(0)
  const [budgetItems, setBudgetItems] = useState<any[]>([])
  const [shortlistedCount, setShortlistedCount] = useState(0)
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    if (!user) return

    const CACHE_KEY = `couple-dashboard-${user.id}`

    const fetchDashboardData = async (skipCache = false) => {
      // Serve cached data instantly on revisit
      if (!skipCache) {
        const cached = getCached<{
          coupleData: any
          favoritesCount: number
          budgetTotal: number
          budgetItems: any[]
          shortlistedCount: number
          recentActivities: any[]
        }>(CACHE_KEY)
        if (cached) {
          setCoupleData(cached.coupleData)
          setBudgetTotal(cached.budgetTotal)
          setFavoritesCount(cached.favoritesCount)
          setBudgetItems(cached.budgetItems)
          setShortlistedCount(cached.shortlistedCount)
          setRecentActivities(cached.recentActivities)
          setLoading(false)
          // Background refresh after serving cache
          fetchDashboardData(true)
          return
        }
      }

      try {
        const supabase = createClient()

        // Fetch all data in parallel
        const [coupleResult, favoritesResult, budgetResult, requestsResult, shortlistedResult] = await Promise.all([
          supabase
            .from('couples')
            .select('id, partner_1_name, partner_2_name, wedding_date, budget_total, avatar_url')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('favoris')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('budget_items')
            .select('id, category, amount, paid')
            .eq('user_id', user.id),
          supabase
            .from('requests')
            .select('id, created_at, status, provider_id')
            .eq('couple_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('requests')
            .select('id', { count: 'exact', head: true })
            .eq('couple_id', user.id)
            .in('status', ['pending', 'accepted']),
        ])

        if (coupleResult.data) {
          setCoupleData(coupleResult.data)
          setBudgetTotal(coupleResult.data.budget_total || 0)
        }

        setFavoritesCount(favoritesResult.count || 0)
        setShortlistedCount(shortlistedResult.count || 0)

        if (budgetResult.data) {
          setBudgetItems(budgetResult.data)
        }

        // Build recent activities from requests
        if (requestsResult.data) {
          const activities = requestsResult.data.map((req: any) => ({
            id: req.id,
            type: req.status === 'accepted' ? 'contact' : 'request',
            title: req.status === 'accepted' ? 'Demande acceptee' : req.status === 'pending' ? 'Demande en attente' : 'Demande envoyee',
            time: formatRelativeTime(req.created_at),
            icon: req.status === 'accepted' ? CheckCircle2 : Clock,
            color: req.status === 'accepted' ? 'text-emerald-500' : 'text-[#823F91]',
            href: '/couple/demandes',
          }))
          setRecentActivities(activities.slice(0, 5))
        }

        // Persist to cache for instant reload next time
        const cData = coupleResult.data
        const bItems = budgetResult.data || []
        const acts = requestsResult.data
          ? requestsResult.data.map((req: any) => ({
              id: req.id,
              type: req.status === 'accepted' ? 'contact' : 'request',
              title: req.status === 'accepted' ? 'Demande acceptee' : req.status === 'pending' ? 'Demande en attente' : 'Demande envoyee',
              time: formatRelativeTime(req.created_at),
              icon: req.status === 'accepted' ? CheckCircle2 : Clock,
              color: req.status === 'accepted' ? 'text-emerald-500' : 'text-[#823F91]',
              href: '/couple/demandes',
            })).slice(0, 5)
          : []
        setCached(CACHE_KEY, {
          coupleData: cData,
          budgetTotal: cData?.budget_total || 0,
          favoritesCount: favoritesResult.count || 0,
          budgetItems: bItems,
          shortlistedCount: shortlistedResult.count || 0,
          recentActivities: acts,
        })
      } catch (err: any) {
        console.error('Erreur chargement dashboard couple:', err)
        const isNetwork = err?.message?.includes('fetch') || err?.message?.includes('network') || err?.message?.includes('timeout')
        if (isNetwork) {
          setError('Erreur de connexion. Verifiez votre connexion internet.')
        } else {
          setError(null) // Erreurs non-réseau : afficher le dashboard avec des données vides
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
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

  // Compute days until wedding
  const daysUntilWedding = useMemo(() => {
    if (!coupleData?.wedding_date) return null
    const weddingDate = new Date(coupleData.wedding_date)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    weddingDate.setHours(0, 0, 0, 0)
    const diff = Math.ceil((weddingDate.getTime() - now.getTime()) / 86400000)
    return diff > 0 ? diff : null
  }, [coupleData?.wedding_date])

  // Budget breakdown
  const budgetSpent = useMemo(() => {
    return budgetItems.reduce((sum, item) => sum + (item.paid ? item.amount : 0), 0)
  }, [budgetItems])
  const budgetRemaining = budgetTotal - budgetSpent

  // Greeting
  const greeting = coupleData?.partner_1_name
    ? coupleData?.partner_2_name
      ? `Bonjour ${coupleData.partner_1_name} & ${coupleData.partner_2_name}`
      : `Bonjour ${coupleData.partner_1_name}`
    : 'Bienvenue'

  // Planning progress (based on key milestones)
  const planningProgress = useMemo(() => {
    let completed = 0
    const total = 4
    if (coupleData?.wedding_date) completed++
    if (budgetTotal > 0) completed++
    if (shortlistedCount > 0) completed++
    if (favoritesCount > 0) completed++
    return { completed, total, percentage: Math.round((completed / total) * 100) }
  }, [coupleData?.wedding_date, budgetTotal, shortlistedCount, favoritesCount])

  // Next actions for couple
  const nextActions: { text: string; cta: string; href: string }[] = []
  if (!coupleData?.wedding_date) {
    nextActions.push({ text: "Definissez votre date de mariage pour debloquer le compteur", cta: 'Ajouter la date', href: '/couple/profil' })
  }
  if (favoritesCount === 0) {
    nextActions.push({ text: "Commencez a chercher des prestataires pour votre mariage", cta: 'Rechercher', href: '/couple/recherche' })
  }
  if (shortlistedCount > 0) {
    nextActions.push({ text: `${shortlistedCount} demande${shortlistedCount > 1 ? 's' : ''} en cours avec des prestataires`, cta: 'Voir les demandes', href: '/couple/demandes' })
  }

  if (loading) {
    return (
      <div className="w-full space-y-5 sm:space-y-6">
        {/* Skeleton header */}
        <div className="h-8 w-64 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-4 w-48 bg-gray-100 rounded-lg animate-pulse" />
        {/* Skeleton stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
        {/* Skeleton sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 px-4">
        <div className="p-3 bg-red-50 rounded-2xl mb-4">
          <Zap className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
        <p className="text-sm text-gray-500 mb-6 text-center max-w-md">{error}</p>
        <button
          onClick={() => { setError(null); setLoading(true); window.location.reload() }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#823F91] text-white text-sm font-medium rounded-xl hover:bg-[#5C2B66] transition-colors"
        >
          Reessayer
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="w-full space-y-6 sm:space-y-8">

        {/* Hero: greeting + period filters */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F5F0F7] via-white to-[#E8D4EF]/30 border border-[#823F91]/8 p-5 sm:p-7"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-[#823F91]/50 mb-1.5">Tableau de bord</p>
              <h1 className="text-2xl sm:text-[32px] font-extrabold text-gray-900 tracking-tight leading-tight">
                {greeting}
              </h1>
              <p className="text-sm sm:text-[15px] text-gray-500 mt-1.5 leading-relaxed">
                {coupleData?.wedding_date
                  ? `Mariage prevu le ${new Date(coupleData.wedding_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                  : 'Organisez votre mariage en toute simplicite'
                }
              </p>
              <div className="flex items-center flex-wrap gap-2.5 mt-3">
                {daysUntilWedding && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#823F91]/10 rounded-full">
                    <Calendar className="h-3.5 w-3.5 text-[#823F91]" />
                    <span className="text-sm font-bold text-[#823F91]">J-{daysUntilWedding}</span>
                    <span className="text-xs text-[#823F91]/60">avant le jour J</span>
                  </div>
                )}
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-white/60 border border-gray-100 rounded-full">
                  <span className="text-xs font-semibold text-gray-500">Preparation</span>
                  <div className="w-16 sm:w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#823F91] to-[#9D5FA8] rounded-full transition-all duration-500"
                      style={{ width: `${planningProgress.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#823F91]">{planningProgress.completed}/{planningProgress.total}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative circle */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#823F91]/[0.04] pointer-events-none" />
          <div className="absolute -bottom-8 -right-4 w-24 h-24 rounded-full bg-[#823F91]/[0.03] pointer-events-none" />
        </motion.div>

        {/* Next best action */}
        {nextActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.05 }}
            className="p-4 sm:p-5 bg-gradient-to-br from-[#F5F0F7] to-[#E8D4EF]/30 border border-[#823F91]/10 rounded-2xl"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 bg-[#823F91]/10 rounded-xl flex-shrink-0">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-[#823F91]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#823F91]/60 mb-0.5">Prochaine action</p>
                <p className="text-sm sm:text-[15px] font-semibold text-gray-800 leading-snug">{nextActions[0].text}</p>
              </div>
              <button
                onClick={() => router.push(nextActions[0].href)}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-[#823F91] hover:bg-[#5C2B66] rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/40"
                >
                  {nextActions[0].cta} <ArrowRight className="h-3.5 w-3.5" />
                </button>
            </div>
          </motion.div>
        )}

        {/* Stats Grid — 4 KPI cards */}
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight mb-3 sm:mb-4">Vos indicateurs</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full items-stretch">

            {/* Prestataires shortlistes */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => router.push('/couple/recherche')}
              className="cursor-pointer group"
            >
              <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)] hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.06),0_2px_4px_-2px_rgb(0_0_0/0.04)] hover:border-[#823F91]/15 transition-all duration-150 p-4 sm:p-5 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-[#823F91]/8 flex items-center justify-center flex-shrink-0">
                    <Heart className="h-[18px] w-[18px] sm:h-5 sm:w-5 text-[#823F91]" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#823F91] group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-[13px] font-semibold text-gray-500 mb-1">Prestataires</p>
                  <p className="text-[28px] sm:text-[34px] font-extrabold tracking-tight leading-none tabular-nums text-gray-900">
                    {favoritesCount === 0 ? '0' : favoritesCount}
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-400 mt-1.5">
                    {favoritesCount > 0 ? 'Dans vos favoris' : 'Aucun favori'}
                  </p>
                  {favoritesCount === 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#823F91] mt-2">
                      <Search className="h-3 w-3" /> Rechercher
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Budget */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => router.push('/couple/budget')}
              className="cursor-pointer group"
            >
              <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)] hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.06),0_2px_4px_-2px_rgb(0_0_0/0.04)] hover:border-[#823F91]/15 transition-all duration-150 p-4 sm:p-5 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-[#823F91]/8 flex items-center justify-center flex-shrink-0">
                    <Wallet className="h-[18px] w-[18px] sm:h-5 sm:w-5 text-[#823F91]" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#823F91] group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-[13px] font-semibold text-gray-500 mb-1">Budget</p>
                  <p className="text-[28px] sm:text-[34px] font-extrabold tracking-tight leading-none tabular-nums text-gray-900">
                    {budgetTotal > 0 ? `${(budgetTotal / 1000).toFixed(0)}k` : '0'}
                  </p>
                  {budgetTotal > 0 ? (
                    <>
                      <p className="text-[11px] sm:text-xs text-gray-400 mt-1.5">{budgetTotal.toLocaleString('fr-FR')} &euro; total</p>
                      <div className="mt-2.5 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#823F91] to-[#9D5FA8] rounded-full transition-all"
                          style={{ width: `${Math.min((budgetSpent / budgetTotal) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 hidden sm:block">
                        {budgetRemaining > 0 ? `${budgetRemaining.toLocaleString('fr-FR')} restant` : 'Budget depense'}
                      </p>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#823F91] mt-2">
                      <Zap className="h-3 w-3" /> Definir un budget
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Jours restants */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.11, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => router.push('/couple/timeline')}
              className="cursor-pointer group"
            >
              <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)] hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.06),0_2px_4px_-2px_rgb(0_0_0/0.04)] hover:border-[#823F91]/15 transition-all duration-150 p-4 sm:p-5 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-[#823F91]/8 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-[18px] w-[18px] sm:h-5 sm:w-5 text-[#823F91]" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#823F91] group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-[13px] font-semibold text-gray-500 mb-1">Jours restants</p>
                  <p className="text-[28px] sm:text-[34px] font-extrabold tracking-tight leading-none tabular-nums text-gray-900">
                    {daysUntilWedding ?? '—'}
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-400 mt-1.5">
                    {daysUntilWedding ? 'Avant le mariage' : 'Date non definie'}
                  </p>
                  {!daysUntilWedding && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#823F91] mt-2">
                      <Zap className="h-3 w-3" /> Definir la date
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Demandes actives */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => router.push('/couple/demandes')}
              className="cursor-pointer group"
            >
              <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)] hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.06),0_2px_4px_-2px_rgb(0_0_0/0.04)] hover:border-[#823F91]/15 transition-all duration-150 p-4 sm:p-5 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-[#823F91]/8 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-[18px] w-[18px] sm:h-5 sm:w-5 text-[#823F91]" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#823F91] group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-[13px] font-semibold text-gray-500 mb-1">Demandes actives</p>
                  <p className="text-[28px] sm:text-[34px] font-extrabold tracking-tight leading-none tabular-nums text-gray-900">
                    {shortlistedCount === 0 ? '0' : shortlistedCount}
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-400 mt-1.5">
                    {shortlistedCount > 0 ? `En cours avec des prestataires` : 'Aucune demande'}
                  </p>
                  {shortlistedCount === 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#823F91] mt-2">
                      <Sparkles className="h-3 w-3" /> Envoyer une demande
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Quick actions */}
        <QuickActionsCouple />

        {/* Upcoming deadlines widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UpcomingPaymentsWidget coupleId={coupleData?.id} />
          <NextProgramWidget coupleId={coupleData?.id} weddingDate={coupleData?.wedding_date} />
        </div>

        {/* Tasks and Activity side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <UpcomingTasksCouple coupleId={coupleData?.id} weddingDate={coupleData?.wedding_date} />
          <RecentActivityCouple activities={recentActivities} />
        </div>
      </div>
    </div>
  )
}
