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
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/couple/dashboard/page.tsx:43',message:'fetchDashboardData entry',data:{userId:user?.id,userExists:!!user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      try {
        // Récupérer les données du couple (sans relation inexistante)
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('*')
          .eq('user_id', user.id)
          .single()

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/couple/dashboard/page.tsx:56',message:'after couple query',data:{coupleErrorExists:!!coupleError,coupleErrorType:typeof coupleError,coupleErrorIsNull:coupleError===null,coupleErrorIsUndefined:coupleError===undefined,coupleErrorKeys:coupleError?Object.keys(coupleError):null,coupleErrorMessage:coupleError?.message,coupleErrorCode:coupleError?.code,coupleErrorDetails:coupleError?.details,coupleErrorHint:coupleError?.hint,coupleErrorStringified:coupleError?JSON.stringify(coupleError):null,coupleDataExists:!!coupleData},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,B,C,D'})}).catch(()=>{});
        // #endregion

        if (coupleError) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/couple/dashboard/page.tsx:58',message:'coupleError detected before throw',data:{errorType:typeof coupleError,errorConstructor:coupleError?.constructor?.name,errorPrototype:Object.getPrototypeOf(coupleError)?.constructor?.name,allErrorProps:coupleError?Object.getOwnPropertyNames(coupleError):null,errorString:String(coupleError),errorJSON:JSON.stringify(coupleError,Object.getOwnPropertyNames(coupleError))},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
          // #endregion
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

          // Compter les messages non lus depuis les conversations
          let messagesNonLus = 0
          try {
            const { data: conversations, error: conversationsError } = await supabase
              .from('conversations')
              .select('id')
              .eq('couple_id', user.id)
            
            if (conversationsError) {
              console.error('Erreur lors de la récupération des conversations:', conversationsError)
            } else if (conversations && conversations.length > 0) {
              const conversationIds = conversations.map((c: any) => c.id)
              const { count, error: messagesError } = await supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .in('conversation_id', conversationIds)
                .neq('sender_id', user.id)
                .is('read_at', null)
              
              if (messagesError) {
                console.error('Erreur lors du comptage des messages:', messagesError)
              } else {
                messagesNonLus = count || 0
              }
            }
          } catch (messagesError: any) {
            console.error('Erreur lors du traitement des messages:', messagesError)
          }

          setStats({
            prestatairesTrouves: favorisCount || 0,
            budgetAlloue: coupleData.budget_max || coupleData.budget_min || 0,
            joursRestants,
            messagesNonLus,
          })
        }
      } catch (error: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/couple/dashboard/page.tsx:131',message:'catch block entry',data:{errorExists:!!error,errorType:typeof error,errorIsNull:error===null,errorIsUndefined:error===undefined,errorConstructor:error?.constructor?.name,errorMessage:error?.message,errorStack:error?.stack,errorKeys:error?Object.keys(error):null,allErrorProps:error?Object.getOwnPropertyNames(error):null,errorString:String(error),errorJSON:error?JSON.stringify(error,Object.getOwnPropertyNames(error)):null},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
        // #endregion
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
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/couple/dashboard/page.tsx:144',message:'fallback coupleError detected',data:{errorType:typeof coupleError,errorIsNull:coupleError===null,errorIsUndefined:coupleError===undefined,errorMessage:coupleError?.message,errorCode:coupleError?.code,errorDetails:coupleError?.details,errorHint:coupleError?.hint,errorKeys:coupleError?Object.keys(coupleError):null,allErrorProps:coupleError?Object.getOwnPropertyNames(coupleError):null,errorString:String(coupleError),errorJSON:coupleError?JSON.stringify(coupleError,Object.getOwnPropertyNames(coupleError)):null},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
            // #endregion
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
            
            // Compter les messages non lus
            const { data: conversations } = await fallbackSupabase
              .from('conversations')
              .select('id')
              .eq('couple_id', user.id)
            
            let messagesNonLus = 0
            if (conversations && conversations.length > 0) {
              const conversationIds = conversations.map(c => c.id)
              const { count } = await fallbackSupabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .in('conversation_id', conversationIds)
                .neq('sender_id', user.id)
                .is('read_at', null)
              
              messagesNonLus = count || 0
            }
            
            setStats({
              prestatairesTrouves: favorisCount || 0,
              budgetAlloue: coupleData.budget_max || coupleData.budget_min || 0,
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
      <div className="w-full space-y-8">
        {/* Statistiques rapides - intégrées en haut */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-[#823F91]/5 to-[#9D5FA8]/5 border border-[#823F91]/10">
            <div className="h-10 w-10 rounded-lg bg-[#823F91] flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#6B7280] mb-0.5">Prestataires trouvés</p>
              <p className="text-xl font-bold text-[#0D0D0D]">{stats.prestatairesTrouves}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-[#823F91]/5 to-[#9D5FA8]/5 border border-[#823F91]/10">
            <div className="h-10 w-10 rounded-lg bg-[#823F91] flex items-center justify-center flex-shrink-0">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#6B7280] mb-0.5">Budget alloué</p>
              <p className="text-xl font-bold text-[#0D0D0D]">
                {stats.budgetAlloue > 0 ? `${stats.budgetAlloue.toLocaleString('fr-FR')} €` : '0 €'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-[#823F91]/5 to-[#9D5FA8]/5 border border-[#823F91]/10">
            <div className="h-10 w-10 rounded-lg bg-[#823F91] flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#6B7280] mb-0.5">Jours restants</p>
              <p className="text-xl font-bold text-[#0D0D0D]">
                {stats.joursRestants !== null ? stats.joursRestants : '-'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Sections principales - design plus épuré */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {sections.map((section, index) => {
            const Icon = section.icon
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.03,
                  duration: 0.3,
                  ease: [0.16, 1, 0.3, 1] as const,
                }}
              >
                <Link href={section.href} className="block">
                  <div className="group relative p-4 rounded-xl bg-white border border-gray-100 hover:border-[#823F91]/30 hover:shadow-md hover:shadow-[#823F91]/5 transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-[#823F91] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-[#0D0D0D] leading-tight group-hover:text-[#823F91] transition-colors">
                            {section.title}
                          </h3>
                          {section.badge && (
                            <Badge 
                              variant="secondary" 
                              className="bg-[#E8D4EF] text-[#823F91] border-0 text-xs px-1.5 py-0 h-5 flex-shrink-0"
                            >
                              {section.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2">
                          {section.description}
                        </p>
                        <div className="mt-2 flex items-center text-[#823F91] opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs font-medium">Accéder</span>
                          <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
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
