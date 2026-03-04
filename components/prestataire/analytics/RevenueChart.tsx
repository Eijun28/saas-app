'use client'

import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { TrendingUp, Euro } from 'lucide-react'

interface MonthRevenue {
  month: string   // ex: "2026-02"
  revenue: number
  label: string   // ex: "Fév."
}

interface RevenueChartProps {
  data: MonthRevenue[]
  totalRevenue: number
}

function formatEuro(v: number) {
  return v >= 1000
    ? `${(v / 1000).toFixed(1)}k€`
    : `${v.toLocaleString('fr-FR')} €`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-[#823F91] font-bold">{payload[0].value.toLocaleString('fr-FR')} €</p>
    </div>
  )
}

export function RevenueChart({ data, totalRevenue }: RevenueChartProps) {
  const hasData = data.some(d => d.revenue > 0)
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="bg-white rounded-2xl border border-gray-100 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Chiffre d'affaires mensuel</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Factures encaissées</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-xl">
          <Euro className="h-3.5 w-3.5 text-green-600" />
          <span className="text-sm font-bold text-green-700">{formatEuro(totalRevenue)}</span>
        </div>
      </div>

      {!hasData ? (
        <div className="h-40 flex flex-col items-center justify-center text-gray-300">
          <TrendingUp className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-xs">Aucune facture encaissée sur la période</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatEuro}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6', radius: 6 }} />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.revenue === maxRevenue ? '#823F91' : '#E8D4EF'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}
