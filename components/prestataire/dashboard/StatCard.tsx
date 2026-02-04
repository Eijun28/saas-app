'use client'

import { motion } from 'framer-motion'
import { LucideIcon, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'
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
  description?: string
  change?: {
    value: number
    period: string
    positive: boolean
  }
  actionLabel?: string
  variant?: 'default' | 'highlight'
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  delay = 0,
  onClick,
  description,
  change,
  actionLabel,
  variant = 'default',
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState<number | string>(0)
  const [isHovered, setIsHovered] = useState(false)

  // Counter animation for numeric values
  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1200
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

  const isHighlight = variant === 'highlight'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(onClick && 'cursor-pointer')}
      onClick={onClick}
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
          {/* Header: Icon + Label + Trend */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <motion.div
                className={cn(
                  'h-11 w-11 rounded-xl flex-shrink-0',
                  'flex items-center justify-center',
                  'transition-all duration-300',
                  isHighlight
                    ? 'bg-white/20'
                    : 'bg-gradient-to-br from-[#823F91] to-[#9D5FA8] shadow-sm shadow-[#823F91]/10'
                )}
                whileHover={{ scale: 1.05, rotate: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Icon className={cn(
                  "h-5 w-5",
                  isHighlight ? "text-white" : "text-white"
                )} />
              </motion.div>

              <div>
                <p className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  isHighlight ? "text-white/80" : "text-gray-400"
                )}>
                  {label}
                </p>
              </div>
            </div>

            {/* Trend indicator */}
            {change && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: delay + 0.2 }}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
                  change.positive
                    ? isHighlight
                      ? "bg-white/20 text-white"
                      : "bg-green-50 text-green-700"
                    : isHighlight
                      ? "bg-white/20 text-white"
                      : "bg-red-50 text-red-700"
                )}
              >
                {change.positive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{Math.abs(change.value)}%</span>
              </motion.div>
            )}
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
                )}>—</span>
              )}
            </motion.div>

            {/* Subtitle */}
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
              {change && (
                <p className={cn(
                  "text-[10px] mt-1",
                  isHighlight ? "text-white/50" : "text-gray-400"
                )}>
                  {change.period}
                </p>
              )}
            </div>
          )}

          {/* Trend visualization */}
          {trend && (
            <div className={cn(
              "pt-3 border-t",
              isHighlight ? "border-white/20" : "border-gray-100"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className={cn(
                    "h-3.5 w-3.5",
                    trend.positive
                      ? isHighlight ? "text-white" : "text-green-600"
                      : isHighlight ? "text-white" : "text-red-600"
                  )} />
                  <span className={cn(
                    "text-xs font-semibold",
                    trend.positive
                      ? isHighlight ? "text-white" : "text-green-700"
                      : isHighlight ? "text-white" : "text-red-700"
                  )}>
                    {trend.value}
                  </span>
                </div>

                {/* Mini sparkline */}
                <svg width="60" height="20" className={isHighlight ? "opacity-40" : "opacity-60"}>
                  <polyline
                    points={trend.positive
                      ? "0,18 15,12 30,8 45,4 60,2"
                      : "0,2 15,6 30,10 45,14 60,18"
                    }
                    fill="none"
                    stroke={isHighlight ? "#ffffff" : (trend.positive ? "#10b981" : "#ef4444")}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Action button */}
          {actionLabel && onClick && (
            <motion.div
              className={cn(
                "pt-3 border-t",
                isHighlight ? "border-white/20" : "border-gray-100"
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <button
                className={cn(
                  "w-full flex items-center justify-between text-sm font-semibold transition-colors group/btn",
                  isHighlight
                    ? "text-white hover:text-white/90"
                    : "text-[#823F91] hover:text-[#6D3478]"
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  onClick()
                }}
              >
                <span className="group-hover/btn:underline">{actionLabel}</span>
                <ArrowUpRight className="h-4 w-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </button>
            </motion.div>
          )}

        </div>
      </div>
    </motion.div>
  )
}
