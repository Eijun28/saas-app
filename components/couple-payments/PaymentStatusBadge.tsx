'use client'

import { cn } from '@/lib/utils'
import type { PaymentStatus } from '@/types/couple-payments'
import { STATUS_CONFIG } from '@/types/couple-payments'

interface PaymentStatusBadgeProps {
  status:     PaymentStatus
  className?: string
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        cfg.bg, cfg.text, cfg.border,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  )
}
