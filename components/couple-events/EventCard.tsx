'use client'

import { motion } from 'framer-motion'
import { Calendar, ChevronRight, MapPin, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { TimelineEvent } from '@/types/cultural-events.types'
import { EVENT_CATEGORY_CONFIG, EVENT_STATUS_CONFIG } from '@/types/cultural-events.types'
import { cn } from '@/lib/utils'

interface EventCardProps {
  event: TimelineEvent
  index: number
  onClick: () => void
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date non définie'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getDaysInfo(dateStr: string | null): {
  label: string
  variant: 'today' | 'future' | 'past'
} | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eventDate = new Date(dateStr)
  eventDate.setHours(0, 0, 0, 0)
  const diff = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff === 0) return { label: "Aujourd'hui", variant: 'today' }
  if (diff > 0)   return { label: `Dans ${diff} jour${diff > 1 ? 's' : ''}`, variant: 'future' }
  return { label: `Il y a ${Math.abs(diff)} jour${Math.abs(diff) > 1 ? 's' : ''}`, variant: 'past' }
}

export function EventCard({ event, index, onClick }: EventCardProps) {
  const categoryConfig = event.category ? EVENT_CATEGORY_CONFIG[event.category] : null
  const statusConfig   = event.status   ? EVENT_STATUS_CONFIG[event.status]     : null
  const daysInfo       = getDaysInfo(event.event_date)

  const timeLabel =
    event.start_time
      ? `${event.start_time.slice(0, 5)}${event.end_time ? ` – ${event.end_time.slice(0, 5)}` : ''}`
      : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        className={cn(
          'group cursor-pointer transition-all duration-200 overflow-hidden',
          'hover:shadow-md hover:border-[#823F91]/30',
          'border-gray-200/80',
        )}
        onClick={onClick}
      >
        <CardContent className="p-3 sm:p-4 md:p-5 border-l-[3px] border-l-[#823F91]/40 group-hover:border-l-[#823F91]">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              {/* Titre + badge statut */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 flex-wrap">
                {categoryConfig && (
                  <span className="text-sm sm:text-base leading-none flex-shrink-0" title={categoryConfig.label}>
                    {categoryConfig.emoji}
                  </span>
                )}
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                  {event.title}
                </h3>
                {statusConfig && (
                  <span
                    className={cn(
                      'inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0',
                      statusConfig.bgColor,
                      statusConfig.color,
                    )}
                  >
                    {statusConfig.label}
                  </span>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-2.5 line-clamp-2 leading-relaxed">
                  {event.description}
                </p>
              )}

              {/* Meta : date, lieu, horaire */}
              <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-500">
                <span className="inline-flex items-center gap-1 sm:gap-1.5">
                  <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#823F91]/60 flex-shrink-0" />
                  <span className="truncate">{formatDate(event.event_date)}</span>
                </span>

                {event.location && (
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 max-w-[150px] sm:max-w-[200px]">
                    <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </span>
                )}

                {timeLabel && (
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-gray-400">
                    <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 flex-shrink-0" />
                    {timeLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Badge J-X + flèche */}
            <div className="flex flex-col items-end gap-1.5 sm:gap-2 flex-shrink-0">
              {daysInfo && (
                <span
                  className={cn(
                    'text-[10px] sm:text-[11px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap',
                    daysInfo.variant === 'today'  && 'bg-[#823F91]/10 text-[#823F91]',
                    daysInfo.variant === 'future' && 'bg-blue-50 text-blue-600',
                    daysInfo.variant === 'past'   && 'bg-gray-100 text-gray-400',
                  )}
                >
                  {daysInfo.label}
                </span>
              )}
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 group-hover:text-[#823F91] transition-colors mt-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
