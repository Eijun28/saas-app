'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

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
  const [displayValue, setDisplayValue] = useState<number | string>(0)
  
  // Counter animation for numeric values
  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1000
      const startTime = Date.now()
      const startValue = 0
      const endValue = value
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart)
        setDisplayValue(currentValue)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      
      requestAnimationFrame(animate)
    } else {
      setDisplayValue(value)
    }
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, scale: 1.02 }}
      className={cn(onClick && 'cursor-pointer')}
      onClick={onClick}
    >
      <Card className="relative border-[#823F91]/20 bg-white/95 backdrop-blur-sm hover:shadow-lg hover:shadow-[#823F91]/10 transition-all duration-200 min-h-[140px] hover:border-[#823F91]/30 overflow-hidden flex flex-col">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,#823F91_1px,transparent_0)] bg-[length:20px_20px]" />
        
        <CardContent className="relative p-4 sm:p-5 md:p-6 h-full flex flex-col flex-1">
          {/* Top section: Label + Icon */}
          <div className="flex items-start gap-3 sm:gap-4 flex-1">
            <motion.div 
              className={cn(
                'h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#823F91]/20',
                colorClass
              )}
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </motion.div>
            
            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col">
              <p className="text-xs sm:text-sm font-semibold text-gray-600 tracking-wide mb-1">
                {label}
              </p>
              
              {/* Middle section: Value */}
              <motion.p 
                className="text-xl sm:text-2xl font-extrabold text-gray-900"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: delay + 0.2 }}
              >
                {displayValue}
              </motion.p>

              {/* Bottom section: Subtitle/Trend */}
              {(subtitle || trend) && (
                <div className="flex items-center justify-between text-xs sm:text-sm mt-1 pt-2 border-t border-gray-100">
                  {subtitle && (
                    <span className="text-gray-600 font-medium">{subtitle}</span>
                  )}
                  {trend && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: delay + 0.3 }}
                      className="flex items-center gap-1"
                    >
                      {/* Mini sparkline */}
                      <svg width="40" height="12" className="mr-1">
                        <polyline
                          points={trend.positive ? "0,10 10,6 20,4 30,2 40,0" : "0,2 10,4 20,6 30,8 40,10"}
                          fill="none"
                          stroke={trend.positive ? "#10b981" : "#ef4444"}
                          strokeWidth="2"
                        />
                      </svg>
                      <span className={cn(
                        'font-semibold text-xs',
                        trend.positive ? 'text-green-600' : 'text-red-600'
                      )}>
                        {trend.value}
                      </span>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
