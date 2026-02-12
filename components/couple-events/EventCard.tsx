'use client'

import { motion } from 'framer-motion'
import { Calendar, ChevronRight, MapPin, Users, Wallet, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EventStatusBadge } from './EventStatusBadge'
import type { CoupleEvent } from '@/types/cultural-events.types'
import { cn } from '@/lib/utils'

interface EventCardProps {
  event: CoupleEvent
  index: number
  onClick: () => void
  providerCount?: number
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

function formatBudget(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  if (min && max) return `${min.toLocaleString('fr-FR')} - ${max.toLocaleString('fr-FR')} €`
  if (min) return `à partir de ${min.toLocaleString('fr-FR')} €`
  if (max) return `jusqu'à ${max.toLocaleString('fr-FR')} €`
  return null
}

const statusBorderColors: Record<string, string> = {
  planning: 'border-l-blue-400',
  confirmed: 'border-l-green-500',
  completed: 'border-l-gray-400',
  cancelled: 'border-l-red-400',
}

export function EventCard({ event, index, onClick, providerCount }: EventCardProps) {
  const budgetStr = formatBudget(event.budget_min, event.budget_max)
  const borderColor = statusBorderColors[event.status] || 'border-l-[#823F91]/40'

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
          'border-gray-200/80'
        )}
        onClick={onClick}
      >
        <CardContent className={cn('p-4 sm:p-5 border-l-[3px]', borderColor)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Title + Status */}
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {event.title}
                </h3>
                <EventStatusBadge status={event.status} />
              </div>

              {/* Description */}
              {event.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                  {event.description}
                </p>
              )}

              {/* Meta informations */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#823F91]/60" />
                  {formatDate(event.event_date)}
                </span>

                {event.event_time && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#823F91]/60" />
                    {event.event_time.slice(0, 5)}
                  </span>
                )}

                {event.venue && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#823F91]/60" />
                    <span className="truncate max-w-[150px]">{event.venue}</span>
                  </span>
                )}

                {event.guest_count != null && event.guest_count > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#823F91]/60" />
                    {event.guest_count} invités
                  </span>
                )}

                {budgetStr && (
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-[#823F91]/60" />
                    {budgetStr}
                  </span>
                )}

                {providerCount != null && providerCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-[#823F91] font-medium">
                    {providerCount} prestataire{providerCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-[#823F91] transition-colors flex-shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
