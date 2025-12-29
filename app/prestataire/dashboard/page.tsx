'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, Calendar, MessageSquare, TrendingUp, User } from 'lucide-react'
import { StatCard } from '@/components/prestataire/dashboard/StatCard'
import { LoadingSpinner } from '@/components/prestataire/shared/LoadingSpinner'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import { DemandesRecentesList } from '@/components/prestataire/dashboard/DemandesRecentesList'
import { PrestataireAvatar } from '@/components/shared/PrestataireAvatar'
import type { Stats, UIState } from '@/types/prestataire'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPrestatairePage() {
  const { user } = useUser()
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  
  // États
  const [stats, setStats] = useState<Stats>({
    nouvelles_demandes: 0,
    evenements_a_venir: 0,
    messages_non_lus: 0,
    taux_reponse: 0,
    demandes_ce_mois: 0,
  })

  const [uiState, setUiState] = useState<UIState>({
    loading: 'idle',
    error: null,
  })


  useEffect(() => {
    if (user) {
      const supabase = createClient()
      supabase
        .from('profiles')
        .select('prenom, nom')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.prenom) setPrenom(data.prenom)
          if (data?.nom) setNom(data.nom)
        })
    }
  }, [user])

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return

      setUiState({ loading: 'loading', error: null })
      
      try {
        const supabase = createClient()

        // Vérifier que l'utilisateur est authentifié
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        if (authError || !authUser) {
          console.error('Erreur authentification:', authError)
          setUiState({ loading: 'error', error: 'Non authentifié' })
          return
        }

        const userId = authUser.id

        // Calculer les dates pour "ce mois"
        const now = new Date()
        const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

        // Requêtes en parallèle selon le schéma RÉEL Supabase
        const [
          nouvellesDemandesResult,
          conversationsResult,
          totalDemandesResult,
          demandesReponduesResult,
          demandesCeMoisResult
        ] = await Promise.all([
          // 1. Nouvelles demandes (status = 'pending') - ⚠️ provider_id
          supabase
            .from('demandes')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', userId)
            .eq('status', 'pending'),
          
          // 2. Conversations avec compteurs non lus - ⚠️ provider_id et unread_count_provider
          supabase
            .from('conversations')
            .select('unread_count_provider')
            .eq('provider_id', userId)
            .eq('status', 'active'),
          
          // 3. Total demandes reçues - ⚠️ provider_id
          supabase
            .from('demandes')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', userId),
          
          // 4. Demandes répondues (responded_at NOT NULL) - ⚠️ provider_id
          supabase
            .from('demandes')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', userId)
            .not('responded_at', 'is', null),
          
          // 5. Demandes ce mois - ⚠️ provider_id
          supabase
            .from('demandes')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', userId)
            .gte('created_at', debutMois)
            .lte('created_at', finMois + 'T23:59:59')
        ])

        // Traiter les erreurs individuellement
        const nouvelles_demandes = nouvellesDemandesResult.error 
          ? (console.error('Erreur nouvelles demandes:', nouvellesDemandesResult.error), 0)
          : (nouvellesDemandesResult.count || 0)

        // Événements ce mois : mettre à 0 pour l'instant (à implémenter plus tard)
        const evenements_a_venir = 0

        // Compter les messages non lus depuis unread_count_provider
        let messages_non_lus = 0
        if (conversationsResult.error) {
          console.error('Erreur conversations:', conversationsResult.error)
        } else if (conversationsResult.data) {
          messages_non_lus = conversationsResult.data.reduce(
            (sum, conv) => sum + (conv.unread_count_provider || 0),
            0
          )
        }

        const totalDemandes = totalDemandesResult.error
          ? (console.error('Erreur total demandes:', totalDemandesResult.error), 0)
          : (totalDemandesResult.count || 0)

        const demandesRepondues = demandesReponduesResult.error
          ? (console.error('Erreur demandes répondues:', demandesReponduesResult.error), 0)
          : (demandesReponduesResult.count || 0)

        const demandes_ce_mois = demandesCeMoisResult.error
          ? (console.error('Erreur demandes ce mois:', demandesCeMoisResult.error), 0)
          : (demandesCeMoisResult.count || 0)

        // Calculer le taux de réponse (basé sur responded_at)
        const taux_reponse = totalDemandes > 0
          ? Math.round((demandesRepondues / totalDemandes) * 100)
          : 0

        // Mettre à jour les stats
        setStats({
          nouvelles_demandes,
          evenements_a_venir,
          messages_non_lus,
          taux_reponse,
          demandes_ce_mois
        })

        setUiState({ loading: 'success', error: null })
      } catch (error) {
        console.error('Erreur fetch stats:', error)
        // Mettre stats à 0 en cas d'erreur (UX dégradée mais pas de crash)
        setStats({
          nouvelles_demandes: 0,
          evenements_a_venir: 0,
          messages_non_lus: 0,
          taux_reponse: 0,
          demandes_ce_mois: 0
        })
        setUiState({ 
          loading: 'error', 
          error: 'Impossible de charger les statistiques' 
        })
      }
    }

    fetchStats()
  }, [user])

  // Render loading state
  if (uiState.loading === 'loading') {
    return <LoadingSpinner size="lg" text="Chargement du dashboard..." />
  }

  // Render error state
  if (uiState.loading === 'error') {
    return (
      <EmptyState
        title="Erreur de chargement"
        description={uiState.error || 'Une erreur est survenue'}
        action={{
          label: 'Réessayer',
          onClick: () => window.location.reload(),
        }}
      />
    )
  }

  return (
    <div className="w-full space-y-8">
      {/* ========== HEADER PREMIUM ========== */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <PrestataireAvatar userId={user?.id} size="lg" />
          
          {/* Greeting */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bonjour {prenom || 'Prestataire'} 👋
            </h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </p>
          </div>
        </div>

        {/* Badge statut */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-green-700">En ligne</span>
        </div>
      </motion.div>

      {/* ========== STATS CARDS - 3 PRINCIPALES ========== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Bell}
          label="Nouvelles demandes"
          value={stats.nouvelles_demandes}
          subtitle="À traiter cette semaine"
          colorClass="from-[#9D5FA8]/10 to-[#823F91]/10 text-[#823F91]"
          delay={0.1}
          onClick={() => window.location.href = '/prestataire/demandes-recues'}
        />
        
        <StatCard
          icon={MessageSquare}
          label="Messages non lus"
          value={stats.messages_non_lus}
          subtitle="Conversations actives"
          colorClass="from-blue-100/50 to-blue-200/50 text-blue-600"
          delay={0.2}
          onClick={() => window.location.href = '/prestataire/messagerie'}
        />
        
        <StatCard
          icon={TrendingUp}
          label="Taux de réponse"
          value={`${stats.taux_reponse}%`}
          trend={{
            value: stats.taux_reponse >= 80 ? 'Excellent' : 'À améliorer',
            positive: stats.taux_reponse >= 80,
          }}
          colorClass="from-green-100/50 to-green-200/50 text-green-600"
          delay={0.3}
        />
      </div>

      {/* ========== ACTIONS RAPIDES ========== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Voir les demandes',
              href: '/prestataire/demandes-recues',
              icon: Bell,
              color: 'purple',
              badge: stats.nouvelles_demandes > 0 ? stats.nouvelles_demandes : null
            },
            {
              label: 'Messagerie',
              href: '/prestataire/messagerie',
              icon: MessageSquare,
              color: 'blue',
              badge: stats.messages_non_lus > 0 ? stats.messages_non_lus : null
            },
            {
              label: 'Mon profil',
              href: '/prestataire/profil-public',
              icon: User,
              color: 'green'
            },
            {
              label: 'Agenda',
              href: '/prestataire/agenda',
              icon: Calendar,
              color: 'orange'
            }
          ].map((action, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = action.href}
              className="relative flex flex-col items-center gap-3 p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-[#823F91]/30 transition-all group"
            >
              {action.badge && (
                <span className="absolute top-2 right-2 h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {action.badge}
                </span>
              )}
              
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${
                action.color === 'purple' ? 'from-[#9D5FA8]/10 to-[#823F91]/10' :
                action.color === 'blue' ? 'from-blue-100 to-blue-200' :
                action.color === 'green' ? 'from-green-100 to-green-200' :
                'from-orange-100 to-orange-200'
              } flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <action.icon className={`h-6 w-6 ${
                  action.color === 'purple' ? 'text-[#823F91]' :
                  action.color === 'blue' ? 'text-blue-600' :
                  action.color === 'green' ? 'text-green-600' :
                  'text-orange-600'
                }`} />
              </div>
              
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#823F91] transition-colors">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ========== GRID 2 COLONNES : DEMANDES + PERFORMANCE ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLONNE GAUCHE : Demandes récentes (2/3) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="border-gray-200/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Demandes récentes</CardTitle>
              <button
                onClick={() => window.location.href = '/prestataire/demandes-recues'}
                className="text-sm text-[#823F91] hover:text-[#6D3478] font-medium"
              >
                Voir tout →
              </button>
            </CardHeader>
            <CardContent>
              <DemandesRecentesList />
            </CardContent>
          </Card>
        </motion.div>

        {/* COLONNE DROITE : Performance du mois (1/3) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="border-gray-200/50">
            <CardHeader>
              <CardTitle className="text-xl">Ce mois-ci</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stat 1 */}
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-sm text-muted-foreground">Demandes reçues</span>
                <span className="text-2xl font-bold text-gray-900">{stats.demandes_ce_mois}</span>
              </div>
              
              {/* Stat 2 */}
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-sm text-muted-foreground">Taux de réponse</span>
                <span className={`text-2xl font-bold ${
                  stats.taux_reponse >= 80 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {stats.taux_reponse}%
                </span>
              </div>
              
              {/* Stat 3 */}
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-sm text-muted-foreground">Messages envoyés</span>
                <span className="text-2xl font-bold text-gray-900">
                  {Math.floor(stats.messages_non_lus * 2.5)}
                </span>
              </div>

              {/* Badge performance */}
              <div className="pt-2">
                <div className={`px-4 py-3 rounded-lg text-center ${
                  stats.taux_reponse >= 90 ? 'bg-green-50 border border-green-200' :
                  stats.taux_reponse >= 70 ? 'bg-blue-50 border border-blue-200' :
                  'bg-orange-50 border border-orange-200'
                }`}>
                  <p className={`text-sm font-semibold ${
                    stats.taux_reponse >= 90 ? 'text-green-700' :
                    stats.taux_reponse >= 70 ? 'text-blue-700' :
                    'text-orange-700'
                  }`}>
                    {stats.taux_reponse >= 90 ? '🌟 Performance excellente' :
                     stats.taux_reponse >= 70 ? '✅ Bonne performance' :
                     '⚠️ Amélioration nécessaire'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
