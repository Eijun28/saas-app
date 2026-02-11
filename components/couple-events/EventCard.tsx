'use client'

import { motion } from 'framer-motion'
import { Calendar, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { TimelineEvent } from '@/types/cultural-events.types'
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

export function EventCard({ event, index, onClick }: EventCardProps) {
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
        <CardContent className="p-4 sm:p-5 border-l-[3px] border-l-[#823F91]/40 group-hover:border-l-[#823F91]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {event.title}
                </h3>
              </div>

              {/* Description */}
              {event.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                  {event.description}
                </p>
              )}

              {/* Date */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#823F91]/60" />
                  {formatDate(event.event_date)}
                </span>
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
