'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { format, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Clock } from 'lucide-react'
import { CalendarEvent } from '../types'

interface DayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onCellClick?: (date: Date, hour: number) => void
  onEventClick?: (event: CalendarEvent) => void
  eventColor?: (event: CalendarEvent) => string
}

export function DayView({
  currentDate,
  events,
  onCellClick,
  onEventClick,
  eventColor,
}: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const dateKey = format(currentDate, 'yyyy-MM-dd')
  const dayEvents = events.filter(event => event.date === dateKey)
  const isCurrentDay = isToday(currentDate)

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
      {/* Header jour */}
      <div className="border-b sticky top-0 bg-white z-10 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </h2>
            {isCurrentDay && (
              <p className="text-sm text-muted-foreground mt-1">Aujourd'hui</p>
            )}
          </div>
          {dayEvents.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {dayEvents.length} événement{dayEvents.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Grille horaire */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 relative max-w-4xl mx-auto">
          {/* Colonne des heures */}
          <div className="border-r sticky left-0 bg-white z-10">
            {hours.map(hour => (
              <div
                key={hour}
                className="h-[80px] border-b px-4 pt-2 text-sm text-muted-foreground bg-gray-50"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Colonne principale */}
          <div className="relative">
            {hours.map(hour => (
              <div
                key={hour}
                className="h-[80px] border-b hover:bg-gray-50/50 transition-colors cursor-pointer relative group"
                onClick={() => onCellClick?.(currentDate, hour)}
              >
                {/* Ligne de l'heure actuelle */}
                {isCurrentDay && new Date().getHours() === hour && (
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
                    className="absolute left-2 right-2 rounded-lg shadow-md pointer-events-auto cursor-pointer hover:shadow-lg transition-shadow z-20"
                    style={{
                      top: `${top}px`,
                      height: `${Math.max(height, 60)}px`,
                      backgroundColor: colorHex,
                      color: 'white',
                    }}
                    onClick={() => onEventClick?.(event)}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="p-3 h-full flex flex-col justify-center">
                      {event.time && (
                        <div className="flex items-center gap-2 text-sm font-medium mb-1">
                          <Clock className="w-4 h-4" />
                          {event.time}
                        </div>
                      )}
                      <div className="text-base font-semibold mb-1">{event.title}</div>
                      {event.description && (
                        <div className="text-xs opacity-90 line-clamp-2">{event.description}</div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
