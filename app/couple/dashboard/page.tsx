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
        // En cas d'erreur, essayer avec les requêtes séparées (fallback)
        try {
          const fallbackSupabase = createClient()
          
          // Récupérer les données du couple
          const { data: coupleData, error: coupleError } = await fallbackSupabase
            .from('couples')
            .select('*')
            .eq('user_id', user.id)
            .single()
          
          if (coupleError) {
            // Améliorer l'affichage de l'erreur avec toutes ses propriétés
            console.error('Erreur lors de la récupération du couple (fallback):', {
              message: coupleError.message,
              code: coupleError.code,
              details: coupleError.details,
              hint: coupleError.hint,
              fullError: coupleError
            })
            return
          }
          
          if (coupleData) {
            // Extraire le prénom et nom
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
            
            // Compter les favoris
            const { count: favorisCount } = await fallbackSupabase
              .from('favoris')
              .select('id', { count: 'exact', head: true })
              .eq('couple_id', user.id)
            
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
        } catch (fallbackError: any) {
          console.error('Erreur lors du fallback:', fallbackError)
        }
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
        {/* Statistiques rapides - intégrées en haut */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4"
        >
          <motion.div 
            className="flex items-center gap-3 p-4 sm:p-5 rounded-xl bg-white/95 backdrop-blur-sm border border-[#823F91]/10 shadow-md shadow-black/5 hover:shadow-lg hover:-translate-y-[2px] transition-all duration-200"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div 
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center flex-shrink-0 shadow-sm"
              animate={{ 
                boxShadow: [
                  "0 0 0 0 rgba(130, 63, 145, 0.4)",
                  "0 0 0 8px rgba(130, 63, 145, 0)",
                  "0 0 0 0 rgba(130, 63, 145, 0)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium tracking-wide">Prestataires trouvés</p>
              <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{stats.prestatairesTrouves}</p>
            </div>
          </motion.div>

          <motion.div 
            className="flex items-center gap-3 p-4 sm:p-5 rounded-xl bg-white/95 backdrop-blur-sm border border-[#823F91]/10 shadow-md shadow-black/5 hover:shadow-lg hover:-translate-y-[2px] transition-all duration-200"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div 
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center flex-shrink-0 shadow-sm"
              animate={{ 
                boxShadow: [
                  "0 0 0 0 rgba(130, 63, 145, 0.4)",
                  "0 0 0 8px rgba(130, 63, 145, 0)",
                  "0 0 0 0 rgba(130, 63, 145, 0)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            >
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium tracking-wide">Budget alloué</p>
              <div className="flex items-center gap-2">
                <p className="text-xl sm:text-2xl font-extrabold text-gray-900">
                  {stats.budgetAlloue > 0 ? `${stats.budgetAlloue.toLocaleString('fr-FR')} €` : '0 €'}
                </p>
                {stats.budgetAlloue > 0 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[#823F91] text-sm"
                  >
                    ↗
                  </motion.span>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="flex flex-col gap-2 p-4 sm:p-5 rounded-xl bg-white/95 backdrop-blur-sm border border-[#823F91]/10 shadow-md shadow-black/5 hover:shadow-lg hover:-translate-y-[2px] transition-all duration-200"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-3">
              <motion.div 
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center flex-shrink-0 shadow-sm"
                animate={{ 
                  boxShadow: [
                    "0 0 0 0 rgba(130, 63, 145, 0.4)",
                    "0 0 0 8px rgba(130, 63, 145, 0)",
                    "0 0 0 0 rgba(130, 63, 145, 0)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
              >
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium tracking-wide">Jours restants</p>
                <p className="text-xl sm:text-2xl font-extrabold text-gray-900">
                  {stats.joursRestants !== null ? stats.joursRestants : '-'}
                </p>
              </div>
            </div>
            {stats.joursRestants !== null && stats.joursRestants > 0 && (
              <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((stats.joursRestants / 365) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-[#823F91] to-[#9D5FA8] rounded-full"
                />
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Sections principales - design plus épuré */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
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
                whileHover={{ y: -2 }}
              >
                <Link href={section.href} className="block">
                  <div className={cn(
                    "group relative p-5 rounded-xl bg-white/95 backdrop-blur-sm border transition-all duration-200 min-h-[140px] flex flex-col",
                    isSearchSection 
                      ? "border-2 border-[#823F91]/30 shadow-md shadow-[#823F91]/10 hover:shadow-lg hover:shadow-[#823F91]/15" 
                      : "border border-gray-100 hover:border-[#823F91]/30 hover:shadow-md hover:shadow-[#823F91]/5"
                  )}>
                    <div className="flex items-start gap-3 sm:gap-4 flex-1">
                      <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 group-hover:-rotate-[5deg] transition-all duration-200">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
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
