'use client'

import { cn } from '@/lib/utils'
import type { RsvpStatus } from '@/types/guest'
import { RSVP_LABELS, RSVP_COLORS } from '@/types/guest'

interface RsvpBadgeProps {
  status: RsvpStatus
  className?: string
}

export function RsvpBadge({ status, className }: RsvpBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        RSVP_COLORS[status],
        className
      )}
    >
      {RSVP_LABELS[status]}
    </span>
  )
}
