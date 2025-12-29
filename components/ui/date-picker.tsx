'use client'

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "./calendar"
import { Input } from "./input"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({ 
  value, 
  onChange, 
  placeholder = "Sélectionner une date", 
  className,
  disabled = false
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const formatDate = (date: Date | undefined) => {
    if (!date) return ""
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          readOnly
          disabled={disabled}
          value={formatDate(value)}
          placeholder={placeholder}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "cursor-pointer pr-10",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
      </div>
      {isOpen && !disabled && (
        <>
          {/* Overlay pour fermer le calendrier */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          {/* Calendrier dropdown */}
          <div className="absolute top-full left-0 mt-2 z-20 bg-white rounded-lg border shadow-lg p-0">
            <Calendar
              mode="single"
              selected={value}
              onSelect={(date) => {
                onChange?.(date)
                setIsOpen(false)
              }}
              captionLayout="dropdown"
              className="rounded-lg"
              fromYear={new Date().getFullYear() - 5}
              toYear={new Date().getFullYear() + 20}
            />
          </div>
        </>
      )}
    </div>
  )
}

