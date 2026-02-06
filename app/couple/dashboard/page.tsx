'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Wallet,
  Calendar,
  TrendingUp,
  ArrowRight,
  FileText,
  Heart,
  RefreshCw,
  MessageSquare,
  XCircle,
} from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { SkeletonCard } from '@/components/dashboard/SkeletonCard'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { UpcomingTasksCouple } from '@/components/dashboard/UpcomingTasksCouple'
import { RecentActivityCouple } from '@/components/dashboard/RecentActivityCouple'
import { QuickActionsCouple } from '@/components/dashboard/QuickActionsCouple'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface BudgetItem {
  id: string
  category: string
  amount: number
}

// Formatage du temps relatif
function formatRelativeTime(dateString: string) {
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

export default function CoupleDashboardPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [stats, setStats] = useState({
    prestatairesTrouves: 0,
    budgetAlloue: 0,
    joursRestants: null as number | null,
    messagesNonLus: 0,
  })
  const [coupleProfile, setCoupleProfile] = useState<any>(null)
  const [prenom, setPrenom] = useState('')
  const [statsLoading, setStatsLoading] = useState(true)
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [requestsSentCount, setRequestsSentCount] = useState(0)
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  const CHART_COLORS = [
    '#823F91', '#9D5FA8', '#B87FC0', '#D49FFD', '#E8C4F5',
    '#6D3478', '#A855F7', '#C084FC', '#DDA0DD', '#E9D5F5'
  ]

  useEffect(() => {
    if (!user) return

    const fetchDashboardData = async () => {
      const supabase = createClient()

      try {
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (coupleError) {
          console.error('Erreur couple:', coupleError.message)
          setStatsLoading(false)
          return
        }

        if (coupleData) {
          if (coupleData.partner_1_name) {
            const nameParts = coupleData.partner_1_name.trim().split(/\s+/)
            setPrenom(nameParts[0] || '')
          }

          setCoupleProfile(coupleData)

          let joursRestants = null
          if (coupleData.wedding_date) {
            const dateMariage = new Date(coupleData.wedding_date)
            const aujourdhui = new Date()
            const diff = dateMariage.getTime() - aujourdhui.getTime()
            joursRestants = Math.ceil(diff / (1000 * 60 * 60 * 24))
          }

          const [
            { count: favorisCount },
            { data: budgetItemsData },
            { count: requestsCount },
            { data: recentRequestsData },
            { data: recentFavorisData },
          ] = await Promise.all([
            supabase
              .from('favoris')
              .select('id', { count: 'exact', head: true })
              .eq('couple_id', coupleData.id),
            supabase
              .from('budget_items')
              .select('id, category, amount')
              .eq('couple_id', user.id),
            supabase
              .from('requests')
              .select('id', { count: 'exact', head: true })
              .eq('couple_id', user.id),
            supabase
              .from('requests')
              .select('id, created_at, status, provider_id')
              .eq('couple_id', user.id)
              .order('created_at', { ascending: false })
              .limit(5),
            supabase
              .from('favoris')
              .select('id, created_at')
              .eq('couple_id', coupleData.id)
              .order('created_at', { ascending: false })
              .limit(5),
          ])

          // Recuperer les noms des prestataires pour les demandes recentes
          let providerNames: Record<string, string> = {}
          if (recentRequestsData && recentRequestsData.length > 0) {
            const providerIds = [...new Set(recentRequestsData.map((r: any) => r.provider_id).filter(Boolean))]
            if (providerIds.length > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, prenom, nom, business_name')
                .in('id', providerIds)
              if (profiles) {
                profiles.forEach((p: any) => {
                  providerNames[p.id] = p.business_name || [p.prenom, p.nom].filter(Boolean).join(' ') || 'Prestataire'
                })
              }
            }
          }

          if (budgetItemsData) {
            setBudgetItems(budgetItemsData)
          }

          setRequestsSentCount(requestsCount || 0)

          // Construire le fil d'activites a partir des donnees reelles
          const activities: any[] = []

          if (recentRequestsData) {
            recentRequestsData.forEach((req: any) => {
              const providerName = providerNames[req.provider_id] || 'un prestataire'

              // Label, icone et lien adaptes au statut reel
              let title: string
              let icon = FileText
              let href = '/couple/demandes'
              let color = 'text-[#823F91]'

              switch (req.status) {
                case 'accepted':
                  title = `Conversation ouverte avec ${providerName}`
                  icon = MessageSquare
                  href = '/couple/messagerie'
                  break
                case 'rejected':
                  title = `Demande refusee par ${providerName}`
                  icon = XCircle
                  color = 'text-gray-500'
                  break
                case 'cancelled':
                  title = `Demande annulee - ${providerName}`
                  icon = XCircle
                  color = 'text-gray-500'
                  break
                default:
                  title = `Demande envoyee a ${providerName}`
                  icon = FileText
                  break
              }

              activities.push({
                id: `req-${req.id}`,
                type: 'request',
                title,
                time: formatRelativeTime(req.created_at),
                createdAt: req.created_at,
                icon,
                color,
                href,
              })
            })
          }

          if (recentFavorisData) {
            recentFavorisData.forEach((fav: any) => {
              activities.push({
                id: `fav-${fav.id}`,
                type: 'favorite',
                title: 'Prestataire ajoute aux favoris',
                time: formatRelativeTime(fav.created_at),
                createdAt: fav.created_at,
                icon: Heart,
                color: 'text-[#823F91]',
                href: '/couple/recherche',
              })
            })
          }

          activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          setRecentActivities(activities.slice(0, 5))

          const budgetTotal = coupleData.budget_total || coupleData.budget_max || coupleData.budget_min || 0

          setStats({
            prestatairesTrouves: favorisCount || 0,
            budgetAlloue: budgetTotal,
            joursRestants,
            messagesNonLus: 0,
          })

          setLastUpdated(new Date())
        }
        setStatsLoading(false)
      } catch (error: any) {
        console.error('Erreur chargement dashboard:', error?.message)
        setStatsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  // Taches d'onboarding calculees a partir des donnees reelles du profil
  const onboardingTasks = useMemo(() => {
    if (!coupleProfile) return []
    return [
      {
        id: 1,
        title: 'Definir la date du mariage',
        dueDate: 'Profil',
        completed: !!coupleProfile.wedding_date,
        priority: 'high' as const,
        href: '/couple/profil',
      },
      {
        id: 2,
        title: 'Configurer votre budget',
        dueDate: 'Budget',
        completed: stats.budgetAlloue > 0,
        priority: 'high' as const,
        href: '/couple/budget',
      },
      {
        id: 3,
        title: 'Rechercher des prestataires',
        dueDate: 'Recherche',
        completed: stats.prestatairesTrouves > 0,
        priority: 'medium' as const,
        href: '/couple/recherche',
      },
      {
        id: 4,
        title: 'Envoyer une premiere demande',
        dueDate: 'Demandes',
        completed: requestsSentCount > 0,
        priority: 'medium' as const,
        href: '/couple/demandes',
      },
      {
        id: 5,
        title: 'Completer les informations du couple',
        dueDate: 'Profil',
        completed: !!coupleProfile.partner_1_name && !!coupleProfile.partner_2_name,
        priority: 'low' as const,
        href: '/couple/profil',
      },
    ]
  }, [coupleProfile, stats, requestsSentCount])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <p className="text-muted-foreground">Chargement...</p>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    router.push('/sign-in')
    return null
  }

  // Donnees du camembert budget
  const chartData = budgetItems.reduce((acc, item) => {
    const existing = acc.find(d => d.name === item.category)
    if (existing) {
      existing.value += item.amount
    } else {
      acc.push({ name: item.category, value: item.amount })
    }
    return acc
  }, [] as { name: string; value: number }[])
    .sort((a, b) => b.value - a.value)

  return (
    <div className="w-full">
      <div className="w-full space-y-5 sm:space-y-6">

        {/* Header : Greeting personnalise */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start justify-between"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Bonjour{prenom ? ` ${prenom}` : ''}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {stats.joursRestants !== null && stats.joursRestants > 0
                ? `J-${stats.joursRestants} avant le grand jour`
                : 'Vue d\'ensemble de vos preparatifs'}
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

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full items-stretch">
          {statsLoading ? (
            <>
              <SkeletonCard delay={0.1} />
              <SkeletonCard delay={0.2} />
              <SkeletonCard delay={0.3} />
            </>
          ) : (
            [
              {
                icon: TrendingUp,
                label: "Prestataires",
                value: stats.prestatairesTrouves,
                subtitle: "Dans vos favoris",
                description: `${stats.prestatairesTrouves} prestataire${stats.prestatairesTrouves > 1 ? 's' : ''} sauvegarde${stats.prestatairesTrouves > 1 ? 's' : ''}`,
                onClick: () => router.push('/couple/recherche'),
                actionLabel: "Voir les favoris",
                delay: 0.1,
              },
              {
                icon: Wallet,
                label: "Budget",
                value: `${stats.budgetAlloue > 0 ? stats.budgetAlloue.toLocaleString('fr-FR') : '0'} \u20AC`,
                subtitle: "Budget total",
                description: `${stats.budgetAlloue > 0 ? stats.budgetAlloue.toLocaleString('fr-FR') : '0'} \u20AC alloues`,
                onClick: () => router.push('/couple/budget'),
                actionLabel: "Gerer",
                delay: 0.2,
                isBudgetCard: true,
              },
              {
                icon: Calendar,
                label: "Jours restants",
                value: stats.joursRestants !== null ? stats.joursRestants : '-',
                subtitle: "Avant le mariage",
                description: stats.joursRestants !== null && stats.joursRestants > 0
                  ? `${stats.joursRestants} jour${stats.joursRestants > 1 ? 's' : ''} restant${stats.joursRestants > 1 ? 's' : ''}`
                  : "Date non definie",
                onClick: () => router.push('/couple/profil'),
                actionLabel: "Modifier",
                delay: 0.3,
              },
            ].map((card) => {
              const Icon = card.icon
              const isBudget = 'isBudgetCard' in card && card.isBudgetCard

              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: card.delay, ease: [0.16, 1, 0.3, 1] }}
                  className="relative bg-white rounded-2xl transition-all duration-300 ease-out overflow-hidden group cursor-pointer border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200"
                  onClick={card.onClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') card.onClick() }}
                >
                  <div className="p-4 sm:p-5 space-y-3 flex flex-col flex-1">
                    {/* Header: Icon + Label */}
                    <div className="flex items-center gap-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex-shrink-0 bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center shadow-sm cursor-help">
                            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-900 text-white border-gray-700">
                          <p className="text-xs">{card.description}</p>
                        </TooltipContent>
                      </Tooltip>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {card.label}
                      </p>
                    </div>

                    {/* Main Value + mini chart budget */}
                    <div className="space-y-1 relative">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: card.delay + 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex-1">
                          {typeof card.value === 'number' ? (
                            <motion.p
                              className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-none"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.5, delay: card.delay + 0.2 }}
                            >
                              {card.value}
                            </motion.p>
                          ) : (
                            <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
                              {card.value}
                            </p>
                          )}
                        </div>

                        {/* Mini camembert pour Budget - visible sur tous les ecrans */}
                        {isBudget && chartData.length > 0 && (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={chartData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius="35%"
                                  outerRadius="95%"
                                  dataKey="value"
                                  strokeWidth={0}
                                >
                                  {chartData.map((_, i) => (
                                    <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </motion.div>

                      {card.subtitle && (
                        <p className="text-xs sm:text-sm text-gray-600">
                          {card.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Action button */}
                    {card.actionLabel && (
                      <div className="pt-2 mt-auto">
                        <span className="w-full flex items-center justify-between text-xs font-semibold text-[#823F91] hover:text-[#6D3478] transition-colors group/btn">
                          <span className="group-hover/btn:underline">{card.actionLabel}</span>
                          <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </div>

        {/* Grille 2 colonnes : Preparatifs (onboarding) + Activite recente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <UpcomingTasksCouple tasks={onboardingTasks} />
          <RecentActivityCouple activities={recentActivities} />
        </div>

        {/* Actions rapides */}
        <QuickActionsCouple />
      </div>
    </div>
  )
}
