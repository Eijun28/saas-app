'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Heart,
  Wallet,
  Calendar,
  ArrowRight,
  MessageSquare,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { UpcomingTasksCouple } from '@/components/dashboard/UpcomingTasksCouple'
import { RecentActivityCouple } from '@/components/dashboard/RecentActivityCouple'
import { QuickActionsCouple } from '@/components/dashboard/QuickActionsCouple'
import { cn } from '@/lib/utils'

type PeriodFilter = '7d' | '30d' | 'month'

export default function CoupleDashboardPage() {
  const router = useRouter()
  const { user } = useUser()
  const [coupleData, setCoupleData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [budgetTotal, setBudgetTotal] = useState(0)
  const [budgetItems, setBudgetItems] = useState<any[]>([])
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [shortlistedCount, setShortlistedCount] = useState(0)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('30d')
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    if (!user) return

    const fetchDashboardData = async () => {
      try {
        const supabase = createClient()

        // Fetch all data in parallel
        const [coupleResult, favoritesResult, budgetResult, requestsResult] = await Promise.all([
          supabase
            .from('couples')
            .select('partner_1_name, partner_2_name, wedding_date, budget_total, avatar_url')
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
        ])

        if (coupleResult.data) {
          setCoupleData(coupleResult.data)
          setBudgetTotal(coupleResult.data.budget_total || 0)
        }

        setFavoritesCount(favoritesResult.count || 0)
        setShortlistedCount(favoritesResult.count || 0)

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

        // Fetch unread messages count
        try {
          const { count: msgCount } = await supabase
            .from('requests')
            .select('id', { count: 'exact', head: true })
            .eq('couple_id', user.id)
            .eq('status', 'accepted')
          setUnreadMessages(msgCount || 0)
        } catch {
          // silent
        }
      } catch (error) {
        console.error('Erreur chargement dashboard couple:', error)
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
    ? `Bonjour ${coupleData.partner_1_name}`
    : 'Bienvenue'

  // Next actions for couple
  const nextActions: { text: string; cta: string; href: string }[] = []
  if (!coupleData?.wedding_date) {
    nextActions.push({ text: "Definissez votre date de mariage pour debloquer le compteur", cta: 'Ajouter la date', href: '/couple/profil' })
  }
  if (favoritesCount === 0) {
    nextActions.push({ text: "Commencez a chercher des prestataires pour votre mariage", cta: 'Rechercher', href: '/couple/recherche' })
  }
  if (unreadMessages > 0) {
    nextActions.push({ text: `${unreadMessages} conversation${unreadMessages > 1 ? 's' : ''} avec des prestataires`, cta: 'Voir les messages', href: '/couple/messagerie' })
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
              {greeting}
              {daysUntilWedding && (
                <span className="ml-2 text-[16px] sm:text-[18px] font-semibold text-[#823F91]">
                  J-{daysUntilWedding}
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {coupleData?.wedding_date
                ? `Mariage prevu le ${new Date(coupleData.wedding_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                : 'Organisez votre mariage en toute simplicite'
              }
            </p>
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
          </div>
        </motion.div>

        {/* Next best action */}
        {nextActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
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

        {/* Stats Grid — 4 KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full items-stretch">

          {/* Prestataires shortlistes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => router.push('/couple/recherche')}
            className="cursor-pointer group"
          >
            <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)] hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.06),0_2px_4px_-2px_rgb(0_0_0/0.04)] hover:border-gray-200 transition-all duration-150 p-5 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-[#823F91]/8 flex items-center justify-center">
                  <Heart className="h-[18px] w-[18px] text-[#823F91]" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Prestataires</p>
              </div>
              <div className="flex-1">
                <p className="text-[32px] sm:text-[36px] font-bold tracking-tight leading-none tabular-nums text-gray-900">
                  {shortlistedCount === 0 ? '—' : shortlistedCount}
                </p>
                <p className="text-sm font-medium text-gray-500 mt-1">
                  {shortlistedCount > 0 ? 'Dans vos favoris' : 'Aucun favori'}
                </p>
                {shortlistedCount === 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#823F91] mt-2">
                    <Search className="h-3 w-3" /> Rechercher des prestataires
                  </span>
                )}
              </div>
              <div className="pt-3 mt-3 border-t border-gray-100">
                <span className="flex items-center justify-between text-xs font-semibold text-[#823F91] group-hover:text-[#5C2B66] transition-colors">
                  <span>Voir les favoris</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          </motion.div>

          {/* Budget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => router.push('/couple/budget')}
            className="cursor-pointer group"
          >
            <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)] hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.06),0_2px_4px_-2px_rgb(0_0_0/0.04)] hover:border-gray-200 transition-all duration-150 p-5 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-[#823F91]/8 flex items-center justify-center">
                  <Wallet className="h-[18px] w-[18px] text-[#823F91]" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Budget</p>
              </div>
              <div className="flex-1">
                <p className="text-[32px] sm:text-[36px] font-bold tracking-tight leading-none tabular-nums text-gray-900">
                  {budgetTotal > 0 ? `${(budgetTotal / 1000).toFixed(0)}k` : '—'}
                </p>
                {budgetTotal > 0 ? (
                  <>
                    <p className="text-sm font-medium text-gray-500 mt-1">Budget total {budgetTotal.toLocaleString('fr-FR')} &euro;</p>
                    {/* Mini budget bar */}
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#823F91] to-[#9D5FA8] rounded-full transition-all"
                        style={{ width: `${Math.min((budgetSpent / budgetTotal) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {budgetRemaining > 0 ? `${budgetRemaining.toLocaleString('fr-FR')} restant` : 'Budget depense'}
                    </p>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#823F91] mt-2">
                    <Zap className="h-3 w-3" /> Definir un budget
                  </span>
                )}
              </div>
              <div className="pt-3 mt-3 border-t border-gray-100">
                <span className="flex items-center justify-between text-xs font-semibold text-[#823F91] group-hover:text-[#5C2B66] transition-colors">
                  <span>Gerer le budget</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          </motion.div>

          {/* Jours restants */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => router.push('/couple/timeline')}
            className="cursor-pointer group"
          >
            <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)] hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.06),0_2px_4px_-2px_rgb(0_0_0/0.04)] hover:border-gray-200 transition-all duration-150 p-5 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-[#823F91]/8 flex items-center justify-center">
                  <Calendar className="h-[18px] w-[18px] text-[#823F91]" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Jours restants</p>
              </div>
              <div className="flex-1">
                <p className="text-[32px] sm:text-[36px] font-bold tracking-tight leading-none tabular-nums text-gray-900">
                  {daysUntilWedding ?? '—'}
                </p>
                <p className="text-sm font-medium text-gray-500 mt-1">
                  {daysUntilWedding ? 'Avant le mariage' : 'Date non definie'}
                </p>
                {!daysUntilWedding && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#823F91] mt-2">
                    <Zap className="h-3 w-3" /> Definir la date
                  </span>
                )}
              </div>
              <div className="pt-3 mt-3 border-t border-gray-100">
                <span className="flex items-center justify-between text-xs font-semibold text-[#823F91] group-hover:text-[#5C2B66] transition-colors">
                  <span>{daysUntilWedding ? 'Voir le calendrier' : 'Modifier le profil'}</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          </motion.div>

          {/* Messages / Conversations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => router.push('/couple/messagerie')}
            className="cursor-pointer group"
          >
            <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)] hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.06),0_2px_4px_-2px_rgb(0_0_0/0.04)] hover:border-gray-200 transition-all duration-150 p-5 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-[#823F91]/8 flex items-center justify-center">
                  <MessageSquare className="h-[18px] w-[18px] text-[#823F91]" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Messages</p>
              </div>
              <div className="flex-1">
                <p className="text-[32px] sm:text-[36px] font-bold tracking-tight leading-none tabular-nums text-gray-900">
                  {unreadMessages === 0 ? '—' : unreadMessages}
                </p>
                <p className="text-sm font-medium text-gray-500 mt-1">
                  {unreadMessages > 0 ? `Conversation${unreadMessages > 1 ? 's' : ''} active${unreadMessages > 1 ? 's' : ''}` : 'Aucun message'}
                </p>
                {unreadMessages === 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#823F91] mt-2">
                    <Sparkles className="h-3 w-3" /> Envoyer une demande
                  </span>
                )}
              </div>
              <div className="pt-3 mt-3 border-t border-gray-100">
                <span className="flex items-center justify-between text-xs font-semibold text-[#823F91] group-hover:text-[#5C2B66] transition-colors">
                  <span>Ouvrir la messagerie</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick actions */}
        <QuickActionsCouple />

        {/* Tasks and Activity side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <UpcomingTasksCouple />
          <RecentActivityCouple activities={recentActivities} />
        </div>
      </div>
    </div>
  )
}
