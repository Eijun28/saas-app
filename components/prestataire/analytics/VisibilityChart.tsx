'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'

interface TimelineEntry {
  date: string
  impressions: number
  clicks: number
  contacts: number
  requests: number
}

interface VisibilityChartProps {
  timeline: TimelineEntry[]
  period: string
}

type MetricKey = 'impressions' | 'clicks' | 'contacts' | 'requests'

const metrics: { key: MetricKey; label: string; color: string }[] = [
  { key: 'impressions', label: 'Apparitions', color: '#818CF8' },
  { key: 'clicks', label: 'Clics', color: '#823F91' },
  { key: 'contacts', label: 'Contacts', color: '#10B981' },
  { key: 'requests', label: 'Demandes', color: '#F59E0B' },
]

function formatDateLabel(dateStr: string, period: string): string {
  const d = new Date(dateStr)
  if (period === '7d') {
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
  }
  if (period === '90d') {
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function VisibilityChart({ timeline, period }: VisibilityChartProps) {
  const [activeMetrics, setActiveMetrics] = useState<Set<MetricKey>>(
    new Set(['impressions', 'clicks'])
  )

  const toggleMetric = (key: MetricKey) => {
    setActiveMetrics(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  // Downsample for 90d to avoid overcrowding
  const chartData = period === '90d'
    ? timeline.filter((_, i) => i % 3 === 0 || i === timeline.length - 1)
    : timeline

  const formattedData = chartData.map(entry => ({
    ...entry,
    label: formatDateLabel(entry.date, period),
  }))

  const hasData = timeline.some(d => d.impressions > 0 || d.clicks > 0 || d.contacts > 0 || d.requests > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
        <h3 className="text-base font-bold text-gray-900">Visibilite dans le temps</h3>
        <p className="text-sm text-gray-500 mt-0.5">Evolution de votre presence dans les resultats</p>
      </div>

      {/* Metric toggles */}
      <div className="px-5 pt-4 flex flex-wrap gap-2">
        {metrics.map(m => (
          <button
            key={m.key}
            onClick={() => toggleMetric(m.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
              activeMetrics.has(m.key)
                ? 'text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:text-gray-700'
            )}
            style={activeMetrics.has(m.key) ? { backgroundColor: m.color } : undefined}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: activeMetrics.has(m.key) ? '#fff' : m.color }}
            />
            {m.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-sm">Pas encore de donnees sur cette periode</p>
            <p className="text-xs mt-1">Les statistiques apparaitront des vos premieres apparitions</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                {metrics.map(m => (
                  <linearGradient key={m.key} id={`gradient-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={m.color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
                interval={period === '7d' ? 0 : 'preserveStartEnd'}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.06)',
                  fontSize: '12px',
                }}
              />
              {metrics.map(
                m =>
                  activeMetrics.has(m.key) && (
                    <Area
                      key={m.key}
                      type="monotone"
                      dataKey={m.key}
                      stroke={m.color}
                      strokeWidth={2}
                      fill={`url(#gradient-${m.key})`}
                      name={m.label}
                    />
                  )
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  )
}
