'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  subtitle?: string
  trend?: {
    value: string
    positive: boolean
  }
  colorClass?: string
  delay?: number
  onClick?: () => void
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  colorClass = 'from-[#9D5FA8]/10 to-[#823F91]/10 text-[#823F91]',
  delay = 0,
  onClick,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(onClick && 'cursor-pointer')}
      onClick={onClick}
    >
      <Card className="border-[#823F91]/20 bg-white/95 backdrop-blur-sm hover:shadow-2xl hover:shadow-black/10 hover:border-[#823F91]/40 transition-all duration-300 min-h-[130px] sm:min-h-[150px] md:min-h-[170px] shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
        <CardContent className="p-4 sm:p-5 md:p-6 h-full flex flex-col justify-between">
          {/* Top section: Label + Icon */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <p className="text-sm sm:text-base font-semibold text-[#823F91]/80">
              {label}
            </p>
            <div className={cn(
              'h-12 w-12 sm:h-13 sm:w-13 md:h-14 md:w-14 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-md',
              colorClass
            )}>
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#823F91]" />
            </div>
          </div>

          {/* Middle section: Value */}
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent mb-2">
            {value}
          </p>

          {/* Bottom section: Subtitle/Trend */}
          {(subtitle || trend) && (
            <div className="flex items-center justify-between text-[10px] sm:text-xs mt-auto">
              {subtitle && (
                <span className="text-muted-foreground">{subtitle}</span>
              )}
              {trend && (
                <span className={cn(
                  'font-medium',
                  trend.positive ? 'text-green-600' : 'text-red-600'
                )}>
                  {trend.value}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
