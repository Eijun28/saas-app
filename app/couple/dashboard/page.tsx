'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Wallet,
  MessageSquare,
  Calendar,
  TrendingUp,
  ArrowRight,
  FileText,
  Search,
  Info,
  Eye,
  EyeOff,
  Heart
} from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fadeInUp, counterAnimation } from '@/lib/animations'
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

// Wedding Countdown Component
function WeddingCountdown({ weddingDate }: { weddingDate: Date }) {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const diff = weddingDate.getTime() - now.getTime()

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setCountdown({ days, hours, minutes, seconds })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [weddingDate])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const countdownItems = [
    { value: countdown.days, label: 'Jours' },
    { value: countdown.hours, label: 'Heures' },
    { value: countdown.minutes, label: 'Minutes' },
    { value: countdown.seconds, label: 'Secondes' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#823F91] via-[#9D5FA8] to-[#B855D6] p-6 sm:p-8 shadow-xl"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Heart className="h-5 w-5 text-pink-200 animate-pulse" />
          <h2 className="text-lg sm:text-xl font-semibold text-white/90">
            Compte à rebours
          </h2>
          <Heart className="h-5 w-5 text-pink-200 animate-pulse" />
        </div>

        {/* Countdown boxes */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6">
          {countdownItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="relative"
            >
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/20">
                <motion.span
                  key={item.value}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="block text-2xl sm:text-4xl md:text-5xl font-bold text-white tabular-nums"
                >
                  {String(item.value).padStart(2, '0')}
                </motion.span>
                <span className="text-[10px] sm:text-xs uppercase tracking-wider text-white/70 mt-1 block">
                  {item.label}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Wedding date */}
        <div className="text-center">
          <p className="text-white/80 text-sm sm:text-base">
            <span className="text-white/60">Votre mariage le </span>
            <span className="font-semibold text-white capitalize">
              {formatDate(weddingDate)}
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  )
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
  const [nom, setNom] = useState('')
  const [statsLoading, setStatsLoading] = useState(true)
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [budgetVisible, setBudgetVisible] = useState(true)
  const [weddingDate, setWeddingDate] = useState<Date | null>(null)
  const [isHoveringBudget, setIsHoveringBudget] = useState(false)

  // Couleurs pour le camembert
  const CHART_COLORS = [
    '#823F91', '#9D5FA8', '#B87FC0', '#D49FFD', '#E8C4F5',
    '#6D3478', '#A855F7', '#C084FC', '#DDA0DD', '#E9D5F5'
  ]

  useEffect(() => {
    if (!user) return

    const fetchDashboardData = async () => {
      const supabase = createClient()
      
      
      try {
        // Récupérer les données du couple (sans relation inexistante)
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('*')
          .eq('user_id', user.id)
          .single()


        if (coupleError) {
          // #region agent log
          // Améliorer l'affichage de l'erreur avec toutes ses propriétés
          console.error('Erreur lors de la récupération du couple:', {
            message: coupleError.message,
            code: coupleError.code,
            details: coupleError.details,
            hint: coupleError.hint,
            fullError: coupleError
          })
          throw coupleError
        }

        if (coupleData) {
          // ✅ FIX: Afficher le nom complet tel quel au lieu d'essayer de le diviser
          // Le nom complet sera affiché dans le header du profil
          if (coupleData.partner_1_name) {
            // Pour l'affichage dans le dashboard, utiliser le nom complet
            const fullName = coupleData.partner_1_name
            // Essayer d'extraire le prénom (premier mot) pour l'affichage si nécessaire
            const nameParts = fullName.trim().split(/\s+/)
            setPrenom(nameParts[0] || '')
            setNom(nameParts.slice(1).join(' ') || '')
          }

          setCoupleProfile(coupleData)

          // Calculer les jours restants
          let joursRestants = null
          if (coupleData.wedding_date) {
            const dateMariage = new Date(coupleData.wedding_date)
            setWeddingDate(dateMariage)
            const aujourdhui = new Date()
            const diff = dateMariage.getTime() - aujourdhui.getTime()
            joursRestants = Math.ceil(diff / (1000 * 60 * 60 * 24))
          }

          // Compter les favoris (depuis la relation ou requête séparée si nécessaire)
          // Note: favoris.couple_id référence couples.id, pas user.id
          const { count: favorisCount, error: favorisError } = await supabase
            .from('favoris')
            .select('id', { count: 'exact', head: true })
            .eq('couple_id', coupleData.id)

          if (favorisError) {
            console.error('Erreur lors du comptage des favoris:', favorisError)
          }

          // Messages désactivés temporairement
          const messagesNonLus = 0

          // Calculer le budget total de la même manière que dans la page budget
          const budgetTotal = coupleData.budget_total || coupleData.budget_max || coupleData.budget_min || 0

          // Charger les items de budget pour le camembert
          const { data: budgetItemsData } = await supabase
            .from('budget_items')
            .select('id, category, amount')
            .eq('couple_id', user.id)

          if (budgetItemsData) {
            setBudgetItems(budgetItemsData)
          }

          setStats({
            prestatairesTrouves: favorisCount || 0,
            budgetAlloue: budgetTotal,
            joursRestants,
            messagesNonLus,
          })
        }
        setStatsLoading(false)
      } catch (error: any) {
        // Améliorer l'affichage de l'erreur avec toutes ses propriétés
        console.error('Erreur chargement dashboard:', {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          fullError: error
        })
        // Ne pas bloquer l'UI, les stats resteront à leurs valeurs par défaut
        setStatsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

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

  // Calculer les données du camembert par catégorie
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

  const totalSpent = budgetItems.reduce((sum, item) => sum + item.amount, 0)

  // Sections principales - uniquement celles qui ne sont pas dans les actions rapides
  const sections = [
    {
      title: 'Demandes & Devis',
      description: 'Gérez vos demandes et devis reçus',
      icon: FileText,
      href: '/couple/demandes',
    },
    {
      title: 'Profil',
      description: 'Modifiez vos informations personnelles et de mariage',
      icon: Calendar,
      href: '/couple/profil',
    },
  ]

  return (
    <div className="w-full">
      <div className="w-full space-y-4 sm:space-y-5">
        {/* Statistiques rapides - Compact */}
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
                description: `${stats.prestatairesTrouves} prestataire${stats.prestatairesTrouves > 1 ? 's' : ''} sauvegardé${stats.prestatairesTrouves > 1 ? 's' : ''}`,
                onClick: () => router.push('/couple/recherche'),
                actionLabel: "Voir les favoris",
                delay: 0.1,
              },
              {
                icon: Wallet,
                label: "Budget",
                value: `${stats.budgetAlloue > 0 ? stats.budgetAlloue.toLocaleString('fr-FR') : '0'} €`,
                subtitle: "Budget total",
                description: `${stats.budgetAlloue > 0 ? stats.budgetAlloue.toLocaleString('fr-FR') : '0'} € alloués`,
                onClick: () => router.push('/couple/budget'),
                actionLabel: "Gérer",
                delay: 0.2,
              },
              {
                icon: Calendar,
                label: "Jours restants",
                value: stats.joursRestants !== null ? stats.joursRestants : '-',
                subtitle: "Avant le mariage",
                description: stats.joursRestants !== null && stats.joursRestants > 0
                  ? `${stats.joursRestants} jour${stats.joursRestants > 1 ? 's' : ''} restant${stats.joursRestants > 1 ? 's' : ''}`
                  : "Date non définie",
                onClick: () => router.push('/couple/profil'),
                actionLabel: "Modifier",
                delay: 0.3,
              },
            ].map((card, index) => {
              const Icon = card.icon
              const isBudgetCard = card.label === "Budget"

              return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: card.delay, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-white rounded-xl transition-all duration-300 ease-out overflow-hidden group cursor-pointer border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
                onClick={isBudgetCard ? undefined : card.onClick}
                onMouseEnter={() => isBudgetCard && setIsHoveringBudget(true)}
                onMouseLeave={() => isBudgetCard && setIsHoveringBudget(false)}
              >
                <div className="p-4 sm:p-5 space-y-3 flex flex-col flex-1">
                  {/* Header: Icon + Label */}
                  <div className="flex items-center gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg flex-shrink-0 bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center shadow-sm cursor-help"
                        >
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-900 text-white border-gray-700">
                        <p className="text-xs">{card.description}</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {card.label}
                      </p>
                    </div>
                    {/* Toggle visibility button for Budget card - appears on hover */}
                    {isBudgetCard && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isHoveringBudget ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setBudgetVisible(!budgetVisible)
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title={budgetVisible ? "Masquer le budget" : "Afficher le budget"}
                      >
                        {budgetVisible ? (
                          <Eye className="h-4 w-4 text-gray-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        )}
                      </motion.button>
                    )}
                  </div>

                  {/* Main Value + Subtitle ou Camembert pour Budget */}
                  <div className="space-y-1 relative" onClick={isBudgetCard ? card.onClick : undefined}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: card.delay + 0.1 }}
                      className="flex items-center gap-3"
                    >
                      {/* Montant */}
                      <div className="flex-1">
                        {isBudgetCard ? (
                          <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
                            {budgetVisible ? card.value : '••••• €'}
                          </p>
                        ) : typeof card.value === 'number' ? (
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

                      {/* Mini camembert pour Budget (toujours visible si données) */}
                      {isBudgetCard && chartData.length > 0 && budgetVisible && (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 hidden sm:block">
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
                                {chartData.map((entry, i) => (
                                  <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </motion.div>

                    {/* Subtitle */}
                    {card.subtitle && (
                      <p className="text-xs sm:text-sm text-gray-600">
                        {card.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Action button - compact */}
                  {card.actionLabel && (
                    <div className="pt-2 mt-auto">
                      <button
                        onClick={isBudgetCard ? card.onClick : undefined}
                        className="w-full flex items-center justify-between text-xs font-semibold text-[#823F91] hover:text-[#6D3478] transition-colors group/btn"
                      >
                        <span className="group-hover/btn:underline">{card.actionLabel}</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  )}

                </div>
              </motion.div>
            )
          })
          )}
        </div>

        {/* Wedding Countdown - Beautiful UI */}
        {weddingDate && stats.joursRestants !== null && stats.joursRestants > 0 && (
          <WeddingCountdown weddingDate={weddingDate} />
        )}

        {/* Sections principales - Compact et sans répétitions */}
        {sections.length > 0 && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
          >
            {sections.map((section, index) => {
              const Icon = section.icon
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1] as const,
                  }}
                >
                  <Link href={section.href} className="block h-full">
                    <div className="group relative p-4 sm:p-5 rounded-xl bg-white transition-all duration-300 flex flex-col h-full border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
                      <div className="flex items-start gap-3 flex-1 relative z-10">
                        <div
                          className="relative h-10 w-10 rounded-lg bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center flex-shrink-0 shadow-sm"
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight group-hover:text-[#823F91] transition-colors mb-1">
                            {section.title}
                          </h3>
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                            {section.description}
                          </p>
                          <div className="flex items-center text-[#823F91] opacity-0 group-hover:opacity-100 transition-opacity mt-3">
                            <span className="text-xs font-semibold">Accéder</span>
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Grille 2 colonnes pour Tâches et Activité */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <UpcomingTasksCouple />
          <RecentActivityCouple />
        </div>

        {/* Actions rapides */}
        <QuickActionsCouple />
      </div>
    </div>
  )
}
