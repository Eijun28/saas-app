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
        "relative border border-gray-100 bg-white rounded-2xl shadow-sm overflow-hidden",
        "flex flex-col h-full",
        className
      )}
    >
      <div className="p-4 sm:p-5 space-y-4 flex flex-col flex-1">
        {/* Header: Icon + Label */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex-shrink-0" />
          <Skeleton className="h-3 w-20" />
        </div>

        {/* Main Value */}
        <div className="space-y-1.5">
          <Skeleton className="h-8 sm:h-10 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>

        {/* Action */}
        <div className="pt-2 mt-auto border-t border-gray-100">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </motion.div>
  )
}
