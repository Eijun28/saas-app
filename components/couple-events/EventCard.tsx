'use client'

import { motion } from 'framer-motion'
import { Calendar, MapPin, Users, Wallet, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EventStatusBadge } from './EventStatusBadge'
import type { CoupleEventWithType } from '@/types/cultural-events.types'
import { cn } from '@/lib/utils'

interface EventCardProps {
  event: CoupleEventWithType
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

function formatBudget(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  if (min && max) return `${min.toLocaleString('fr-FR')} - ${max.toLocaleString('fr-FR')} €`
  if (min) return `À partir de ${min.toLocaleString('fr-FR')} €`
  if (max) return `Jusqu'à ${max.toLocaleString('fr-FR')} €`
  return null
}

export function EventCard({ event, index, onClick }: EventCardProps) {
  const budgetStr = formatBudget(event.budget_min, event.budget_max)
  const cultureBadge = event.event_type?.culture_category_id

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        className={cn(
          'group cursor-pointer transition-all duration-200',
          'hover:shadow-md hover:border-[#823F91]/30',
          'border-gray-200/80'
        )}
        onClick={onClick}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Title + Status */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {event.title}
                </h3>
                <EventStatusBadge status={event.status} />
              </div>

              {/* Description */}
              {event.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {event.description}
                </p>
              )}

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#823F91]/70" />
                  {formatDate(event.event_date)}
                </span>

                {event.venue && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#823F91]/70" />
                    <span className="truncate max-w-[200px]">{event.venue}</span>
                  </span>
                )}

                {event.guest_count && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#823F91]/70" />
                    {event.guest_count} invités
                  </span>
                )}

                {budgetStr && (
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-[#823F91]/70" />
                    {budgetStr}
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
