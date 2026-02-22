'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AvailabilityStatus } from '@/types/provider-availability'
import { STATUS_CONFIG } from '@/types/provider-availability'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarProps {
  /** Map date "YYYY-MM-DD" → status (calculée en amont) */
  dateMap:        Map<string, AvailabilityStatus>
  /** Appelé quand on clique sur une date (pour ajouter un slot depuis ce jour) */
  onDayClick?:    (date: string) => void
  /** Si true, affiche un curseur pointer sur les dates cliquables */
  interactive?:   boolean
  /** Nombre de mois à afficher côte à côte */
  monthCount?:    1 | 2
}

const DAYS_FR  = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildMonthGrid(year: number, month: number): (string | null)[][] {
  const firstDay = new Date(year, month, 1)
  // Lundi = 0 … Dimanche = 6
  const startDow = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks: (string | null)[][] = []
  let week: (string | null)[] = Array(startDow).fill(null)

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    week.push(iso)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function AvailabilityMiniCalendar({
  dateMap,
  onDayClick,
  interactive = false,
  monthCount  = 2,
}: CalendarProps) {
  const today  = new Date().toISOString().slice(0, 10)
  const now    = new Date()
  const [baseMonth, setBaseMonth] = useState<{ year: number; month: number }>({
    year:  now.getFullYear(),
    month: now.getMonth(),
  })

  const months = useMemo(() => {
    const result = []
    for (let i = 0; i < monthCount; i++) {
      let m = baseMonth.month + i
      let y = baseMonth.year
      while (m >= 12) { m -= 12; y++ }
      result.push({ year: y, month: m, grid: buildMonthGrid(y, m) })
    }
    return result
  }, [baseMonth, monthCount])

  function prevMonth() {
    setBaseMonth(({ year, month }) => {
      if (month === 0) return { year: year - 1, month: 11 }
      return { year, month: month - 1 }
    })
  }

  function nextMonth() {
    setBaseMonth(({ year, month }) => {
      if (month === 11) return { year: year + 1, month: 0 }
      return { year, month: month + 1 }
    })
  }

  return (
    <div className="select-none">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-lg text-gray-600 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-gray-700">
          {MONTHS_FR[months[0].month]} {months[0].year}
          {monthCount > 1 && ` — ${MONTHS_FR[months[monthCount - 1].month]} ${months[monthCount - 1].year}`}
        </span>
        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-lg text-gray-600 hover:text-gray-900">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grilles */}
      <div className={cn('gap-6', monthCount > 1 ? 'grid grid-cols-1 sm:grid-cols-2' : 'block')}>
        {months.map(({ year, month, grid }) => (
          <div key={`${year}-${month}`}>
            {/* Entête du mois (si plusieurs mois) */}
            {monthCount > 1 && (
              <p className="text-xs font-semibold text-gray-500 text-center mb-2">
                {MONTHS_FR[month]} {year}
              </p>
            )}

            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS_FR.map((d, i) => (
                <div key={i} className="text-center text-[11px] font-medium text-gray-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Semaines */}
            {grid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((iso, di) => {
                  if (!iso) return <div key={di} />
                  const status   = dateMap.get(iso)
                  const isToday  = iso === today
                  const isPast   = iso < today
                  const cfg      = status ? STATUS_CONFIG[status] : null

                  return (
                    <button
                      key={di}
                      type="button"
                      disabled={!interactive || isPast}
                      onClick={() => onDayClick?.(iso)}
                      className={cn(
                        'relative flex items-center justify-center h-8 w-full text-[12px] rounded-md transition-colors',
                        isPast ? 'opacity-40 cursor-not-allowed' : '',
                        interactive && !isPast ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-default',
                        isToday ? 'font-bold ring-1 ring-[#823F91]/50' : '',
                        cfg ? `${cfg.calBg} ${cfg.calText} font-medium` : 'text-gray-700',
                      )}
                      title={status ? STATUS_CONFIG[status].label : undefined}
                    >
                      {parseInt(iso.slice(8), 10)}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
        {(Object.entries(STATUS_CONFIG) as [AvailabilityStatus, typeof STATUS_CONFIG[AvailabilityStatus]][]).map(([k, cfg]) => (
          <div key={k} className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className={cn('h-3 w-3 rounded-sm', cfg.calBg)} />
            {cfg.label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="h-3 w-3 rounded-sm bg-white border border-gray-200" />
          Disponible
        </div>
      </div>
    </div>
  )
}
