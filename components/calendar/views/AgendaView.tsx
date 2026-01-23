'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { format, isSameDay, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarEvent } from '../types'

interface AgendaViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  eventColor?: (event: CalendarEvent) => string
}

export function AgendaView({
  events,
  onEventClick,
  eventColor,
}: AgendaViewProps) {
  // Grouper les événements par date
  const groupedEvents = events.reduce((acc, event) => {
    const dateKey = event.date
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(event)
    return acc
  }, {} as Record<string, CalendarEvent[]>)

  // Trier les dates
  const sortedDates = Object.keys(groupedEvents).sort()

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

  if (sortedDates.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">Aucun événement à venir</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {sortedDates.map((dateKey, dateIndex) => {
        const date = parseISO(dateKey)
        const dayEvents = groupedEvents[dateKey]
        
        return (
          <motion.div
            key={dateKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dateIndex * 0.05 }}
          >
            {/* Date header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex flex-col items-center justify-center text-white shadow-lg">
                <span className="text-2xl font-bold">{date.getDate()}</span>
                <span className="text-xs uppercase">
                  {format(date, 'MMM', { locale: fr })}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {dayEvents.length} événement{dayEvents.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Timeline des événements */}
            <div className="ml-8 border-l-2 border-gray-200 pl-6 space-y-4">
              {dayEvents.map((event, eventIndex) => {
                const colorHex = getEventColorHex(event)
                
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (dateIndex * 0.05) + (eventIndex * 0.03) }}
                    className="relative"
                  >
                    {/* Point sur la timeline */}
                    <div
                      className="absolute -left-[29px] w-4 h-4 rounded-full border-4 border-white shadow"
                      style={{ backgroundColor: colorHex }}
                    />
                    
                    <Card
                      className="hover:shadow-lg transition-all cursor-pointer border-l-4"
                      style={{ borderLeftColor: colorHex }}
                      onClick={() => onEventClick?.(event)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {event.time && (
                              <span className="text-sm font-semibold flex items-center gap-1 mb-2" style={{ color: colorHex }}>
                                <Clock className="w-4 h-4" />
                                {event.time}
                              </span>
                            )}
                            <h4 className="font-semibold text-lg text-gray-900 mb-1">
                              {event.title}
                            </h4>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
