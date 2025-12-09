'use client'

import { Check, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerticalTimelineProps {
  steps: {
    step: number
    icon: LucideIcon
    title: string
    description?: string
  }[]
  currentStep: number
}

export function VerticalTimeline({ steps, currentStep }: VerticalTimelineProps) {
  return (
    <div className="flex flex-col gap-0">
      {steps.map((stepInfo, index) => {
        const Icon = stepInfo.icon
        const isActive = stepInfo.step === currentStep
        const isCompleted = stepInfo.step < currentStep
        const isUpcoming = stepInfo.step > currentStep

        return (
          <div key={stepInfo.step} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isCompleted
                    ? "bg-[#823F91] border-[#823F91]"
                    : isActive
                    ? "bg-white border-[#823F91]"
                    : "bg-white border-gray-200"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 text-white" />
                ) : (
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-[#823F91]" : "text-gray-400"
                    )}
                  />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-0.5 h-20 mt-2 transition-colors duration-300",
                    isCompleted ? "bg-[#823F91]" : "bg-gray-200"
                  )}
                />
              )}
            </div>
            <div className="flex-1 pt-1 pb-8">
              <h3
                className={cn(
                  "text-sm font-medium mb-1",
                  isActive || isCompleted
                    ? "text-gray-900"
                    : "text-gray-400"
                )}
              >
                {stepInfo.title}
              </h3>
              {stepInfo.description && (
                <p className="text-xs text-gray-500">{stepInfo.description}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

