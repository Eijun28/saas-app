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
      className={cn(onClick && 'cursor-pointer')}
      onClick={onClick}
    >
      <Card className="border-border/10 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 min-h-[160px]">
        <CardContent className="p-6 h-full flex flex-col justify-between">
          {/* Top section: Label + Icon */}
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">
              {label}
            </p>
            <div className={cn(
              'h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0',
              colorClass
            )}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
          
          {/* Middle section: Value */}
          <p className="text-4xl font-bold text-gray-900 mb-2">
            {value}
          </p>

          {/* Bottom section: Subtitle/Trend */}
          {(subtitle || trend) && (
            <div className="flex items-center justify-between text-xs mt-auto">
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
