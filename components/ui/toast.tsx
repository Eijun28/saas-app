'use client'

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  onClose?: () => void
}

export function Toast({ title, description, variant = 'default', onClose }: ToastProps) {
  const bgColor = {
    default: 'bg-white',
    destructive: 'bg-red-50 border-red-200',
    success: 'bg-green-50 border-green-200',
  }[variant]

  const textColor = {
    default: 'text-[#1F2937]',
    destructive: 'text-red-600',
    success: 'text-green-600',
  }[variant]

  return (
    <div
      className={cn(
        'rounded-lg border p-4 shadow-lg',
        bgColor,
        'min-w-[300px] max-w-md'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {title && (
            <div className={cn('font-semibold text-sm mb-1', textColor)}>
              {title}
            </div>
          )}
          {description && (
            <div className={cn('text-sm', textColor)}>{description}</div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-[#6B7280] hover:text-[#374151]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {children}
    </div>
  )
}

