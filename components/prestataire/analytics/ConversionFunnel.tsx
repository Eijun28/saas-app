'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FunnelStep {
  label: string
  value: number
}

interface ConversionFunnelProps {
  funnel: FunnelStep[]
}

export function ConversionFunnel({ funnel }: ConversionFunnelProps) {
  const maxValue = Math.max(...funnel.map(f => f.value), 1)
  const hasData = funnel.some(f => f.value > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
        <h3 className="text-base font-bold text-gray-900">Entonnoir de conversion</h3>
        <p className="text-sm text-gray-500 mt-0.5">Du premier affichage au devis accepte</p>
      </div>

      <div className="p-5">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <p className="text-sm">Aucune donnee disponible</p>
          </div>
        ) : (
          <div className="space-y-3">
            {funnel.map((step, index) => {
              const widthPercent = Math.max((step.value / maxValue) * 100, 8)
              const conversionFromPrev =
                index > 0 && funnel[index - 1].value > 0
                  ? Math.round((step.value / funnel[index - 1].value) * 100)
                  : null

              // Gradient from purple to emerald through the funnel
              const colors = [
                'from-blue-400 to-blue-500',
                'from-indigo-400 to-indigo-500',
                'from-[#823F91] to-[#9D5FA8]',
                'from-purple-500 to-purple-600',
                'from-emerald-400 to-emerald-500',
                'from-emerald-500 to-emerald-600',
              ]
              const colorClass = colors[index] || colors[colors.length - 1]

              return (
                <div key={step.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{step.label}</span>
                      {conversionFromPrev !== null && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                          {conversionFromPrev}%
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-900 tabular-nums">{step.value}</span>
                  </div>
                  <div className="h-7 bg-gray-100 rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercent}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                      className={cn(
                        'h-full rounded-lg bg-gradient-to-r',
                        colorClass
                      )}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
