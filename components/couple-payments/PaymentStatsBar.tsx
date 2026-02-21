'use client'

import { TrendingDown, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import type { PaymentStats } from '@/types/couple-payments'
import { formatEuro } from '@/types/couple-payments'
import { cn } from '@/lib/utils'

interface PaymentStatsBarProps {
  stats: PaymentStats
}

interface StatCardProps {
  icon:      React.ReactNode
  label:     string
  value:     string
  sub?:      string
  color:     string
}

function StatCard({ icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className={cn('rounded-2xl border p-4 flex items-start gap-3', color)}>
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-[12px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function PaymentStatsBar({ stats }: PaymentStatsBarProps) {
  const progressPct = stats.totalCommitted > 0
    ? Math.round((stats.totalPaid / stats.totalCommitted) * 100)
    : 0

  return (
    <div className="space-y-3">
      {/* Cartes KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<TrendingDown className="h-4 w-4 text-gray-400" />}
          label="Total engagé"
          value={formatEuro(stats.totalCommitted)}
          sub={`${progressPct}% réglé`}
          color="bg-white border-gray-100"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
          label="Déjà payé"
          value={formatEuro(stats.totalPaid)}
          sub={`${stats.paidCount} paiement${stats.paidCount > 1 ? 's' : ''} soldé${stats.paidCount > 1 ? 's' : ''}`}
          color="bg-white border-gray-100"
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-blue-400" />}
          label="Reste à payer"
          value={formatEuro(stats.totalRemaining)}
          color="bg-white border-gray-100"
        />
        <StatCard
          icon={<AlertCircle className="h-4 w-4 text-red-500" />}
          label="En retard"
          value={formatEuro(stats.overdueAmount)}
          sub={stats.overdueCount > 0 ? `${stats.overdueCount} paiement${stats.overdueCount > 1 ? 's' : ''}` : 'Aucun retard'}
          color={stats.overdueCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}
        />
      </div>

      {/* Barre de progression */}
      {stats.totalCommitted > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-gray-500">Progression des paiements</span>
            <span className="text-[13px] font-semibold text-gray-700">{progressPct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#823F91] to-[#B86FD0] rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-gray-400">{formatEuro(stats.totalPaid)} payé</span>
            <span className="text-[11px] text-gray-400">{formatEuro(stats.totalRemaining)} restant</span>
          </div>
        </div>
      )}
    </div>
  )
}
