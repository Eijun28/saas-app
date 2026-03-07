'use client'

import { motion } from 'framer-motion'
import { MapPin, Clock, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TimelineEvent } from '@/types/cultural-events.types'
import { EVENT_CATEGORY_CONFIG, EVENT_CATEGORY_VISUAL, EVENT_STATUS_CONFIG } from '@/types/cultural-events.types'

interface EventVisualSelectorProps {
  events: TimelineEvent[]
  onSelect: (event: TimelineEvent) => void
  onFindProvider?: (event: TimelineEvent) => void
}

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return 'Date non définie'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTimeRange(start: string | null, end: string | null): string | null {
  if (!start) return null
  const s = start.slice(0, 5)
  return end ? `${s} – ${end.slice(0, 5)}` : s
}

function getCountdown(dateStr: string | null): { label: string; variant: 'today' | 'future' | 'past' } | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eventDate = new Date(dateStr)
  eventDate.setHours(0, 0, 0, 0)
  const diff = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff === 0) return { label: "Aujourd'hui", variant: 'today' }
  if (diff > 0) return { label: `J-${diff}`, variant: 'future' }
  return { label: `J+${Math.abs(diff)}`, variant: 'past' }
}

export function EventVisualSelector({ events, onSelect, onFindProvider }: EventVisualSelectorProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Aucun événement pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {events.map((event, index) => {
        const category = event.category || 'other'
        const catConfig = EVENT_CATEGORY_CONFIG[category]
        const visual = EVENT_CATEGORY_VISUAL[category]
        const statusConfig = EVENT_STATUS_CONFIG[event.status]
        const countdown = getCountdown(event.event_date)
        const timeLabel = formatTimeRange(event.start_time, event.end_time)

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer"
            onClick={() => onSelect(event)}
          >
            <div
              className={cn(
                'relative rounded-xl border overflow-hidden transition-shadow hover:shadow-lg',
                visual.borderColor,
                visual.bgLight,
              )}
            >
              {/* Gradient header */}
              <div className={cn('h-2 bg-gradient-to-r', visual.gradient)} />

              <div className="p-4">
                {/* Top row: emoji + title + countdown */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg flex-shrink-0">{catConfig.emoji}</span>
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{event.title}</h3>
                  </div>
                  {countdown && (
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0',
                        countdown.variant === 'today' && 'bg-[#823F91]/10 text-[#823F91]',
                        countdown.variant === 'future' && 'bg-blue-100 text-blue-700',
                        countdown.variant === 'past' && 'bg-gray-100 text-gray-500',
                      )}
                    >
                      {countdown.label}
                    </span>
                  )}
                </div>

                {/* Date */}
                <p className={cn('text-xs font-medium mb-1.5', visual.accent)}>
                  {formatShortDate(event.event_date)}
                </p>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
                  {timeLabel && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeLabel}
                    </span>
                  )}
                  {event.location && (
                    <span className="inline-flex items-center gap-1 truncate max-w-[160px]">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                  )}
                </div>

                {/* Bottom: status badge + find provider button */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
                      statusConfig.bgColor,
                      statusConfig.color,
                    )}
                  >
                    {statusConfig.label}
                  </span>

                  {onFindProvider && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 border-[#823F91]/30 text-[#823F91] hover:bg-[#823F91]/5"
                      onClick={(e) => {
                        e.stopPropagation()
                        onFindProvider(event)
                      }}
                    >
                      <Search className="h-3 w-3" />
                      Trouver un prestataire
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
