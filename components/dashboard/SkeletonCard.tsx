'use client'

import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonCardProps {
  delay?: number
  className?: string
}

export function SkeletonCard({ delay = 0, className }: SkeletonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative border border-gray-200/60 bg-white rounded-xl overflow-hidden",
        "flex flex-col h-full",
        className
      )}
    >
      <div className="p-5 sm:p-6 md:p-7 space-y-5 flex flex-col flex-1">
        {/* Header: Icon + Label */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Skeleton className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex-shrink-0" />
            <Skeleton className="h-4 w-24 flex-1" />
          </div>
        </div>

        {/* Main Value */}
        <div className="space-y-2">
          <Skeleton className="h-12 sm:h-14 md:h-16 w-32" />
          <Skeleton className="h-5 w-40" />
        </div>

        {/* Description */}
        <div className="pt-3 border-t border-gray-100/80 flex-1 flex flex-col space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Action button */}
        <div className="pt-4 border-t border-gray-100/80">
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
    </motion.div>
  )
}
