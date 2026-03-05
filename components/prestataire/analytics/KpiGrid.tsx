'use client'

import { motion } from 'framer-motion'
import {
  Eye,
  MousePointerClick,
  UserPlus,
  Heart,
  TrendingUp,
  FileText,
  Star,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface KpiCardData {
  icon: LucideIcon
  label: string
  value: string | number
  suffix?: string
  delta?: number
  deltaSuffix?: string
  color: string
  bgColor: string
  sparklineKey?: string
}

interface TimelineEntry {
  date: string
  impressions: number
  clicks: number
  contacts: number
  requests: number
}

interface KpiGridProps {
  kpis: {
    impressions: number
    clicks: number
    contacts: number
    favorites: number
    ctr: number
    contactRate: number
    totalRequests: number
    acceptanceRate: number
    totalDevis: number
    devisConversionRate: number
    devisAcceptedAmount: number
    totalRevenue: number
    avgRating: number
    reviewCount: number
    avgPosition: number
  }
  deltas: {
    impressions: number
    clicks: number
    contacts: number
    ctr: number
    requests: number
    devis: number
  }
  timeline?: TimelineEntry[]
}

function MiniSparkline({ data, dataKey, color }: { data: TimelineEntry[]; dataKey: string; color: string }) {
  if (!data || data.length < 2) return null
  return (
    <div className="h-8 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${dataKey})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function KpiGrid({ kpis, deltas, timeline }: KpiGridProps) {
  const SPARKLINE_COLORS: Record<string, string> = {
    impressions: '#3B82F6',
    clicks: '#6366F1',
    contacts: '#10B981',
    requests: '#F59E0B',
  }

  const cards: KpiCardData[] = [
    {
      icon: Eye,
      label: 'Apparitions',
      value: kpis.impressions,
      delta: deltas.impressions,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      sparklineKey: 'impressions',
    },
    {
      icon: MousePointerClick,
      label: 'Clics profil',
      value: kpis.clicks,
      delta: deltas.clicks,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      sparklineKey: 'clicks',
    },
    {
      icon: TrendingUp,
      label: 'Taux de clic',
      value: kpis.ctr,
      suffix: '%',
      delta: deltas.ctr,
      deltaSuffix: 'pts',
      color: 'text-[#823F91]',
      bgColor: 'bg-[#823F91]/8',
    },
    {
      icon: UserPlus,
      label: 'Contacts',
      value: kpis.contacts,
      delta: deltas.contacts,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      sparklineKey: 'contacts',
    },
    {
      icon: Heart,
      label: 'Favoris',
      value: kpis.favorites,
      color: 'text-rose-500',
      bgColor: 'bg-rose-50',
    },
    {
      icon: FileText,
      label: 'Demandes',
      value: kpis.totalRequests,
      delta: deltas.requests,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      sparklineKey: 'requests',
    },
    {
      icon: FileText,
      label: 'Devis envoyes',
      value: kpis.totalDevis,
      delta: deltas.devis,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      icon: DollarSign,
      label: 'CA devis acceptes',
      value: kpis.devisAcceptedAmount > 0 ? `${kpis.devisAcceptedAmount.toLocaleString('fr-FR')}` : '0',
      suffix: '\u20AC',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: Star,
      label: 'Note moyenne',
      value: kpis.avgRating > 0 ? kpis.avgRating : '-',
      suffix: kpis.avgRating > 0 ? `/5 (${kpis.reviewCount})` : '',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.06)] transition-shadow"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', card.bgColor)}>
                <Icon className={cn('h-4 w-4', card.color)} />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {card.label}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 tabular-nums">
                {card.value}
              </span>
              {card.suffix && (
                <span className="text-sm text-gray-500">{card.suffix}</span>
              )}
            </div>

            {card.delta !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                    card.delta > 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : card.delta < 0
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {card.delta > 0 ? (
                    <ArrowUpRight className="h-2.5 w-2.5" />
                  ) : card.delta < 0 ? (
                    <ArrowDownRight className="h-2.5 w-2.5" />
                  ) : (
                    <Minus className="h-2.5 w-2.5" />
                  )}
                  {card.delta > 0 ? '+' : ''}{card.delta}{card.deltaSuffix || ''}
                </span>
                <span className="text-[10px] text-gray-400">vs periode prec.</span>
              </div>
            )}

            {card.sparklineKey && timeline && timeline.length >= 2 && (
              <MiniSparkline
                data={timeline}
                dataKey={card.sparklineKey}
                color={SPARKLINE_COLORS[card.sparklineKey] || '#823F91'}
              />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
