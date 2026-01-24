'use client'

import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ value, onChange, placeholder = "Sélectionner une date", className }: DatePickerProps) {
  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return ""
    // Utiliser les composants pour éviter les problèmes de fuseau horaire
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    if (dateValue) {
      // Créer la date en utilisant les composants année/mois/jour pour éviter les problèmes de fuseau horaire
      const [year, month, day] = dateValue.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      onChange?.(date)
    } else {
      onChange?.(undefined)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Input
        type="date"
        value={formatDateForInput(value)}
        onChange={handleDateChange}
        placeholder={placeholder}
        className="cursor-pointer"
      />
    </div>
  )
}

