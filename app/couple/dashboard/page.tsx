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
  Search
} from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fadeInUp, counterAnimation } from '@/lib/animations'
import { cn } from '@/lib/utils'

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
          // Extraire le prénom et nom depuis partner_1_name (qui existe dans la table couples)
          if (coupleData.partner_1_name) {
            const nameParts = coupleData.partner_1_name.split(' ')
            setPrenom(nameParts[0] || '')
            setNom(nameParts.slice(1).join(' ') || '')
          }

          setCoupleProfile(coupleData)

          // Calculer les jours restants
          let joursRestants = null
          if (coupleData.wedding_date) {
            const dateMariage = new Date(coupleData.wedding_date)
            const aujourdhui = new Date()
            const diff = dateMariage.getTime() - aujourdhui.getTime()
            joursRestants = Math.ceil(diff / (1000 * 60 * 60 * 24))
          }

          // Compter les favoris (depuis la relation ou requête séparée si nécessaire)
          const { count: favorisCount, error: favorisError } = await supabase
            .from('favoris')
            .select('id', { count: 'exact', head: true })
            .eq('couple_id', user.id)

          if (favorisError) {
            console.error('Erreur lors du comptage des favoris:', favorisError)
          }

          // Messages désactivés temporairement
          const messagesNonLus = 0

          // Calculer le budget total de la même manière que dans la page budget
          const budgetTotal = coupleData.budget_total || coupleData.budget_max || coupleData.budget_min || 0
          
          setStats({
            prestatairesTrouves: favorisCount || 0,
            budgetAlloue: budgetTotal,
            joursRestants,
            messagesNonLus,
          })
        }
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

  const sections = [
    {
      title: 'Rechercher des prestataires',
      description: 'Trouvez des prestataires par métier, culture ou ville',
      icon: Search,
      href: '/couple/recherche',
      badge: undefined,
    },
    {
      title: 'Matching IA',
      description: 'Trouvez les prestataires parfaits grâce à notre intelligence artificielle',
      icon: Sparkles,
      href: '/couple/matching',
      badge: 'Nouveau',
    },
    {
      title: 'Budget & Timeline',
      description: 'Gérez votre budget et planifiez votre mariage',
      icon: Wallet,
      href: '/couple/budget',
    },
    {
      title: 'Messagerie',
      description: 'Communiquez avec tous vos prestataires',
      icon: MessageSquare,
      href: '/couple/messagerie',
      badge: stats.messagesNonLus > 0 ? `${stats.messagesNonLus}` : undefined,
    },
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
      <div className="w-full space-y-4 sm:space-y-6 md:space-y-8">
        {/* Statistiques rapides - Style prestataire optimisé */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 w-full items-stretch">
          {[
            {
              icon: TrendingUp,
              label: "Prestataires trouvés",
              value: stats.prestatairesTrouves,
              subtitle: "Dans vos favoris",
              description: stats.prestatairesTrouves > 0
                ? `${stats.prestatairesTrouves} prestataire${stats.prestatairesTrouves > 1 ? 's' : ''} sauvegardé${stats.prestatairesTrouves > 1 ? 's' : ''}`
                : "Aucun prestataire sauvegardé pour le moment",
              onClick: () => router.push('/couple/recherche'),
              actionLabel: "Rechercher des prestataires",
              delay: 0.1,
            },
            {
              icon: Wallet,
              label: "Budget alloué",
              value: `${stats.budgetAlloue > 0 ? stats.budgetAlloue.toLocaleString('fr-FR') : '0'} €`,
              subtitle: "Budget total",
              description: stats.budgetAlloue > 0
                ? `${stats.budgetAlloue.toLocaleString('fr-FR')} € alloués à votre mariage`
                : "Aucun budget défini pour le moment",
              onClick: () => router.push('/couple/budget'),
              actionLabel: "Gérer mon budget",
              delay: 0.2,
            },
            {
              icon: Calendar,
              label: "Jours restants",
              value: stats.joursRestants !== null ? stats.joursRestants : '-',
              subtitle: "Avant le mariage",
              description: stats.joursRestants !== null && stats.joursRestants > 0
                ? `${stats.joursRestants} jour${stats.joursRestants > 1 ? 's' : ''} avant votre mariage`
                : stats.joursRestants === null
                ? "Date de mariage non définie"
                : "Votre mariage est aujourd'hui !",
              onClick: () => router.push('/couple/profil'),
              actionLabel: "Modifier la date",
              delay: 0.3,
            },
          ].map((card, index) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: card.delay, ease: [0.16, 1, 0.3, 1] }}
                className="relative border border-gray-200/60 bg-white rounded-xl hover:border-gray-300 hover:shadow-xl hover:shadow-gray-900/5 transition-all duration-300 ease-out overflow-hidden group cursor-pointer"
                onClick={card.onClick}
              >
                <div className="p-5 sm:p-6 md:p-7 space-y-5 flex flex-col flex-1">
                  {/* Header: Icon + Label */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <motion.div 
                        className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex-shrink-0 bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center shadow-sm shadow-[#823F91]/10 group-hover:shadow-md group-hover:shadow-[#823F91]/20 transition-all duration-300"
                        whileHover={{ scale: 1.05, rotate: -2 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">
                          {card.label}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main Value */}
                  <div className="space-y-2">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: card.delay + 0.1 }}
                      className="flex items-baseline gap-2 flex-wrap"
                    >
                      <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-none">
                        {card.value}
                      </p>
                    </motion.div>
                    
                    {/* Subtitle */}
                    {card.subtitle && (
                      <p className="text-sm sm:text-base text-gray-600 font-medium">
                        {card.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="pt-3 border-t border-gray-100/80 flex-1 flex flex-col">
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-medium">
                      {card.description}
                    </p>
                  </div>

                  {/* Action button */}
                  {card.actionLabel && (
                    <div className="pt-4 border-t border-gray-100/80">
                      <button className="w-full flex items-center justify-between text-xs sm:text-sm font-semibold text-[#823F91] hover:text-[#6D3478] transition-colors group/btn">
                        <span className="group-hover/btn:underline">{card.actionLabel}</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  )}

                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#823F91]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Sections principales - Style prestataire optimisé */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5"
        >
          {sections.map((section, index) => {
            const Icon = section.icon
            const isSearchSection = section.title === 'Rechercher des prestataires'
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
                  <div className={cn(
                    "group relative p-4 sm:p-5 rounded-xl bg-white border transition-all duration-300 min-h-[140px] flex flex-col h-full",
                    isSearchSection 
                      ? "border-[#823F91]/30 shadow-md shadow-[#823F91]/10 hover:shadow-xl hover:shadow-[#823F91]/15 hover:border-[#823F91]/50" 
                      : "border-gray-200/60 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-900/5"
                  )}>
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 relative z-10">
                      <motion.div 
                        className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#823F91]/10 group-hover:shadow-md group-hover:shadow-[#823F91]/20 transition-all duration-300"
                        whileHover={{ scale: 1.05, rotate: -2 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </motion.div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight group-hover:text-[#823F91] transition-colors">
                            {section.title}
                          </h3>
                          {section.badge && (
                            <motion.div
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Badge 
                                variant="secondary" 
                                className="bg-[#E8D4EF] text-[#823F91] border-0 text-xs px-2.5 py-1 h-5 flex-shrink-0 rounded-full shadow-sm font-semibold"
                              >
                                {section.badge}
                              </Badge>
                            </motion.div>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3 flex-1">
                          {section.description}
                        </p>
                        <div className="flex items-center text-[#823F91] opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                          <span className="text-xs font-semibold">Accéder</span>
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#823F91]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
