'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimelineEvent } from '@/types/cultural-events.types'
import { EVENT_CATEGORY_CONFIG, EVENT_STATUS_CONFIG } from '@/types/cultural-events.types'

interface EventCalendarViewProps {
  events: TimelineEvent[]
  onEventClick: (event: TimelineEvent) => void
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function getInitialMonth(events: TimelineEvent[]): Date {
  const now = new Date()
  const futureEvent = events.find(e => new Date(e.event_date) >= now)
  return futureEvent ? new Date(futureEvent.event_date) : now
}

export function EventCalendarView({ events, onEventClick }: EventCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => getInitialMonth(events))

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Compute calendar grid (Monday-first)
  let startDayOfWeek = new Date(year, month, 1).getDay()
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const totalCells   = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7
  const cells: (number | null)[] = []
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)
  while (cells.length < totalCells) cells.push(null)

  // Index events by day of the current month
  const eventsByDay = new Map<number, TimelineEvent[]>()
  for (const event of events) {
    const d = new Date(event.event_date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!eventsByDay.has(day)) eventsByDay.set(day, [])
      eventsByDay.get(day)!.push(event)
    }
  }

  const today     = new Date()
  const isToday   = (day: number) =>
    day === today.getDate() && year === today.getFullYear() && month === today.getMonth()

  const monthLabel = new Date(year, month, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-gray-200 bg-white overflow-hidden"
    >
      {/* Navigation header — Google Calendar style */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gray-50/50">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="p-2.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1.5 flex items-center justify-center text-[#823F91] hover:bg-[#F5F0F7] rounded-full transition-colors active:scale-95 touch-manipulation"
        >
          <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
        </button>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="flex-1 min-w-0 group"
        >
          <h3 className="text-sm font-semibold text-[#823F91] sm:text-gray-800 text-center capitalize truncate px-2 group-active:opacity-60 transition-opacity">
            {monthLabel}
          </h3>
        </button>
        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="p-2.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1.5 flex items-center justify-center text-[#823F91] hover:bg-[#F5F0F7] rounded-full transition-colors active:scale-95 touch-manipulation"
        >
          <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/30">
        {DAY_LABELS.map(day => (
          <div
            key={day}
            className="py-2 sm:py-2.5 text-center text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          const dayEvents  = day ? (eventsByDay.get(day) ?? []) : []
          const isLastCol  = idx % 7 === 6
          const isLastRow  = idx >= cells.length - 7

          return (
            <div
              key={idx}
              className={cn(
                'min-h-[70px] sm:min-h-[90px] md:min-h-[100px] p-1 sm:p-2',
                !isLastCol && 'border-r border-gray-100',
                !isLastRow && 'border-b border-gray-100',
                !day && 'bg-gray-50/40',
              )}
            >
              {day && (
                <>
                  <div
                    className={cn(
                      'h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs mb-1 mx-auto',
                      isToday(day)
                        ? 'bg-[#823F91] text-white font-semibold'
                        : dayEvents.length > 0
                          ? 'font-semibold text-gray-800'
                          : 'text-gray-500',
                    )}
                  >
                    {day}
                  </div>

                  {/* Mobile: dots, Desktop: pills */}
                  <div className="space-y-0.5 sm:space-y-1">
                    {/* Mobile dots */}
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 justify-center sm:hidden">
                        {dayEvents.slice(0, 3).map((event, i) => {
                          const statusConf = event.status ? EVENT_STATUS_CONFIG[event.status] : null
                          return (
                            <div
                              key={i}
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                statusConf?.color ? 'bg-current' : 'bg-[#823F91]',
                              )}
                              style={statusConf?.color ? { color: statusConf.color.replace('text-', '') } : undefined}
                              onClick={() => onEventClick(dayEvents[i])}
                            />
                          )
                        })}
                        {dayEvents.length > 3 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        )}
                      </div>
                    )}
                    {/* Desktop pills */}
                    <div className="hidden sm:block space-y-0.5">
                      {dayEvents.slice(0, 2).map(event => {
                        const catEmoji   = event.category ? EVENT_CATEGORY_CONFIG[event.category]?.emoji : null
                        const statusConf = event.status   ? EVENT_STATUS_CONFIG[event.status]             : null
                        return (
                          <button
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            title={event.title}
                            className={cn(
                              'w-full text-left text-[10px] leading-snug px-1.5 py-0.5 rounded truncate font-medium transition-colors',
                              statusConf?.bgColor ?? 'bg-[#823F91]/10',
                              statusConf?.color   ?? 'text-[#823F91]',
                              'hover:opacity-80',
                            )}
                          >
                            {catEmoji ? `${catEmoji} ` : ''}{event.title}
                          </button>
                        )
                      })}
                      {dayEvents.length > 2 && (
                        <p className="text-[9px] text-gray-400 pl-1">
                          +{dayEvents.length - 2}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Message si aucun événement ce mois */}
      {eventsByDay.size === 0 && (
        <div className="py-4 text-center text-xs text-gray-400 border-t border-gray-50">
          Aucun événement ce mois-ci
        </div>
      )}
    </motion.div>
  )
}
