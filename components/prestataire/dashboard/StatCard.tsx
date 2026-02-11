'use client'

import { motion } from 'framer-motion'
import { LucideIcon, ArrowRight, ArrowUpRight, ArrowDownRight, Minus, Zap } from 'lucide-react'
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
  actionHref?: string
  variant?: 'default' | 'highlight'
  delta?: number | null
  deltaLabel?: string
  sparkline?: number[]
  emptyStateAction?: string
  alert?: string
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
  actionHref,
  variant = 'default',
  delta,
  deltaLabel = 'vs mois dernier',
  sparkline,
  emptyStateAction,
  alert,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState<number | string>(0)

  // Counter animation for numeric values
  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1000
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
  const isZero = typeof value === 'number' && value === 0
  const showEmptyState = isZero && emptyStateAction

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
        "transition-all duration-150 ease-out",
        "group",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/30 focus-visible:ring-offset-2",
        isHighlight
          ? "bg-gradient-to-br from-[#823F91] to-[#5C2B66] shadow-lg shadow-[#823F91]/15"
          : "bg-white border border-gray-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)] hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.06),0_2px_4px_-2px_rgb(0_0_0/0.04)] hover:border-gray-200"
      )}>

        <div className="relative p-5 space-y-3 flex flex-col h-full">
          {/* Header: Icon + Label */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'h-10 w-10 rounded-xl flex-shrink-0',
                  'flex items-center justify-center',
                  'transition-all duration-150',
                  isHighlight
                    ? 'bg-white/15'
                    : 'bg-[#823F91]/8'
                )}
              >
                <Icon className={cn(
                  "h-[18px] w-[18px]",
                  isHighlight ? "text-white" : "text-[#823F91]"
                )} />
              </div>

              <p className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                isHighlight ? "text-white/70" : "text-gray-400"
              )}>
                {label}
              </p>
            </div>

            {/* Sparkline (mini visualization) */}
            {sparkline && sparkline.length > 0 && (
              <div className="flex items-end gap-[2px] h-6">
                {sparkline.map((val, i) => {
                  const max = Math.max(...sparkline, 1)
                  const height = Math.max((val / max) * 100, 8)
                  const isLast = i === sparkline.length - 1
                  return (
                    <div
                      key={i}
                      className={cn(
                        "w-[4px] rounded-sm transition-all duration-150",
                        isHighlight
                          ? isLast ? "bg-white" : "bg-white/30"
                          : isLast ? "bg-[#823F91]" : "bg-[#E8D4EF]"
                      )}
                      style={{ height: `${height}%` }}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* Main Value */}
          <div className="space-y-1 flex-1">
            <div className="flex items-baseline gap-3">
              <p className={cn(
                "text-[32px] sm:text-[36px] font-bold tracking-tight leading-none tabular-nums",
                isHighlight ? "text-white" : "text-gray-900"
              )}>
                {showEmptyState ? '—' : displayValue}
              </p>

              {/* Delta badge */}
              {delta !== undefined && delta !== null && !isZero && (
                <span className={cn(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold",
                  isHighlight
                    ? delta > 0 ? "bg-white/20 text-white" : delta < 0 ? "bg-white/20 text-white" : "bg-white/10 text-white/70"
                    : delta > 0 ? "bg-emerald-50 text-emerald-700" : delta < 0 ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"
                )}>
                  {delta > 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : delta < 0 ? (
                    <ArrowDownRight className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  {delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '0'}
                </span>
              )}
            </div>

            {subtitle && !showEmptyState && (
              <p className={cn(
                "text-sm font-medium",
                isHighlight ? "text-white/70" : "text-gray-500"
              )}>
                {subtitle}
              </p>
            )}

            {/* Delta label */}
            {delta !== undefined && delta !== null && !isZero && deltaLabel && (
              <p className={cn(
                "text-[11px]",
                isHighlight ? "text-white/50" : "text-gray-400"
              )}>
                {deltaLabel}
              </p>
            )}

            {/* Empty state */}
            {showEmptyState && (
              <div className="mt-1 space-y-1.5">
                <p className={cn(
                  "text-sm",
                  isHighlight ? "text-white/60" : "text-gray-400"
                )}>
                  {description || 'Aucune donnee'}
                </p>
                <span className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold",
                  isHighlight ? "text-white" : "text-[#823F91]"
                )}>
                  <Zap className="h-3 w-3" />
                  {emptyStateAction}
                </span>
              </div>
            )}
          </div>

          {/* Alert */}
          {alert && (
            <div className={cn(
              "px-3 py-2 rounded-lg text-xs font-medium",
              isHighlight
                ? "bg-white/10 text-white/90"
                : "bg-amber-50 text-amber-700 border border-amber-100"
            )}>
              {alert}
            </div>
          )}

          {/* Action button */}
          {actionLabel && !showEmptyState && (
            <div
              className={cn(
                "pt-3 border-t cursor-pointer",
                isHighlight ? "border-white/15" : "border-gray-100"
              )}
              onClick={(e) => {
                if (actionHref) {
                  e.stopPropagation()
                  window.location.href = actionHref
                }
              }}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (actionHref) window.location.href = actionHref
                  else if (onClick) onClick()
                }
              }}
            >
              <span
                className={cn(
                  "w-full flex items-center justify-between text-xs font-semibold transition-colors group/btn",
                  isHighlight
                    ? "text-white hover:text-white/90"
                    : "text-[#823F91] hover:text-[#5C2B66]"
                )}
              >
                <span className="group-hover/btn:underline">{actionLabel}</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform duration-150" />
              </span>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  )
}
