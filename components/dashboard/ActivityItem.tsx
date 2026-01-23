'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
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
        "flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-white border border-gray-200/60",
        "hover:border-gray-300 hover:shadow-md hover:shadow-gray-900/5 transition-all",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "p-2 bg-gradient-to-br from-[#823F91]/10 to-[#9D5FA8]/10 rounded-lg flex-shrink-0",
        color
      )}>
        <Icon size={18} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {title}
        </p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </motion.div>
  )
}
