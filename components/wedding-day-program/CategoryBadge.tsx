'use client'

import { cn } from '@/lib/utils'
import type { ProgramCategory } from '@/types/wedding-day-program'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/types/wedding-day-program'

interface CategoryBadgeProps {
  category: ProgramCategory
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const colors = CATEGORY_COLORS[category]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        colors.bg, colors.text, colors.border,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', colors.dot)} />
      {CATEGORY_LABELS[category]}
    </span>
  )
}
