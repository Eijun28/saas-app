'use client'

import { motion } from 'framer-motion'
import { LucideIcon, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  subtitle?: string
  colorClass?: string
  delay?: number
  onClick?: () => void
  description?: string
  actionLabel?: string
  variant?: 'default' | 'highlight'
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  delay = 0,
  onClick,
  description,
  actionLabel,
  variant = 'default',
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState<number | string>(0)

  // Counter animation for numeric values
  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1200
      const startTime = Date.now()
      const endValue = value

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const currentValue = Math.floor(endValue * easeOutQuart)
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

  const isHighlight = variant === 'highlight'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(onClick && 'cursor-pointer')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onClick) onClick()
      }}
    >
      <div className={cn(
        "relative rounded-2xl overflow-hidden h-full",
        "transition-all duration-300 ease-out",
        "group",
        isHighlight
          ? "bg-gradient-to-br from-[#823F91] to-[#6D3478] shadow-lg shadow-[#823F91]/20"
          : "bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200"
      )}>

        <div className="relative p-5 space-y-4 flex flex-col h-full">
          {/* Header: Icon + Label */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-11 w-11 rounded-xl flex-shrink-0',
                'flex items-center justify-center',
                'transition-all duration-300',
                isHighlight
                  ? 'bg-white/20'
                  : 'bg-gradient-to-br from-[#823F91] to-[#9D5FA8] shadow-sm shadow-[#823F91]/10'
              )}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>

            <p className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              isHighlight ? "text-white/80" : "text-gray-400"
            )}>
              {label}
            </p>
          </div>

          {/* Main Value */}
          <div className="space-y-1 flex-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.1 }}
              className="flex items-baseline gap-2"
            >
              <p className={cn(
                "text-3xl sm:text-4xl font-extrabold tracking-tight leading-none",
                isHighlight ? "text-white" : "text-gray-900"
              )}>
                {displayValue}
              </p>
              {typeof value === 'number' && value === 0 && (
                <span className={cn(
                  "text-sm font-medium",
                  isHighlight ? "text-white/50" : "text-gray-400"
                )}>--</span>
              )}
            </motion.div>

            {subtitle && (
              <p className={cn(
                "text-sm font-medium",
                isHighlight ? "text-white/80" : "text-gray-600"
              )}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Description */}
          {description && (
            <div className={cn(
              "pt-3 border-t",
              isHighlight ? "border-white/20" : "border-gray-100"
            )}>
              <p className={cn(
                "text-xs leading-relaxed",
                isHighlight ? "text-white/70" : "text-gray-500"
              )}>
                {description}
              </p>
            </div>
          )}

          {/* Action button */}
          {actionLabel && onClick && (
            <div className={cn(
              "pt-3 border-t",
              isHighlight ? "border-white/20" : "border-gray-100"
            )}>
              <span
                className={cn(
                  "w-full flex items-center justify-between text-xs font-semibold transition-colors group/btn",
                  isHighlight
                    ? "text-white hover:text-white/90"
                    : "text-[#823F91] hover:text-[#6D3478]"
                )}
              >
                <span className="group-hover/btn:underline">{actionLabel}</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
              </span>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  )
}
