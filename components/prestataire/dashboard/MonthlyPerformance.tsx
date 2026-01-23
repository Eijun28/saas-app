'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, ArrowUp, ArrowDown } from 'lucide-react'
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

  const maxRequests = Math.max(...weekData.map(w => w.requests), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.8 }}
      className="bg-white border border-gray-200/60 rounded-xl p-5 sm:p-6 hover:shadow-lg hover:shadow-gray-900/5 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Performance du mois</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Taux de réponse et évolution
          </p>
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold",
            trend.positive 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : "bg-red-50 text-red-700 border border-red-200"
          )}>
            {trend.positive ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 bg-gray-50 rounded-lg animate-pulse" />
          <div className="h-8 bg-gray-50 rounded-lg animate-pulse" />
        </div>
      ) : (
        <>
          {/* Taux de réponse */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Taux de réponse</span>
              <span className="text-2xl font-bold text-[#823F91]">{responseRate}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${responseRate}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-[#823F91] to-[#9D5FA8] rounded-full"
              />
            </div>
          </div>

          {/* Graphique par semaine */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Demandes par semaine</h3>
            {weekData.map((week, index) => (
              <div key={week.week} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">{week.week}</span>
                  <span className="text-gray-900 font-semibold">
                    {week.requests} demande{week.requests > 1 ? 's' : ''}
                    {week.accepted > 0 && (
                      <span className="text-[#823F91] ml-1">
                        ({week.accepted} acceptée{week.accepted > 1 ? 's' : ''})
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(week.requests / maxRequests) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                    className="h-full bg-gradient-to-r from-[#823F91] to-[#9D5FA8] rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  )
}
