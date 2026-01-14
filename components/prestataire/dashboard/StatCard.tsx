'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
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
  // Nouvelles props pour le style Revolut/Stripe
  description?: string
  change?: {
    value: number
    period: string
    positive: boolean
  }
  actionLabel?: string
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
  description,
  change,
  actionLabel,
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
      <Card className={cn(
        "relative border border-gray-200/60 bg-white",
        "hover:border-gray-300 hover:shadow-xl hover:shadow-gray-900/5",
        "transition-all duration-300 ease-out",
        "overflow-hidden",
        "group",
        // Mobile: pleine largeur, desktop: responsive
        "w-full h-full",
        // Hauteur uniforme pour toutes les cartes
        "flex flex-col"
      )}>
        {/* Subtle gradient overlay on hover */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50/50",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          "pointer-events-none"
        )} />
        
        {/* Accent line at top (style Revolut) */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#823F91] via-[#9D5FA8] to-[#823F91] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardContent className="relative p-5 sm:p-6 md:p-7 space-y-5 flex flex-col flex-1">
          {/* Header: Icon + Label */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <motion.div 
                className={cn(
                  'h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex-shrink-0',
                  'bg-gradient-to-br from-[#823F91] to-[#9D5FA8]',
                  'flex items-center justify-center',
                  'shadow-sm shadow-[#823F91]/10',
                  'group-hover:shadow-md group-hover:shadow-[#823F91]/20',
                  'transition-all duration-300'
                )}
                whileHover={{ scale: 1.05, rotate: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">
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
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0",
                  "backdrop-blur-sm",
                  change.positive 
                    ? "bg-green-50/80 text-green-700 border border-green-200/50" 
                    : "bg-red-50/80 text-red-700 border border-red-200/50"
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
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.1 }}
              className="flex items-baseline gap-2 flex-wrap"
            >
              <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-none">
                {displayValue}
              </p>
              {typeof value === 'number' && value === 0 && (
                <span className="text-xs sm:text-sm text-gray-400 font-medium">—</span>
              )}
            </motion.div>
            
            {/* Subtitle */}
            {subtitle && (
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                {subtitle}
              </p>
            )}
          </div>

          {/* Description (style Revolut - toujours affichée même si vide) */}
          <div className="pt-3 border-t border-gray-100/80 flex-1 flex flex-col">
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-medium">
              {description || (
                <span className="text-gray-400 italic">
                  Données en cours de chargement...
                </span>
              )}
            </p>
            {change && (
              <p className="text-xs text-gray-400 mt-1">
                {change.period}
              </p>
            )}
          </div>

          {/* Trend visualization (mini graph style Stripe) */}
          {trend && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className={cn(
                    "h-3 w-3",
                    trend.positive ? "text-green-600" : "text-red-600"
                  )} />
                  <span className={cn(
                    "text-xs font-semibold",
                    trend.positive ? "text-green-700" : "text-red-700"
                  )}>
                    {trend.value}
                  </span>
                </div>
                
                {/* Mini sparkline */}
                <svg width="60" height="20" className="opacity-60">
                  <polyline
                    points={trend.positive 
                      ? "0,18 15,12 30,8 45,4 60,2" 
                      : "0,2 15,6 30,10 45,14 60,18"
                    }
                    fill="none"
                    stroke={trend.positive ? "#10b981" : "#ef4444"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Action button (style Revolut) */}
          {actionLabel && onClick && (
            <motion.div
              className="pt-4 border-t border-gray-100/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <button
                className="w-full flex items-center justify-between text-xs sm:text-sm font-semibold text-[#823F91] hover:text-[#6D3478] transition-colors group/btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onClick()
                }}
              >
                <span className="group-hover/btn:underline">{actionLabel}</span>
                <ArrowUpRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </button>
            </motion.div>
          )}

          {/* Hover effect overlay */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br from-[#823F91]/5 via-transparent to-transparent",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            "pointer-events-none"
          )} />
        </CardContent>
      </Card>
    </motion.div>
  )
}
