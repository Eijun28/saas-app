'use client'

import { cn } from '@/lib/utils'
import type { AvailabilityStatus } from '@/types/provider-availability'
import { STATUS_CONFIG } from '@/types/provider-availability'

interface AvailabilityStatusBadgeProps {
  status:    AvailabilityStatus
  className?: string
}

export function AvailabilityStatusBadge({ status, className }: AvailabilityStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        cfg.bg, cfg.text, cfg.border,
        className
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: cfg.color }}
      />
      {cfg.label}
    </span>
  )
}
