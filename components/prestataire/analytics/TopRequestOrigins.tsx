'use client'

import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Sparkles, Search, HelpCircle } from 'lucide-react'

interface RequestOrigin {
  source: string   // 'matching' | 'recherche' | 'unknown'
  label:  string
  count:  number
}

interface TopRequestOriginsProps {
  data: RequestOrigin[]
  total: number
}

const COLORS: Record<string, string> = {
  matching:  '#823F91',
  recherche: '#6366f1',
  unknown:   '#e5e7eb',
}

const ICONS: Record<string, React.ElementType> = {
  matching:  Sparkles,
  recherche: Search,
  unknown:   HelpCircle,
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700">{payload[0].name}</p>
      <p className="text-[#823F91] font-bold mt-0.5">{payload[0].value} demandes</p>
    </div>
  )
}

export function TopRequestOrigins({ data, total }: TopRequestOriginsProps) {
  const hasData = data.some(d => d.count > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="bg-white rounded-2xl border border-gray-100 p-5"
    >
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900">Origine des demandes</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">Matching IA vs Recherche manuelle</p>
      </div>

      {!hasData ? (
        <div className="h-32 flex flex-col items-center justify-center text-gray-300">
          <Sparkles className="h-7 w-7 mb-2 opacity-40" />
          <p className="text-xs text-center">Le suivi des sources sera disponible<br/>pour les prochaines demandes</p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={120}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={52}
                paddingAngle={3}
              >
                {data.map((entry) => (
                  <Cell key={entry.source} fill={COLORS[entry.source] ?? '#e5e7eb'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex-1 space-y-2">
            {data.map(entry => {
              const pct   = total > 0 ? Math.round((entry.count / total) * 100) : 0
              const Icon  = ICONS[entry.source] ?? HelpCircle
              const color = COLORS[entry.source] ?? '#e5e7eb'
              return (
                <div key={entry.source} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-gray-700 truncate">{entry.label}</span>
                      <span className="text-[12px] font-bold ml-2" style={{ color }}>{pct}%</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full mt-0.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}
