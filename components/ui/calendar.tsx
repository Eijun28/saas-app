'use client'

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface CalendarEvent {
  id: string
  title: string
  event_date: string
}

interface CalendarProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  className?: string
  events?: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
}

export function Calendar({ value, onChange, className, events = [], onEventClick, onDateClick }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    value ? new Date(value.getFullYear(), value.getMonth()) : new Date()
  )

  const today = new Date()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]

  const weekDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    onChange?.(selectedDate)
    onDateClick?.(selectedDate)
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const isSelected = (day: number) => {
    if (!value) return false
    return (
      value.getDate() === day &&
      value.getMonth() === currentMonth.getMonth() &&
      value.getFullYear() === currentMonth.getFullYear()
    )
  }

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    )
  }

  const isPast = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return date < todayStart
  }

  const hasEvent = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dateStr = date.toISOString().split('T')[0]
    return events.some(event => {
      const eventDate = new Date(event.event_date).toISOString().split('T')[0]
      return eventDate === dateStr
    })
  }

  const getEventForDay = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dateStr = date.toISOString().split('T')[0]
    return events.find(event => {
      const eventDate = new Date(event.event_date).toISOString().split('T')[0]
      return eventDate === dateStr
    })
  }

  return (
    <div className={cn("rounded-lg border border-[#E5E7EB] bg-white p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={goToPreviousMonth}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold text-[#0B0E12]">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-[#6B7280] py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startingDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dayHasEvent = hasEvent(day)
          const event = getEventForDay(day)
          return (
            <div key={day} className="relative">
              <button
                type="button"
                onClick={() => {
                  if (event && onEventClick) {
                    onEventClick(event)
                  } else {
                    handleDateClick(day)
                  }
                }}
                className={cn(
                  "h-10 w-full rounded-md text-sm transition-all duration-200 relative cursor-pointer",
                  isSelected(day)
                    ? "bg-[#6C2BD9] text-white font-semibold"
                    : isToday(day)
                    ? "bg-[#E8D4EF] text-[#6C2BD9] font-semibold"
                    : isPast(day)
                    ? "text-[#9CA3AF] hover:bg-gray-100"
                    : "text-[#374151] hover:bg-[#E8D4EF] hover:text-[#6C2BD9]",
                  dayHasEvent && !isSelected(day) && "border-2 border-[#823F91]"
                )}
                title={event ? event.title : `Cliquez pour créer un événement le ${day}`}
              >
                {day}
                {dayHasEvent && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#823F91] rounded-full" />
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

