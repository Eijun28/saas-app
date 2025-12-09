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
}

export function DatePicker({ value, onChange, placeholder = "Sélectionner une date", className }: DatePickerProps) {
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
          value={formatDate(value)}
          placeholder={placeholder}
          onClick={() => setIsOpen(!isOpen)}
          className="cursor-pointer pr-10"
        />
        <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
      </div>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 z-20">
            <Calendar value={value} onChange={(date) => {
              onChange?.(date)
              setIsOpen(false)
            }} />
          </div>
        </>
      )}
    </div>
  )
}

