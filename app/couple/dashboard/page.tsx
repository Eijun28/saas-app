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
    if (user) {
      const supabase = createClient()
      
      // Récupérer le profil couple pour le prénom et nom
      supabase
        .from('couples')
        .select('partner_1_name')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.partner_1_name) {
            const nameParts = data.partner_1_name.split(' ')
            setPrenom(nameParts[0] || '')
            setNom(nameParts.slice(1).join(' ') || '')
          }
        })
      
      // Récupérer le profil couple
      supabase
        .from('couples')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          setCoupleProfile(data)
          
          if (data) {
            // Calculer les jours restants
            let joursRestants = null
            if (data.wedding_date) {
              const dateMariage = new Date(data.wedding_date)
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
                  budgetAlloue: data.budget_total || 0,
                  joursRestants,
                }))
              })
            
            // Compter les messages non lus
            supabase
              .from('conversations')
              .select('id')
              .eq('couple_id', user.id)
              .then(({ data: conversations }) => {
                if (conversations && conversations.length > 0) {
                  const conversationIds = conversations.map(c => c.id)
                  supabase
                    .from('messages')
                    .select('id', { count: 'exact', head: true })
                    .in('conversation_id', conversationIds)
                    .neq('sender_id', user.id)
                    .eq('is_read', false)
                    .then(({ count }) => {
                      setStats(prev => ({
                        ...prev,
                        messagesNonLus: count || 0,
                      }))
                    })
                }
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
      title: 'Demandes & Devis',
      description: 'Gérez vos demandes et devis reçus',
      icon: FileText,
      href: '/couple/demandes',
      gradient: 'from-blue-600 to-cyan-600',
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
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <ModernCard delay={index * 0.1}>
                  <Link href={section.href} className="block h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-lg shadow-purple-500/20 hover-gradient-purple`}>
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
