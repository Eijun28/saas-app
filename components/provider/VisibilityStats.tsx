'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Eye,
  MousePointer2,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Sparkles,
  Users,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface VisibilityStatsProps {
  userId: string
  serviceType?: string
  className?: string
}

interface Stats {
  impressions_today: number
  impressions_this_week: number
  impressions_this_month: number
  total_impressions: number
  clicks_today: number
  clicks_this_week: number
  total_clicks: number
  contacts_this_week: number
  total_contacts: number
  click_through_rate: number
  contact_rate: number
}

export function VisibilityStats({ userId, serviceType, className }: VisibilityStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [weeklyTrend, setWeeklyTrend] = useState<'up' | 'down' | 'stable'>('stable')

  useEffect(() => {
    async function loadStats() {
      const supabase = createClient()

      try {
        // Charger les stats du provider depuis provider_impressions
        const { data, error } = await supabase
          .from('provider_impressions')
          .select('*')
          .eq('profile_id', userId)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is expected for new providers
          console.error('Error loading visibility stats:', error)
        }

        if (data) {
          setStats({
            impressions_today: data.impressions_today || 0,
            impressions_this_week: data.impressions_this_week || 0,
            impressions_this_month: data.impressions_this_month || 0,
            total_impressions: data.total_impressions || 0,
            clicks_today: data.clicks_today || 0,
            clicks_this_week: data.clicks_this_week || 0,
            total_clicks: data.total_clicks || 0,
            contacts_this_week: data.contacts_this_week || 0,
            total_contacts: data.total_contacts || 0,
            click_through_rate: data.click_through_rate || 0,
            contact_rate: data.contact_rate || 0,
          })

          // Calculer la tendance (simplified)
          if (data.impressions_this_week > (data.total_impressions / 4)) {
            setWeeklyTrend('up')
          } else if (data.impressions_this_week < (data.total_impressions / 8)) {
            setWeeklyTrend('down')
          }
        }
      } catch (err) {
        console.error('Failed to load stats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [userId])

  // Animation counter
  const AnimatedCounter = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
    const [count, setCount] = useState(0)

    useEffect(() => {
      let start = 0
      const end = value
      if (start === end) return

      const incrementTime = duration / end
      const timer = setInterval(() => {
        start += 1
        setCount(start)
        if (start === end) clearInterval(timer)
      }, Math.max(incrementTime, 20))

      return () => clearInterval(timer)
    }, [value, duration])

    return <span>{count}</span>
  }

  const formatRate = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`
  }

  const TrendIcon = weeklyTrend === 'up'
    ? TrendingUp
    : weeklyTrend === 'down'
    ? TrendingDown
    : Minus

  const trendColor = weeklyTrend === 'up'
    ? 'text-emerald-500'
    : weeklyTrend === 'down'
    ? 'text-red-500'
    : 'text-gray-400'

  if (loading) {
    return (
      <div className={cn('rounded-2xl bg-white p-6 animate-pulse', className)}>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // Si pas de stats, afficher un etat vide encourageant
  if (!stats || stats.total_impressions === 0) {
    return (
      <div className={cn(
        'relative overflow-hidden rounded-2xl bg-white',
        'shadow-[0_4px_20px_-4px_rgba(130,63,145,0.12)]',
        'border border-gray-100/50',
        className
      )}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#823F91]/5 to-transparent rounded-bl-full" />

        <div className="relative p-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#823F91]/10 to-purple-50 flex items-center justify-center mb-4">
            <BarChart3 className="h-8 w-8 text-[#823F91]" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Vos statistiques arrivent bientot</h3>
          <p className="text-sm text-gray-500 mb-4">
            Des que votre profil sera visible par les couples, vous verrez ici vos statistiques de visibilite en temps reel.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#823F91]/5 text-[#823F91] text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Completez votre profil pour plus de visibilite
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl bg-white',
      'shadow-[0_4px_20px_-4px_rgba(130,63,145,0.12)]',
      'border border-gray-100/50',
      className
    )}>
      {/* Header gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#823F91] via-purple-500 to-pink-500" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#823F91]/10 to-purple-50">
              <BarChart3 className="h-5 w-5 text-[#823F91]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Votre visibilite</h3>
              <p className="text-sm text-gray-500">Cette semaine</p>
            </div>
          </div>
          <div className={cn('flex items-center gap-1 text-sm font-medium', trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span>
              {weeklyTrend === 'up' ? 'En hausse' : weeklyTrend === 'down' ? 'En baisse' : 'Stable'}
            </span>
          </div>
        </div>

        {/* Main stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Impressions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">Vues</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              <AnimatedCounter value={stats.impressions_this_week} />
            </div>
            <p className="text-xs text-gray-500">cette semaine</p>
          </motion.div>

          {/* Clicks */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <MousePointer2 className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-600">Clics</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              <AnimatedCounter value={stats.clicks_this_week} />
            </div>
            <p className="text-xs text-gray-500">cette semaine</p>
          </motion.div>

          {/* Contacts */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-600">Demandes</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              <AnimatedCounter value={stats.contacts_this_week} />
            </div>
            <p className="text-xs text-gray-500">cette semaine</p>
          </motion.div>

          {/* CTR */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-600">Taux de clic</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatRate(stats.click_through_rate)}
            </div>
            <p className="text-xs text-gray-500">
              {stats.click_through_rate >= 0.15 ? 'Excellent !' : stats.click_through_rate >= 0.10 ? 'Bon' : 'A ameliorer'}
            </p>
          </motion.div>
        </div>

        {/* Total stats */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Total vues:</span>
                <span className="font-medium text-gray-900">{stats.total_impressions}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Total demandes:</span>
                <span className="font-medium text-gray-900">{stats.total_contacts}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tip */}
        {stats.click_through_rate < 0.10 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100"
          >
            <p className="text-xs text-amber-800">
              <strong>Conseil:</strong> Ajoutez plus de photos a votre portfolio pour augmenter votre taux de clic !
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
