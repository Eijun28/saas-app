'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { format, startOfWeek, addDays, isSameDay, isToday, eachDayOfInterval, addHours, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Clock } from 'lucide-react'
import { CalendarEvent } from '../types'

interface WeekViewProps {
  currentDate: Date
  selectedDate: Date | null
  events: CalendarEvent[]
  onDateSelect: (date: Date) => void
  onCellClick?: (date: Date, hour: number) => void
  onEventClick?: (event: CalendarEvent) => void
  eventColor?: (event: CalendarEvent) => string
}

export function WeekView({
  currentDate,
  selectedDate,
  events,
  onDateSelect,
  onCellClick,
  onEventClick,
  eventColor,
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Lundi
  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getEventsForDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd')
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
    return '#823F91'
  }

  const calculateEventPosition = (event: CalendarEvent) => {
    if (!event.time) return { top: 0, height: 60 }
    const [hours, minutes] = event.time.split(':').map(Number)
    const top = hours * 60 + minutes
    const duration = 60 // Par défaut 1h
    return { top, height: duration }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header jours */}
      <div className="grid grid-cols-8 border-b sticky top-0 bg-white z-10 shadow-sm">
        <div className="p-4 border-r"></div> {/* Colonne heures */}
        {weekDays.map(day => {
          const dayEvents = getEventsForDay(day)
          const isCurrentDay = isToday(day)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          
          return (
            <div
              key={day.toString()}
              className={cn(
                "p-4 text-center border-r cursor-pointer transition-colors",
                isCurrentDay && "bg-[#823F91]/10",
                isSelected && "bg-[#823F91]/20"
              )}
              onClick={() => onDateSelect(day)}
            >
              <div className="text-xs text-muted-foreground mb-1">
                {format(day, 'EEE', { locale: fr })}
              </div>
              <div className={cn(
                "text-2xl font-bold mt-1 rounded-full w-10 h-10 flex items-center justify-center mx-auto transition-colors",
                isCurrentDay && "bg-[#823F91] text-white shadow-lg",
                isSelected && !isCurrentDay && "bg-[#823F91]/20 text-[#823F91]"
              )}>
                {day.getDate()}
              </div>
              {dayEvents.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {dayEvents.length} événement{dayEvents.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Grille horaire */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8 relative">
          {/* Colonne des heures */}
          <div className="border-r sticky left-0 bg-white z-10">
            {hours.map(hour => (
              <div
                key={hour}
                className="h-[60px] border-b px-2 pt-1 text-xs text-muted-foreground bg-gray-50"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Colonnes des jours */}
          {weekDays.map(day => {
            const dayEvents = getEventsForDay(day)
            
            return (
              <div key={day.toString()} className="border-r relative">
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="h-[60px] border-b hover:bg-gray-50/50 transition-colors cursor-pointer relative group"
                    onClick={() => onCellClick?.(day, hour)}
                  >
                    {/* Ligne de l'heure actuelle */}
                    {isToday(day) && new Date().getHours() === hour && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#823F91] z-20" />
                    )}
                  </div>
                ))}
                
                {/* Événements positionnés absolument */}
                <div className="absolute inset-0 pointer-events-none">
                  {dayEvents.map(event => {
                    const { top, height } = calculateEventPosition(event)
                    const colorHex = getEventColorHex(event)
                    
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute left-1 right-1 rounded-md shadow-sm pointer-events-auto cursor-pointer hover:shadow-md transition-shadow z-20"
                        style={{
                          top: `${top}px`,
                          height: `${Math.max(height, 30)}px`,
                          backgroundColor: colorHex,
                          color: 'white',
                        }}
                        onClick={() => onEventClick?.(event)}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="p-1.5 h-full flex flex-col justify-center">
                          {event.time && (
                            <div className="flex items-center gap-1 text-xs font-medium mb-0.5">
                              <Clock className="w-3 h-3" />
                              {event.time}
                            </div>
                          )}
                          <div className="text-xs font-semibold truncate">{event.title}</div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
