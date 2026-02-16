'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, RefreshCw, Download } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { LoadingSpinner } from '@/components/prestataire/shared/LoadingSpinner'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import { KpiGrid } from '@/components/prestataire/analytics/KpiGrid'
import { VisibilityChart } from '@/components/prestataire/analytics/VisibilityChart'
import { ConversionFunnel } from '@/components/prestataire/analytics/ConversionFunnel'
import { DevisStats } from '@/components/prestataire/analytics/DevisStats'
import { cn } from '@/lib/utils'

type Period = '7d' | '30d' | '90d'

interface AnalyticsData {
  period: string
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
    devisAmount: number
    devisAcceptedAmount: number
    totalRevenue: number
    avgRating: number
    reviewCount: number
    avgPosition: number
    totalConversations: number
  }
  deltas: {
    impressions: number
    clicks: number
    contacts: number
    ctr: number
    requests: number
    devis: number
  }
  timeline: { date: string; impressions: number; clicks: number; contacts: number; requests: number }[]
  funnel: { label: string; value: number }[]
  devisByStatus: { status: string; label: string; count: number }[]
  requestsByStatus: { status: string; label: string; count: number }[]
}

export default function AnalyticsPage() {
  const { user } = useUser()
  const [period, setPeriod] = useState<Period>('30d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAnalytics = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/prestataire/analytics?period=${period}`)
      if (!res.ok) throw new Error('Erreur de chargement')
      const json = await res.json()
      setData(json)
      setLastUpdated(new Date())
    } catch (err: any) {
      console.error('Analytics fetch error:', err)
      setError(err?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [user, period])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (!user) return <LoadingSpinner size="lg" text="Chargement..." />

  if (loading && !data) {
    return <LoadingSpinner size="lg" text="Chargement de vos statistiques..." />
  }

  if (error && !data) {
    return (
      <EmptyState
        title="Erreur de chargement"
        description={error}
        action={{ label: 'Reessayer', onClick: fetchAnalytics }}
      />
    )
  }

  if (!data) return null

  return (
    <div className="w-full">
      <div className="w-full space-y-6 sm:space-y-8">
        {/* Header — coherent avec les autres pages */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F5F0F7] via-white to-[#E8D4EF]/30 border border-[#823F91]/8 p-5 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Mes statistiques
              </h1>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Suivez votre visibilite et vos performances
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Period filter */}
              <div className="flex items-center gap-0.5 sm:gap-1 p-1 bg-white/80 rounded-full shadow-sm border border-gray-100">
                {([
                  { value: '7d' as Period, label: '7j' },
                  { value: '30d' as Period, label: '30j' },
                  { value: '90d' as Period, label: '90j' },
                ]).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setPeriod(value)}
                    className={cn(
                      'px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150',
                      period === value
                        ? 'bg-[#823F91] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Refresh */}
              <button
                onClick={fetchAnalytics}
                disabled={loading}
                className="p-2 hover:bg-white/60 rounded-lg transition-colors disabled:opacity-50"
                title="Actualiser"
              >
                <RefreshCw className={cn('h-4 w-4 text-gray-400', loading && 'animate-spin')} />
              </button>

              {lastUpdated && (
                <span className="text-[11px] text-gray-400">
                  {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#823F91]/[0.04] pointer-events-none" />
          <div className="absolute -bottom-6 -right-3 w-20 h-20 rounded-full bg-[#823F91]/[0.03] pointer-events-none" />
        </motion.div>

        {/* Loading overlay for period change */}
        {loading && data && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#823F91]/5 rounded-xl">
            <RefreshCw className="h-3.5 w-3.5 text-[#823F91] animate-spin" />
            <span className="text-xs text-[#823F91] font-medium">Mise a jour...</span>
          </div>
        )}

        {/* KPI Grid */}
        <KpiGrid kpis={data.kpis} deltas={data.deltas} />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <VisibilityChart timeline={data.timeline} period={data.period} />
          <ConversionFunnel funnel={data.funnel} />
        </div>

        {/* Devis & Requests stats */}
        <DevisStats
          devisByStatus={data.devisByStatus}
          requestsByStatus={data.requestsByStatus}
          kpis={{
            acceptanceRate: data.kpis.acceptanceRate,
            devisConversionRate: data.kpis.devisConversionRate,
            devisAmount: data.kpis.devisAmount,
            totalRevenue: data.kpis.totalRevenue,
          }}
        />

        {/* Position info */}
        {data.kpis.avgPosition > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="p-4 bg-gradient-to-r from-[#F5F0F7] to-[#E8D4EF]/40 border border-[#823F91]/8 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#823F91]/10 rounded-xl">
                <BarChart3 className="h-4 w-4 text-[#823F91]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Position moyenne dans les resultats : <span className="text-[#823F91]">#{data.kpis.avgPosition}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Basee sur {data.kpis.impressions} apparitions sur la periode
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
