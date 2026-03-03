'use client'

import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Star } from 'lucide-react'

interface ReviewsMonth {
  month: string
  label: string
  avgRating: number
  count: number
}

interface ReviewsEvolutionProps {
  data: ReviewsMonth[]
  currentAvg: number
  reviewCount: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-amber-500 font-bold flex items-center gap-1">
        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
        {payload[0].value.toFixed(1)} / 5
      </p>
      <p className="text-gray-400 mt-0.5">{payload[1]?.value ?? 0} avis</p>
    </div>
  )
}

export function ReviewsEvolution({ data, currentAvg, reviewCount }: ReviewsEvolutionProps) {
  const hasData = data.some(d => d.avgRating > 0)

  const stars = Math.round(currentAvg)
  const color = currentAvg >= 4.5 ? '#10b981' : currentAvg >= 3.5 ? '#f59e0b' : '#ef4444'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-white rounded-2xl border border-gray-100 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Évolution des avis</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Note moyenne dans le temps</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            {[1,2,3,4,5].map(s => (
              <Star
                key={s}
                className={`h-3.5 w-3.5 ${s <= stars ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
              />
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">{reviewCount} avis · moy. {currentAvg.toFixed(1)}</p>
        </div>
      </div>

      {!hasData ? (
        <div className="h-40 flex flex-col items-center justify-center text-gray-300">
          <Star className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-xs">Pas encore d'avis sur la période</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine y={4} stroke="#f0fdf4" strokeWidth={1.5} strokeDasharray="4 4" />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="avgRating"
              stroke={color}
              strokeWidth={2.5}
              dot={{ fill: color, strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6 }}
            />
            {/* Ligne count en arrière-plan (invisible, pour le tooltip) */}
            <Line type="monotone" dataKey="count" stroke="transparent" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}
