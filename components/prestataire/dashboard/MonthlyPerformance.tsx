'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { cn } from '@/lib/utils'

interface WeekData {
  week: string
  requests: number
  accepted: number
}

export function MonthlyPerformance() {
  const { user } = useUser()
  const [weekData, setWeekData] = useState<WeekData[]>([])
  const [loading, setLoading] = useState(true)
  const [responseRate, setResponseRate] = useState(0)
  const [trend, setTrend] = useState<{ value: number; positive: boolean } | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchPerformance = async () => {
      try {
        const supabase = createClient()
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

        // Récupérer les demandes du mois actuel
        const { data: currentMonthRequests } = await supabase
          .from('requests')
          .select('id, created_at, status')
          .eq('provider_id', user.id)
          .gte('created_at', startOfMonth.toISOString())

        // Récupérer les demandes du mois dernier
        const { data: lastMonthRequests } = await supabase
          .from('requests')
          .select('id, created_at, status')
          .eq('provider_id', user.id)
          .gte('created_at', startOfLastMonth.toISOString())
          .lt('created_at', endOfLastMonth.toISOString())

        if (currentMonthRequests) {
          const accepted = currentMonthRequests.filter(r => r.status === 'accepted').length
          const total = currentMonthRequests.length
          const rate = total > 0 ? Math.round((accepted / total) * 100) : 0
          setResponseRate(rate)

          // Calculer la tendance
          if (lastMonthRequests) {
            const lastAccepted = lastMonthRequests.filter(r => r.status === 'accepted').length
            const lastTotal = lastMonthRequests.length
            const lastRate = lastTotal > 0 ? Math.round((lastAccepted / lastTotal) * 100) : 0
            const diff = rate - lastRate
            setTrend({ value: Math.abs(diff), positive: diff >= 0 })
          }

          // Grouper par semaine
          const weeks: WeekData[] = []
          const weekStarts = []
          for (let i = 0; i < 4; i++) {
            const weekStart = new Date(startOfMonth)
            weekStart.setDate(weekStart.getDate() + i * 7)
            weekStarts.push(weekStart)
          }

          weekStarts.forEach((weekStart, index) => {
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 6)

            const weekRequests = currentMonthRequests.filter(req => {
              const reqDate = new Date(req.created_at)
              return reqDate >= weekStart && reqDate <= weekEnd
            })

            weeks.push({
              week: `Sem. ${index + 1}`,
              requests: weekRequests.length,
              accepted: weekRequests.filter(r => r.status === 'accepted').length,
            })
          })

          setWeekData(weeks)
        }
      } catch (error) {
        console.error('Erreur chargement performance:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPerformance()
  }, [user])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.8 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Header avec fond blanc ivoire et pills */}
      <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Performance du mois</h2>
            <p className="text-xs sm:text-[13px] text-gray-400 mt-0.5">
              Taux de reponse et evolution
            </p>
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold",
              trend.positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              {trend.positive ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )}
              <span>{trend.value}%</span>
            </div>
          )}
        </div>

      </div>

      {/* Contenu avec scroll caché */}
      <div
        className="p-5 overflow-y-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loading ? (
          <div className="space-y-4">
            <div className="h-24 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />
          </div>
        ) : (
          <>
            {/* Taux de réponse - Card intégrée */}
            <div className="mb-6 p-4 bg-gray-50/80 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Taux de réponse</span>
                <span className="text-2xl sm:text-3xl font-bold text-[#823F91]">{responseRate}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${responseRate}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-[#823F91] to-[#9D5FA8] rounded-full"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {responseRate >= 70 ? 'Superieur a la moyenne de la plateforme' :
                 responseRate >= 50 ? 'Dans la moyenne de la plateforme' :
                 'En dessous de la moyenne de la plateforme'}
              </p>
            </div>

            {/* Résumé graphique circulaire simplifié */}
            <div className="flex items-center justify-center gap-8">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                    fill="none"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 352" }}
                    animate={{ strokeDasharray: `${responseRate * 3.52} 352` }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#823F91" />
                      <stop offset="100%" stopColor="#9D5FA8" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{responseRate}%</span>
                  <span className="text-xs text-gray-500">Conversion</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#823F91]" />
                  <span className="text-sm text-gray-600">Acceptées</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-200" />
                  <span className="text-sm text-gray-600">En attente</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
