'use client'

import { cn } from '@/lib/utils'
import { EVENT_STATUS_CONFIG, type CoupleEventStatus } from '@/types/cultural-events.types'

interface EventStatusBadgeProps {
  status: CoupleEventStatus
  className?: string
}

export function EventStatusBadge({ status, className }: EventStatusBadgeProps) {
  const config = EVENT_STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  )
}
