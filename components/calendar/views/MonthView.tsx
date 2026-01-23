'use client'

import { Calendar } from '@/components/ui/calendar'
import { CalendarDayButton } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { fr } from 'date-fns/locale'
import { format, isSameDay, isToday } from 'date-fns'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { CalendarEvent } from '../types'

interface MonthViewProps {
  currentDate: Date
  selectedDate: Date | null
  events: CalendarEvent[]
  onDateSelect: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  eventColor?: (event: CalendarEvent) => string
  showTime?: boolean
}

export function MonthView({
  currentDate,
  selectedDate,
  events,
  onDateSelect,
  onEventClick,
  eventColor,
  showTime = false,
}: MonthViewProps) {
  const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd')

  const getEventsForDate = (date: Date) => {
    const dateKey = formatDateKey(date)
    return events.filter(event => event.date === dateKey)
  }

  const getEventColorHex = (event: CalendarEvent): string => {
    if (eventColor) {
      const colorClass = eventColor(event)
      if (colorClass.startsWith('#')) return colorClass
      const colorMap: Record<string, string> = {
        'bg-blue-500': '#3b82f6',
        'bg-green-500': '#10B981',
        'bg-yellow-500': '#F59E0B',
        'bg-red-500': '#EF4444',
        'bg-purple-500': '#823F91',
        'bg-pink-500': '#ec4899',
        'bg-orange-500': '#f97316',
      }
      return colorMap[colorClass] || '#823F91'
    }
    const colors = ['#823F91', '#10B981', '#F59E0B', '#EF4444', '#ec4899']
    const hash = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <div className="w-full h-full">
      <Calendar
        mode="single"
        selected={selectedDate || undefined}
        onSelect={(date) => date && onDateSelect(date)}
        month={currentDate}
        onMonthChange={() => {}}
        locale={fr}
        className="rounded-lg border-0 [--cell-size:auto]"
        formatters={{
          formatCaption: (date) => {
            const monthName = format(date, 'MMMM', { locale: fr })
            return monthName.charAt(0).toUpperCase() + monthName.slice(1) + ' ' + format(date, 'yyyy')
          },
        }}
        modifiers={{
          hasEvents: events.map(event => {
            const [year, month, day] = event.date.split('-').map(Number)
            return new Date(year, month - 1, day)
          }),
        }}
        modifiersClassNames={{
          hasEvents: 'relative',
        }}
        components={{
          DayButton: (props) => {
            const dayEvents = getEventsForDate(props.day.date)
            const isCurrentDay = isToday(props.day.date)
            const isSelected = selectedDate && isSameDay(props.day.date, selectedDate)

            return (
              <div className="relative w-full h-full min-h-[120px] lg:min-h-[140px] xl:min-h-[160px] p-1 flex flex-col">
                <CalendarDayButton
                  {...props}
                  className={cn(
                    "h-7 rounded-md text-sm font-medium transition-colors mb-1 flex-shrink-0",
                    "hover:bg-gray-100",
                    isCurrentDay && "bg-[#823F91] text-white font-semibold",
                    isSelected && !isCurrentDay && "bg-[#823F91]/20",
                    props.modifiers.selected && "bg-[#823F91] text-white"
                  )}
                />
                {/* Liste des événements avec scroll */}
                <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
                  {dayEvents.map((event) => {
                    const colorHex = getEventColorHex(event)
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick?.(event)
                        }}
                        className={cn(
                          "text-xs px-2 py-1 rounded cursor-pointer transition-all",
                          "hover:shadow-md hover:opacity-90"
                        )}
                        style={{ backgroundColor: colorHex, color: 'white' }}
                        title={`${event.time ? `${event.time} - ` : ''}${event.title}`}
                      >
                        {showTime && event.time && (
                          <div className="flex items-center gap-1 mb-0.5">
                            <Clock className="w-3 h-3" />
                            <span className="font-medium">{event.time}</span>
                          </div>
                        )}
                        <div className="font-medium truncate">{event.title}</div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          },
        }}
        classNames={{
          months: "flex flex-col",
          month: "space-y-4 w-full",
          caption: "flex justify-center items-center pt-1 mb-4",
          caption_label: "text-xl font-semibold text-gray-900",
          nav: "space-x-1 flex items-center justify-between",
          nav_button: "opacity-0 pointer-events-none",
          table: "w-full border-collapse",
          head_row: "flex",
          head_cell: "text-gray-600 font-semibold text-xs sm:text-sm w-full py-2",
          row: "flex w-full border-b border-gray-200",
          cell: "flex-1 p-0 text-center relative focus-within:relative focus-within:z-20 border-r border-gray-200 last:border-r-0",
          day: "h-full w-full p-0 font-normal text-gray-900",
          day_selected: "bg-transparent",
          day_today: "bg-transparent",
          day_outside: "text-gray-300 opacity-50",
          day_disabled: "text-gray-200",
          day_hidden: "invisible",
        }}
      />
    </div>
  )
}
