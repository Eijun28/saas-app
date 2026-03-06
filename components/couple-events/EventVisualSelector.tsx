'use client'

import type { MouseEvent } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock, Search, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimelineEvent, EventCategory } from '@/types/cultural-events.types'
import {
  EVENT_CATEGORY_CONFIG,
  EVENT_STATUS_CONFIG,
  EVENT_CATEGORY_VISUAL,
} from '@/types/cultural-events.types'

interface EventVisualSelectorProps {
  events: TimelineEvent[]
  onSelect: (event: TimelineEvent) => void
  onFindProvider?: (event: TimelineEvent) => void
}

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

function formatTimeRange(start: string | null, end: string | null): string | null {
  if (!start) return null
  const s = start.slice(0, 5)
  return end ? `${s} - ${end.slice(0, 5)}` : s
}

function getCountdown(dateStr: string | null): { label: string; urgent: boolean } | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return { label: "Aujourd'hui", urgent: true }
  if (diff < 0) return { label: 'Passe', urgent: false }
  if (diff <= 7) return { label: `J-${diff}`, urgent: true }
  if (diff <= 30) return { label: `J-${diff}`, urgent: false }
  return { label: `${Math.ceil(diff / 7)} sem.`, urgent: false }
}

export function EventVisualSelector({ events, onSelect, onFindProvider }: EventVisualSelectorProps) {
  if (events.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {events.map((event, i) => {
        const category = event.category || 'other'
        const catConfig = EVENT_CATEGORY_CONFIG[category]
        const visual = EVENT_CATEGORY_VISUAL[category]
        const statusConfig = EVENT_STATUS_CONFIG[event.status]
        const countdown = getCountdown(event.event_date)
        const timeRange = formatTimeRange(event.start_time, event.end_time)

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, delay: i * 0.06, ease: 'easeOut' }}
          >
            <button
              onClick={() => onSelect(event)}
              className={cn(
                'group relative w-full text-left rounded-2xl border overflow-hidden',
                'transition-all duration-200',
                'hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5',
                'focus:outline-none focus:ring-2 focus:ring-[#823F91]/30 focus:ring-offset-2',
                visual.borderColor,
              )}
            >
              {/* Gradient background */}
              <div className={cn('absolute inset-0 bg-gradient-to-br', visual.gradient)} />

              {/* Content */}
              <div className="relative p-4 sm:p-5">
                {/* Top row: emoji + countdown */}
                <div className="flex items-start justify-between mb-3">
                  <div className={cn(
                    'flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl',
                    visual.bgLight,
                    'transition-transform duration-200 group-hover:scale-110',
                  )}>
                    <span className="text-2xl sm:text-3xl leading-none">{catConfig.emoji}</span>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {countdown && (
                      <span className={cn(
                        'text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full',
                        countdown.urgent
                          ? 'bg-[#823F91]/15 text-[#823F91]'
                          : 'bg-gray-100 text-gray-500',
                      )}>
                        {countdown.label}
                      </span>
                    )}
                    <span className={cn(
                      'text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full',
                      statusConfig.bgColor,
                      statusConfig.color,
                    )}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-[#823F91] transition-colors">
                  {event.title}
                </h3>

                {/* Category label */}
                <p className={cn('text-[11px] sm:text-xs font-medium mb-3', visual.accent)}>
                  {catConfig.label}
                </p>

                {/* Description (if any) */}
                {event.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                    {event.description}
                  </p>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] sm:text-xs text-gray-500">
                  {event.event_date && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {formatShortDate(event.event_date)}
                    </span>
                  )}
                  {event.location && (
                    <span className="inline-flex items-center gap-1 max-w-[120px] sm:max-w-[150px]">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="truncate">{event.location}</span>
                    </span>
                  )}
                  {timeRange && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      {timeRange}
                    </span>
                  )}
                </div>

                {/* Action footer */}
                <div className="mt-4 pt-3 border-t border-gray-100/80 flex items-center justify-between">
                  {onFindProvider && (
                    <button
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation()
                        onFindProvider(event)
                      }}
                      className={cn(
                        'inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold',
                        'text-[#823F91] hover:text-[#6D3478] transition-colors',
                      )}
                    >
                      <Search className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Trouver un prestataire
                    </button>
                  )}
                  <ChevronRight className={cn(
                    'h-4 w-4 text-gray-300 group-hover:text-[#823F91] transition-all ml-auto',
                    'group-hover:translate-x-0.5',
                  )} />
                </div>
              </div>
            </button>
          </motion.div>
        )
      })}
    </div>
  )
}
