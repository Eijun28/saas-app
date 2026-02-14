'use client'

import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface DevisStatusEntry {
  status: string
  label: string
  count: number
}

interface RequestStatusEntry {
  status: string
  label: string
  count: number
}

interface DevisStatsProps {
  devisByStatus: DevisStatusEntry[]
  requestsByStatus: RequestStatusEntry[]
  kpis: {
    acceptanceRate: number
    devisConversionRate: number
    devisAmount: number
    totalRevenue: number
  }
}

const DEVIS_COLORS: Record<string, string> = {
  accepted: '#10B981',
  pending: '#F59E0B',
  rejected: '#EF4444',
  negotiating: '#6366F1',
}

const REQUEST_COLORS: Record<string, string> = {
  accepted: '#10B981',
  pending: '#F59E0B',
  rejected: '#EF4444',
}

function MiniDonut({ data, colors }: { data: { label: string; count: number; status: string }[]; colors: Record<string, string> }) {
  const filteredData = data.filter(d => d.count > 0)
  if (filteredData.length === 0) {
    return (
      <div className="w-24 h-24 rounded-full border-8 border-gray-100 flex items-center justify-center">
        <span className="text-xs text-gray-400">-</span>
      </div>
    )
  }

  return (
    <ResponsiveContainer width={96} height={96}>
      <PieChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          innerRadius={28}
          outerRadius={44}
          dataKey="count"
          nameKey="label"
          strokeWidth={2}
          stroke="#fff"
        >
          {filteredData.map(entry => (
            <Cell key={entry.status} fill={colors[entry.status] || '#9CA3AF'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '11px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function DevisStats({ devisByStatus, requestsByStatus, kpis }: DevisStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
        <h3 className="text-base font-bold text-gray-900">Demandes & Devis</h3>
        <p className="text-sm text-gray-500 mt-0.5">Repartition et taux de conversion</p>
      </div>

      <div className="p-5 space-y-6">
        {/* Summary rates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Taux acceptation demandes
            </p>
            <p className="text-2xl font-bold text-gray-900">{kpis.acceptanceRate}%</p>
          </div>
          <div className="p-3 bg-[#823F91]/5 rounded-xl">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#823F91]/60 mb-1">
              Taux conversion devis
            </p>
            <p className="text-2xl font-bold text-[#823F91]">{kpis.devisConversionRate}%</p>
          </div>
        </div>

        {/* Donut charts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center gap-3">
            <MiniDonut data={requestsByStatus} colors={REQUEST_COLORS} />
            <p className="text-xs font-medium text-gray-600">Demandes</p>
            <div className="space-y-1">
              {requestsByStatus.map(r => (
                <div key={r.status} className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: REQUEST_COLORS[r.status] }}
                  />
                  <span className="text-gray-600">{r.label}</span>
                  <span className="font-semibold text-gray-900 ml-auto">{r.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <MiniDonut data={devisByStatus} colors={DEVIS_COLORS} />
            <p className="text-xs font-medium text-gray-600">Devis</p>
            <div className="space-y-1">
              {devisByStatus.map(d => (
                <div key={d.status} className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: DEVIS_COLORS[d.status] }}
                  />
                  <span className="text-gray-600">{d.label}</span>
                  <span className="font-semibold text-gray-900 ml-auto">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue summary */}
        {(kpis.devisAmount > 0 || kpis.totalRevenue > 0) && (
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 mb-1">
                  Montant devis
                </p>
                <p className="text-lg font-bold text-emerald-800">
                  {kpis.devisAmount.toLocaleString('fr-FR')} &euro;
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 mb-1">
                  CA facture
                </p>
                <p className="text-lg font-bold text-emerald-800">
                  {kpis.totalRevenue.toLocaleString('fr-FR')} &euro;
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
