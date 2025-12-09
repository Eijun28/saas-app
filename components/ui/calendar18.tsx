"use client"

import * as React from "react"

import { Calendar } from "@/components/ui/calendar"

interface CalendarEvent {
  id: string
  title: string
  event_date: string
}

interface Calendar18Props {
  events?: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
}

export function Calendar18({ events = [], onEventClick, onDateClick }: Calendar18Props) {
  const [date, setDate] = React.useState<Date | undefined>(undefined)

  return (
    <div className="rounded-lg border [--cell-size:--spacing(11)] md:[--cell-size:--spacing(12)]">
      <Calendar
        value={date}
        onChange={setDate}
        events={events}
        onEventClick={onEventClick}
        onDateClick={onDateClick}
      />
    </div>
  )
}

