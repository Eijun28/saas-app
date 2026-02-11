'use client'

import { motion } from 'framer-motion'
import { LucideIcon, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityItemProps {
  icon: LucideIcon
  title: string
  time: string
  color?: string
  onClick?: () => void
  delay?: number
}

export function ActivityItem({
  icon: Icon,
  title,
  time,
  color = 'text-[#823F91]',
  onClick,
  delay = 0
}: ActivityItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 transition-all duration-150 group",
        "border border-transparent",
        "min-h-[44px]",
        onClick && "cursor-pointer hover:bg-gray-100/80 hover:border-gray-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/30 focus-visible:ring-offset-1"
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onClick) onClick()
      }}
    >
      <div className="p-2 bg-white rounded-xl shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] flex-shrink-0 transition-shadow group-hover:shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
        <Icon size={16} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{time}</p>
      </div>
      {onClick && (
        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#823F91] group-hover:translate-x-0.5 transition-all duration-150 flex-shrink-0" />
      )}
    </motion.div>
  )
}
