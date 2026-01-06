'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ModernCard } from '@/components/ui/modern-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RippleButton } from "@/components/ui/ripple-button"
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  Wallet, 
  MessageSquare, 
  Users, 
  Calendar, 
  TrendingUp,
  ArrowRight,
  Zap,
  FileText
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
                .eq('is_read', false)
              
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
                .eq('is_read', false)
              
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
      title: 'Matching IA',
      description: 'Trouvez les prestataires parfaits grâce à notre intelligence artificielle',
      icon: Sparkles,
      href: '/couple/matching',
      badge: 'Nouveau',
    },
    {
      title: 'Dossier de Mariage',
      description: 'Gérez vos documents administratifs avec l\'IA',
      icon: FileText,
      href: '/dashboard/dossier-mariage',
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
      title: 'Collaborateurs',
      description: 'Invitez des proches à vous aider dans l\'organisation',
      icon: Users,
      href: '/couple/collaborateurs',
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
        {/* Sections principales avec ModernCard */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sections.map((section, index) => {
            const Icon = section.icon
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1] as const,
                }}
              >
                <ModernCard delay={index * 0.1}>
                  <Link href={section.href} className="block h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 hover-gradient-purple">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        {section.badge && (
                          <Badge 
                            variant="secondary" 
                            className="bg-purple-100 text-purple-700 border-purple-200"
                          >
                            {section.badge}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl font-semibold mb-2">
                        {section.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {section.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                        <Button
                          variant="ghost"
                          className="text-purple-600 hover:text-white hover:bg-purple-600 group"
                        >
                          Accéder
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Link>
                </ModernCard>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Statistiques rapides modernisées */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <ModernCard delay={0.5}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Prestataires trouvés
              </CardTitle>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </motion.div>
            </CardHeader>
            <CardContent>
              <motion.div
                key={stats.prestatairesTrouves}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-2xl md:text-3xl font-bold font-mono-numbers"
              >
                {stats.prestatairesTrouves}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-2">
                Correspondances parfaites
              </p>
            </CardContent>
          </ModernCard>

          <ModernCard delay={0.6}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Budget alloué
              </CardTitle>
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Wallet className="h-4 w-4 text-purple-600" />
              </motion.div>
            </CardHeader>
            <CardContent>
              <motion.div
                key={stats.budgetAlloue}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-2xl md:text-3xl font-bold font-mono-numbers"
              >
                {stats.budgetAlloue > 0 ? `${stats.budgetAlloue.toLocaleString('fr-FR')} €` : '0 €'}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-2">
                Total planifié
              </p>
            </CardContent>
          </ModernCard>

          <ModernCard delay={0.7}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Jours restants
              </CardTitle>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <Calendar className="h-4 w-4 text-purple-600" />
              </motion.div>
            </CardHeader>
            <CardContent>
              <motion.div
                key={stats.joursRestants}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-2xl md:text-3xl font-bold font-mono-numbers"
              >
                {stats.joursRestants !== null ? stats.joursRestants : '-'}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-2">
                Jusqu'au grand jour
              </p>
            </CardContent>
          </ModernCard>
        </motion.div>
      </div>
    </div>
  )
}
