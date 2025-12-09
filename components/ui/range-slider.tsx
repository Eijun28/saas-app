'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

interface RangeSliderProps {
  min: number
  max: number
  value: { min: number; max: number }
  onChange: (value: { min: number; max: number }) => void
  step?: number
  className?: string
}

export function RangeSlider({ min, max, value, onChange, step = 1, className }: RangeSliderProps) {
  const [localValue, setLocalValue] = React.useState(value)

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), localValue.max - step)
    const newValue = { min: newMin, max: localValue.max }
    setLocalValue(newValue)
    onChange(newValue)
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localValue.min + step)
    const newValue = { min: localValue.min, max: newMax }
    setLocalValue(newValue)
    onChange(newValue)
  }

  const minPercent = ((localValue.min - min) / (max - min)) * 100
  const maxPercent = ((localValue.max - min) / (max - min)) * 100

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative h-2 bg-[#E5E7EB] rounded-full">
        <div
          className="absolute h-2 bg-[#6D3478] rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue.min}
        onChange={handleMinChange}
        className="absolute top-0 w-full h-2 opacity-0 cursor-pointer"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue.max}
        onChange={handleMaxChange}
        className="absolute top-0 w-full h-2 opacity-0 cursor-pointer"
      />
      <div className="flex justify-between mt-4">
        <div className="text-sm font-medium text-[#374151]">
          {localValue.min.toLocaleString('fr-FR')} €
        </div>
        <div className="text-sm font-medium text-[#374151]">
          {localValue.max.toLocaleString('fr-FR')} €
        </div>
      </div>
    </div>
  )
}

