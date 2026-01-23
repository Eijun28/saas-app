'use client'

import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { fr } from 'date-fns/locale'
import { isSameDay, isToday } from 'date-fns'
import { CalendarEvent } from './types'

interface MiniCalendarProps {
  currentDate: Date
  onDateSelect: (date: Date) => void
  highlightDates?: Date[]
  events?: CalendarEvent[]
  className?: string
}

export function MiniCalendar({
  currentDate,
  onDateSelect,
  highlightDates = [],
  events = [],
  className,
}: MiniCalendarProps) {
  const getEventsForDate = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateKey)
  }

  return (
    <Card className={cn("border-gray-200", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Navigation rapide</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Calendar
          mode="single"
          selected={currentDate}
          onSelect={(date) => date && onDateSelect(date)}
          month={currentDate}
          onMonthChange={() => {}}
          locale={fr}
          className="rounded-lg border-0 [--cell-size:2rem]"
          modifiers={{
            hasEvents: events.map(event => {
              const [year, month, day] = event.date.split('-').map(Number)
              return new Date(year, month - 1, day)
            }),
            highlighted: highlightDates,
          }}
          modifiersClassNames={{
            hasEvents: 'relative',
            highlighted: 'bg-[#823F91]/20',
          }}
          components={{
            DayButton: (props) => {
              const dayEvents = getEventsForDate(props.day.date)
              const isHighlighted = highlightDates.some(d => isSameDay(d, props.day.date))
              const isCurrentDay = isToday(props.day.date)
              
              return (
                <div className="relative w-full h-full">
                  <button
                    {...props}
                    className={cn(
                      "w-full h-full rounded-md text-xs font-medium transition-colors",
                      "hover:bg-gray-100",
                      isCurrentDay && "bg-[#823F91] text-white font-semibold",
                      isHighlighted && !isCurrentDay && "bg-[#823F91]/20",
                      props.modifiers.selected && "bg-[#823F91] text-white"
                    )}
                  />
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="h-1 w-1 rounded-full bg-[#823F91]"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            },
          }}
          classNames={{
            months: "flex flex-col",
            month: "space-y-2",
            caption: "flex justify-center pt-1 pb-2",
            caption_label: "text-sm font-semibold",
            nav: "space-x-1 flex items-center justify-between",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "text-gray-500 font-normal text-[10px] w-full",
            row: "flex w-full mt-1",
            cell: "h-auto w-full text-center p-0 relative",
            day: "h-8 w-full p-0 font-normal text-xs",
            day_selected: "bg-[#823F91] text-white hover:bg-[#6D3478]",
            day_today: "bg-gray-100 font-semibold",
            day_outside: "text-gray-300 opacity-50",
            day_disabled: "text-gray-200",
            day_hidden: "invisible",
          }}
        />
      </CardContent>
    </Card>
  )
}
