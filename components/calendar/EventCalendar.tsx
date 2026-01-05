'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { format, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DayButton } from 'react-day-picker'

export interface CalendarEvent {
  id: string
  title: string
  date: Date | string
  time?: string
  color?: string
  [key: string]: any
}

interface EventCalendarProps {
  events: CalendarEvent[]
  onDateSelect?: (date: Date | undefined) => void
  onEventClick?: (event: CalendarEvent) => void
  selectedDate?: Date
  className?: string
  showEventList?: boolean
  compact?: boolean
}

export function EventCalendar({
  events,
  onDateSelect,
  onEventClick,
  selectedDate,
  className,
  showEventList = true,
  compact = false,
}: EventCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate || new Date())
  const [selected, setSelected] = useState<Date | undefined>(selectedDate)

  // Convertir les dates string en Date si nécessaire
  const normalizedEvents = events.map(event => ({
    ...event,
    date: typeof event.date === 'string' ? new Date(event.date) : event.date,
  }))

  // Obtenir les événements pour une date donnée
  const getEventsForDate = (date: Date) => {
    return normalizedEvents.filter(event => 
      isSameDay(new Date(event.date), date)
    )
  }

  // Obtenir les événements du mois actuel
  const getMonthEvents = () => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })
    
    return days.map(day => ({
      date: day,
      events: getEventsForDate(day),
    }))
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelected(date)
    onDateSelect?.(date)
  }

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date)
  }

  const selectedDateEvents = selected ? getEventsForDate(selected) : []
  const monthEvents = getMonthEvents()

  // Compteur d'événements par jour pour afficher des indicateurs
  const getEventCountForDate = (date: Date) => {
    return getEventsForDate(date).length
  }

  const calendarContent = (
    <div className="relative w-full">
      {!compact && (
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-[#823F91]" />
            <span className="font-semibold text-[#823F91]">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newDate = new Date(currentMonth)
                newDate.setMonth(newDate.getMonth() - 1)
                handleMonthChange(newDate)
              }}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMonthChange(new Date())}
              className="h-8 text-xs"
            >
              Aujourd'hui
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newDate = new Date(currentMonth)
                newDate.setMonth(newDate.getMonth() + 1)
                handleMonthChange(newDate)
              }}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {compact && (
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-[#823F91]" />
            <span className="font-semibold text-black">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newDate = new Date(currentMonth)
                newDate.setMonth(newDate.getMonth() - 1)
                handleMonthChange(newDate)
              }}
              className="h-8 w-8 text-black hover:bg-accent/50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMonthChange(new Date())}
              className="h-8 text-xs text-black hover:bg-accent/50"
            >
              Aujourd'hui
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newDate = new Date(currentMonth)
                newDate.setMonth(newDate.getMonth() + 1)
                handleMonthChange(newDate)
              }}
              className="h-8 w-8 text-black hover:bg-accent/50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <Calendar
        mode="single"
        selected={selected}
        onSelect={handleDateSelect}
        month={currentMonth}
        onMonthChange={handleMonthChange}
        className="rounded-lg border-0 w-full [--cell-size:--spacing(12)] md:[--cell-size:--spacing(14)]"
        locale={fr}
        modifiers={{
          hasEvents: monthEvents
            .filter(day => day.events.length > 0)
            .map(day => day.date),
        }}
        modifiersClassNames={{
          hasEvents: 'relative',
        }}
        components={{
          DayButton: (props) => {
            const eventCount = getEventCountForDate(props.day.date)
            const dayEvents = getEventsForDate(props.day.date)
            const isSelected = selected && isSameDay(props.day.date, selected)
            const isCurrentDay = isToday(props.day.date)

            return (
              <div className="relative w-full h-full">
                <CalendarDayButton 
                  {...props} 
                  className={cn(
                    props.className,
                    "border-0 shadow-none hover:bg-accent/50 text-black",
                    !isSelected && "text-black",
                    isSelected && "text-white"
                  )}
                />
                {eventCount > 0 && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 justify-center items-center pointer-events-none">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          'h-1 w-1 rounded-full',
                          isSelected ? 'bg-white' : 'bg-[#823F91]',
                        )}
                        style={{
                          backgroundColor: event.color || (isSelected ? '#ffffff' : '#823F91'),
                        }}
                      />
                    ))}
                    {eventCount > 3 && (
                      <span className={cn(
                        'text-[8px] leading-none ml-0.5',
                        isSelected ? 'text-white' : 'text-[#823F91]',
                      )}>
                        +{eventCount - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          },
        }}
        classNames={{
          day: cn(
            "relative border-0",
          ),
          selected: "bg-[#823F91] text-white hover:bg-[#6D3478]",
          weekday: "text-black font-medium",
          month_caption: "text-black",
          caption_label: "text-black",
        }}
      />
    </div>
  )

  if (compact) {
    return (
      <Card className={cn('border-[#823F91]/20 bg-background shadow-lg', className)}>
        <CardContent className="p-4">
          {calendarContent}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Calendrier principal */}
      <Card className="border-[#823F91]/20 bg-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent">
              <CalendarIcon className="h-5 w-5 text-[#823F91]" />
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(currentMonth)
                  newDate.setMonth(newDate.getMonth() - 1)
                  handleMonthChange(newDate)
                }}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthChange(new Date())}
                className="h-8"
              >
                Aujourd'hui
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(currentMonth)
                  newDate.setMonth(newDate.getMonth() + 1)
                  handleMonthChange(newDate)
                }}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {calendarContent}
        </CardContent>
      </Card>

      {/* Liste des événements pour la date sélectionnée */}
      {showEventList && selected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-[#823F91]/20 bg-background">
            <CardHeader>
              <CardTitle className="text-lg">
                {isToday(selected) ? "Aujourd'hui" : format(selected, 'EEEE d MMMM yyyy', { locale: fr })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun événement prévu pour cette date
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDateEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className={cn(
                        'p-3 rounded-lg border border-[#823F91]/20 bg-background hover:bg-[#823F91]/5 transition-all cursor-pointer',
                        'hover:shadow-md hover:shadow-[#823F91]/10'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="h-2 w-2 rounded-full mt-2 flex-shrink-0"
                          style={{
                            backgroundColor: event.color || '#823F91',
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-900 mb-1">
                            {event.title}
                          </h4>
                          {event.time && (
                            <p className="text-xs text-muted-foreground">
                              {event.time}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

