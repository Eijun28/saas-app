'use client'

import { cn } from '@/lib/utils'
import type { RequestStatus } from './CRMTypes'
import { STATUS_CONFIG } from './CRMTypes'

interface CRMStatusBadgeProps {
  status: RequestStatus
  className?: string
}

export function CRMStatusBadge({ status, className }: CRMStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-gray-700', className)}>
      <span className={cn('h-2 w-2 rounded-full flex-shrink-0', config.dotColor)} />
      {config.label}
    </span>
  )
}
