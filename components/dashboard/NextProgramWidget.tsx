'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronRight, Clock } from 'lucide-react'
import { formatTime, CATEGORY_COLORS, CATEGORY_LABELS } from '@/types/wedding-day-program'
import type { ProgramItem } from '@/types/wedding-day-program'

interface NextProgramWidgetProps {
  coupleId?: string
  weddingDate?: string
}

export function NextProgramWidget({ coupleId, weddingDate }: NextProgramWidgetProps) {
  const router = useRouter()
  const [items, setItems] = useState<ProgramItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!coupleId) return
    async function load() {
      try {
        const res = await fetch('/api/wedding-day-program')
        if (!res.ok) return
        const data = await res.json()
        const all: ProgramItem[] = data.items ?? []

        const today = new Date().toISOString().slice(0, 10)
        const isWeddingDay = weddingDate === today

        let shown: ProgramItem[]
        if (isWeddingDay) {
          // Show only slots after current time
          const nowTime = new Date().toTimeString().slice(0, 5) // "HH:MM"
          shown = all
            .filter(i => i.start_time.slice(0, 5) > nowTime)
            .slice(0, 1)
          // If nothing left today, show all (edge case)
          if (shown.length === 0) shown = all.slice(0, 1)
        } else {
          shown = all.slice(0, 3)
        }

        setItems(shown)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [coupleId, weddingDate])

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] p-4 sm:p-5 cursor-pointer hover:border-[#823F91]/20 hover:shadow-md transition-all"
      onClick={() => router.push('/couple/jour-j')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#823F91]/8 flex items-center justify-center">
            <CalendarDays className="h-4 w-4 text-[#823F91]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Programme du Jour J</h3>
            <p className="text-[11px] text-gray-500">
              {weddingDate === new Date().toISOString().slice(0, 10) ? "Aujourd'hui !" : 'Prochains créneaux'}
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300" />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 rounded-xl bg-gray-50 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-4">
          <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-400">Aucun créneau planifié</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const colors = CATEGORY_COLORS[item.category]
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl ${colors.bg} border ${colors.border}`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${colors.text} truncate`}>{item.title}</p>
                  <p className="text-[11px] text-gray-500 truncate">{CATEGORY_LABELS[item.category]}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-bold ${colors.text}`}>{formatTime(item.start_time)}</p>
                  {item.end_time && (
                    <p className="text-[10px] text-gray-400">→ {formatTime(item.end_time)}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
