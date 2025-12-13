'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ModernCard, cardVariants } from '@/components/ui/modern-card'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
    if (user) {
      const supabase = createClient()
      
      // Récupérer le profil utilisateur pour le prénom et nom
      supabase
        .from('profiles')
        .select('prenom, nom')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.prenom) {
            setPrenom(data.prenom)
          }
          if (data?.nom) {
            setNom(data.nom)
          }
        })
      
      // Récupérer le profil couple
      supabase
        .from('couple_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          setCoupleProfile(data)
          
          if (data) {
            // Calculer les jours restants
            let joursRestants = null
            if (data.date_marriage) {
              const dateMariage = new Date(data.date_marriage)
              const aujourdhui = new Date()
              const diff = dateMariage.getTime() - aujourdhui.getTime()
              joursRestants = Math.ceil(diff / (1000 * 60 * 60 * 24))
            }
            
            // Compter les prestataires favoris
            supabase
              .from('favoris')
              .select('id', { count: 'exact', head: true })
              .eq('couple_id', user.id)
              .then(({ count }) => {
                setStats(prev => ({
                  ...prev,
                  prestatairesTrouves: count || 0,
                  budgetAlloue: data.budget_max || data.budget_min || 0,
                  joursRestants,
                }))
              })
          }
        })
    }
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
      gradient: 'from-purple-600 to-pink-600',
      badge: 'Nouveau',
    },
    {
      title: 'Dossier de Mariage',
      description: 'Gérez vos documents administratifs avec l\'IA',
      icon: FileText,
      href: '/dashboard/dossier-mariage',
      gradient: 'from-rose-600 to-pink-600',
    },
    {
      title: 'Budget & Timeline',
      description: 'Gérez votre budget et planifiez votre mariage',
      icon: Wallet,
      href: '/couple/budget',
      gradient: 'from-blue-600 to-purple-600',
    },
    {
      title: 'Messagerie',
      description: 'Communiquez avec tous vos prestataires',
      icon: MessageSquare,
      href: '/couple/messagerie',
      gradient: 'from-pink-600 to-rose-600',
      badge: stats.messagesNonLus > 0 ? `${stats.messagesNonLus}` : undefined,
    },
    {
      title: 'Collaborateurs',
      description: 'Invitez des proches à vous aider dans l\'organisation',
      icon: Users,
      href: '/couple/collaborateurs',
      gradient: 'from-purple-600 to-indigo-600',
    },
    {
      title: 'Profil',
      description: 'Modifiez vos informations personnelles et de mariage',
      icon: Calendar,
      href: '/couple/profil',
      gradient: 'from-violet-600 to-purple-600',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50/50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header modernisé */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
                Bonjour {prenom && nom ? `${prenom} ${nom}` : prenom || '👋'}
              </h1>
              {stats.joursRestants !== null && stats.joursRestants > 0 && (
                <p className="text-muted-foreground mt-2">
                  Votre mariage dans <span className="font-semibold text-purple-600">{stats.joursRestants}</span> jour{stats.joursRestants > 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            {/* Mini stats en ligne */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-muted-foreground">{stats.prestatairesTrouves}</span>
                <span className="text-muted-foreground">matchs</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-pink-600" />
                <span className="text-muted-foreground">{stats.messagesNonLus}</span>
                <span className="text-muted-foreground">messages</span>
              </div>
            </div>
          </div>
        </motion.div>

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
                custom={index}
                variants={cardVariants}
              >
                <ModernCard delay={index * 0.1}>
                  <Link href={section.href} className="block h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-lg shadow-purple-500/20`}>
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
                          className="text-purple-600 hover:text-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 group"
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
