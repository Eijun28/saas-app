'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PriceToggleProps {
  value: 'monthly' | 'annual'
  onChange: (value: 'monthly' | 'annual') => void
  className?: string
}

export function PriceToggle({ value, onChange, className }: PriceToggleProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={cn(
          "text-sm font-medium transition-colors duration-200",
          value === 'monthly' ? 'text-gray-900' : 'text-gray-500'
        )}
      >
        Mensuel
      </button>
      
      <button
        type="button"
        role="switch"
        aria-checked={value === 'annual'}
        onClick={() => onChange(value === 'monthly' ? 'annual' : 'monthly')}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full border border-gray-200 bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#823F91] focus:ring-offset-2",
          value === 'annual' && 'bg-[#823F91]'
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
            value === 'annual' ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
      
      <button
        type="button"
        onClick={() => onChange('annual')}
        className={cn(
          "text-sm font-medium transition-colors duration-200",
          value === 'annual' ? 'text-gray-900' : 'text-gray-500'
        )}
      >
        Annuel
      </button>
    </div>
  )
}

