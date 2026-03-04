'use client'

import { motion } from 'framer-motion'
import { MessageCircle, Clock, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResponseRateCardProps {
  responseRate:   number  // % (0-100)
  avgResponseTime?: number | null  // heures
  respondedCount: number
  totalCount:     number
}

function CircularProgress({ pct, color }: { pct: number; color: string }) {
  const r = 28
  const circumference = 2 * Math.PI * r
  const offset = circumference - (pct / 100) * circumference

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
      {/* Track */}
      <circle cx="36" cy="36" r={r} fill="none" stroke="#f3f4f6" strokeWidth="7" />
      {/* Progress */}
      <motion.circle
        cx="36" cy="36" r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
      />
    </svg>
  )
}

export function ResponseRateCard({
  responseRate, avgResponseTime, respondedCount, totalCount,
}: ResponseRateCardProps) {
  const color = responseRate >= 80 ? '#10b981' : responseRate >= 50 ? '#f59e0b' : '#ef4444'
  const label = responseRate >= 80 ? 'Excellent' : responseRate >= 50 ? 'Moyen' : 'À améliorer'

  const formatTime = (hours?: number | null) => {
    if (!hours) return null
    if (hours < 1) return '< 1h'
    if (hours < 24) return `${Math.round(hours)}h`
    return `${Math.round(hours / 24)}j`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-2xl border border-gray-100 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-[#823F91]/10 rounded-lg">
          <MessageCircle className="h-4 w-4 text-[#823F91]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Taux de réponse</h3>
          <p className="text-[11px] text-gray-400">Demandes traitées</p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Cercle */}
        <div className="relative flex-shrink-0">
          <CircularProgress pct={responseRate} color={color} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[13px] font-extrabold" style={{ color }}>
              {responseRate}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-2">
          <div>
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {label}
            </span>
          </div>

          <div className="text-[12px] text-gray-600">
            <span className="font-semibold text-gray-900">{respondedCount}</span>
            <span className="text-gray-400"> / {totalCount} demandes traitées</span>
          </div>

          {avgResponseTime != null && (
            <div className="flex items-center gap-1 text-[12px] text-gray-500">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              Délai moyen :
              <span className="font-semibold text-gray-900 ml-1">
                {formatTime(avgResponseTime) ?? '—'}
              </span>
            </div>
          )}
        </div>
      </div>

      {totalCount === 0 && (
        <p className="text-[11px] text-gray-400 mt-3 text-center">
          Aucune demande reçue sur la période
        </p>
      )}
    </motion.div>
  )
}
