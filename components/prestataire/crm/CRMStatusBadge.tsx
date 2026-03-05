'use client'

import { cn } from '@/lib/utils'
import { STATUS_CONFIG } from './CRMTypes'
import type { CRMStatus } from './CRMTypes'

interface CRMStatusBadgeProps {
  status: CRMStatus
  className?: string
}

export function CRMStatusBadge({ status, className }: CRMStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium',
      config.color, config.bg, className
    )}>
      {config.label}
    </span>
  )
}
