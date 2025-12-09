'use client'

import { motion } from 'framer-motion'
import { Check, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimelineStepProps {
  step: number
  currentStep: number
  completed: boolean
  icon: LucideIcon
  title: string
  description?: string
}

export function TimelineStep({ step, currentStep, completed, icon: Icon, title, description }: TimelineStepProps) {
  const isActive = step === currentStep
  const isPast = step < currentStep

  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <motion.div
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
            completed
              ? "bg-[#823F91] border-[#823F91]"
              : isActive
              ? "bg-white border-[#823F91]"
              : "bg-white border-gray-200"
          )}
          whileHover={{ scale: 1.05 }}
        >
          {completed ? (
            <Check className="h-6 w-6 text-white" />
          ) : (
            <Icon className={cn(
              "h-6 w-6",
              isActive ? "text-[#823F91]" : "text-gray-400"
            )} />
          )}
        </motion.div>
        {step < 4 && (
          <div className={cn(
            "w-0.5 h-16 mt-2 transition-colors duration-300",
            completed ? "bg-[#823F91]" : "bg-gray-200"
          )} />
        )}
      </div>
      <div className="flex-1 pt-1">
        <h3 className={cn(
          "text-sm font-medium mb-1",
          isActive ? "text-gray-900" : completed ? "text-gray-900" : "text-gray-400"
        )}>
          {title}
        </h3>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

