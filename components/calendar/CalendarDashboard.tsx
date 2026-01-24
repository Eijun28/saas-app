'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, ChevronRight, Plus, Clock, Calendar as CalendarIcon, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, format, isBefore, startOfDay, isPast } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface CalendarEvent {
  id: string
  title: string
  date: string // Format YYYY-MM-DD
  time?: string // Format HH:MM (optionnel)
  description?: string
  [key: string]: any // Pour permettre d'autres propriétés spécifiques
}

type ViewMode = 'month' | 'week' | 'day' | 'agenda'

interface CalendarDashboardProps {
  events: CalendarEvent[]
  onEventCreate: (event: Omit<CalendarEvent, 'id'>) => Promise<void>
  onEventUpdate?: (event: CalendarEvent) => Promise<void>
  onEventDelete?: (eventId: string) => Promise<void>
  showTime?: boolean
  eventColor?: (event: CalendarEvent) => string
  loading?: boolean
  defaultView?: ViewMode
  showSidebar?: boolean
  enableMinimap?: boolean
}

export function CalendarDashboard({
  events,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  showTime = false,
  eventColor,
  loading = false,
  defaultView = 'month',
  showSidebar = false,
  enableMinimap = false,
}: CalendarDashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(showSidebar)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [newEvent, setNewEvent] = useState({
    date: null as Date | null,
    time: '',
    title: '',
    description: '',
  })
  const [editEvent, setEditEvent] = useState({
    date: null as Date | null,
    time: '',
    title: '',
    description: '',
  })

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const dayNamesFull = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

  // Navigation
  const previousPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))
    } else if (viewMode === 'day') {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000))
    }
  }

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))
    } else if (viewMode === 'day') {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Helpers
  const formatDateKey = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getEventsForDate = (dateKey: string) => {
    return events.filter(event => event.date === dateKey)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const getEventColor = (event: CalendarEvent) => {
    if (eventColor) {
      return eventColor(event)
    }
    return 'bg-[#823F91]'
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setNewEvent({ date, time: '', title: '', description: '' })
    setIsDialogOpen(true)
  }

  const handleAddEvent = async () => {
    if (!newEvent.date || !newEvent.title) return

    const dateKey = formatDateKey(newEvent.date)

    try {
      await onEventCreate({
        title: newEvent.title,
        date: dateKey,
        time: showTime ? newEvent.time : undefined,
        description: newEvent.description || undefined,
      })

      setNewEvent({ date: null, time: '', title: '', description: '' })
      setIsDialogOpen(false)
      setSelectedDate(null)
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error)
    }
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    const eventDate = new Date(event.date)
    setEditEvent({
      date: eventDate,
      time: event.time || '',
      title: event.title,
      description: event.description || '',
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateEvent = async () => {
    if (!selectedEvent || !editEvent.date || !editEvent.title) return

    try {
      const updatedEvent: CalendarEvent = {
        ...selectedEvent,
        title: editEvent.title,
        date: formatDateKey(editEvent.date),
        time: showTime ? editEvent.time : selectedEvent.time,
        description: editEvent.description || undefined,
      }

      if (onEventUpdate) {
        await onEventUpdate(updatedEvent)
      }

      setIsEditDialogOpen(false)
      setSelectedEvent(null)
      setEditEvent({ date: null, time: '', title: '', description: '' })
    } catch (error) {
      console.error('Erreur lors de la modification de l\'événement:', error)
    }
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent || !onEventDelete) return

    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      return
    }

    setIsDeleting(true)
    try {
      await onEventDelete(selectedEvent.id)
      setIsEditDialogOpen(false)
      setSelectedEvent(null)
      setEditEvent({ date: null, time: '', title: '', description: '' })
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Get period title
  const getPeriodTitle = () => {
    if (viewMode === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    } else if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate)
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
      return `Semaine du ${weekStart.getDate()} ${monthNames[weekStart.getMonth()].toLowerCase()}`
    } else if (viewMode === 'day') {
      return currentDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } else {
      return 'Agenda'
    }
  }

  // Get week start (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(d.setDate(diff))
  }

  // Get days in week
  const getWeekDays = (date: Date) => {
    const start = getWeekStart(date)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }

  // Get days in month for calendar grid
  const getMonthDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startDay = (firstDay.getDay() + 6) % 7

    const days: Date[] = []

    // Jours mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i))
    }

    // Jours mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    // Jours mois suivant - toujours 42 cellules
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i))
    }

    return days
  }

  // Render Month View
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    
    const days: Date[] = []
    let day = startDate
    
    // Générer uniquement jusqu'à la fin du mois (max 5 semaines)
    while (days.length < 35) {
      days.push(day)
      day = addDays(day, 1)
    }
    
    // Si le dernier jour n'est pas dans le mois suivant, on s'arrête
    const filteredDays = days.filter((d, index) => {
      if (index < 7) return true // Toujours garder la première semaine
      return isSameMonth(d, currentDate) || isBefore(d, monthEnd)
    })

    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col h-full overflow-hidden"
      >
        {/* En-têtes jours de la semaine */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-white">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center py-2 sm:py-2.5 md:py-3 text-[11px] sm:text-xs md:text-sm font-semibold text-gray-600"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours - DYNAMIQUE (5 semaines max) */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-0 overflow-hidden bg-white">
          {filteredDays.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())
            const isPastDay = isPast(startOfDay(day)) && !isToday
            const dayEvents = events.filter((event) =>
              isSameDay(new Date(event.date), day)
            )
            const hasEvents = dayEvents.length > 0

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.008 }}
                className={cn(
                  'border-r border-b border-gray-100 p-1.5 sm:p-2 md:p-2.5 lg:p-3',
                  'hover:bg-purple-50/30 transition-all duration-200 cursor-pointer',
                  'flex flex-col items-center justify-start min-h-0',
                  !isCurrentMonth && 'bg-gray-50/30',
                  isCurrentMonth && 'bg-white',
                  isPastDay && 'opacity-50'
                )}
                onClick={() => {
                  setSelectedDate(day)
                  if (hasEvents) {
                    // Ouvrir le pop-up d'événements
                    setShowEventDialog(true)
                  }
                }}
              >
                {/* Numéro du jour */}
                <div className="flex items-center justify-center mb-1 flex-shrink-0">
                  <span
                    className={cn(
                      'w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm md:text-base font-semibold transition-all',
                      isToday &&
                        'bg-[#823F91] text-white shadow-md',
                      !isToday && isCurrentMonth && !isPastDay && 'text-gray-900',
                      !isCurrentMonth && 'text-gray-400',
                      isPastDay && isCurrentMonth && 'text-gray-400'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Points d'événements */}
                {hasEvents && (
                  <div className="flex gap-1 justify-center mt-0.5">
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <div
                        key={idx}
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#823F91]"
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-300" />
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    )
  }

  // Render Week View
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8h à 20h

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col h-full overflow-hidden"
      >
        {/* En-têtes des jours */}
        <div className="grid border-b border-gray-100 bg-white flex-shrink-0" style={{ gridTemplateColumns: '50px repeat(7, 1fr)' }}>
          <div className="text-center py-2 sm:py-3 text-[10px] sm:text-xs font-medium text-gray-500 border-r border-gray-100">Heure</div>
          {weekDays.map((day, index) => {
            const isToday = isSameDay(day, new Date())
            const isPastDay = isPast(startOfDay(day)) && !isToday
            return (
              <div
                key={index}
                className={cn(
                  'text-center py-2 sm:py-3 transition-all',
                  isToday && 'bg-purple-50',
                  isPastDay && 'opacity-50'
                )}
              >
                <div className={cn('text-[10px] sm:text-xs font-medium', isToday ? 'text-[#823F91]' : isPastDay ? 'text-gray-400' : 'text-gray-600')}>
                  {format(day, 'EEE', { locale: fr })}
                </div>
                <div
                  className={cn(
                    'text-sm sm:text-base md:text-lg font-semibold mt-0.5 sm:mt-1',
                    isToday ? 'text-[#823F91]' : isPastDay ? 'text-gray-400' : 'text-gray-900'
                  )}
                >
                  {format(day, 'd')}
                </div>
              </div>
            )
          })}
        </div>

        {/* Grille des heures - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-gray-100">
          <div className="grid min-h-full" style={{ gridTemplateColumns: '50px repeat(7, 1fr)' }}>
            {/* Colonne des heures */}
            <div className="border-r border-gray-100 bg-gray-50/30">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-12 sm:h-16 md:h-20 border-b border-gray-100 flex items-start justify-end pr-2 pt-1"
                >
                  <span className="text-[10px] sm:text-xs font-medium text-gray-500">{`${hour}:00`}</span>
                </div>
              ))}
            </div>

            {/* Colonnes des jours */}
            {weekDays.map((day, dayIndex) => {
              const isToday = isSameDay(day, new Date())
              const isPastDay = isPast(startOfDay(day)) && !isToday
              const dayEvents = events.filter((event) =>
                isSameDay(new Date(event.date), day)
              )

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    'relative',
                    isToday && 'bg-purple-50/20',
                    isPastDay && 'opacity-50'
                  )}
                >
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="h-12 sm:h-16 md:h-20 border-b border-gray-100 hover:bg-purple-50/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedDate(day)}
                    />
                  ))}

                  {/* Événements positionnés */}
                  {dayEvents.map((event, idx) => {
                    // Utiliser event.time si disponible, sinon utiliser une heure par défaut (9h)
                    let eventHour = 9
                    let eventMinute = 0
                    
                    if (event.time) {
                      const [hours, minutes] = event.time.split(':').map(Number)
                      eventHour = hours || 9
                      eventMinute = minutes || 0
                    } else {
                      // Si pas d'heure, essayer d'extraire de la date
                      const eventDate = new Date(event.date)
                      if (!isNaN(eventDate.getTime())) {
                        eventHour = eventDate.getHours() || 9
                        eventMinute = eventDate.getMinutes() || 0
                      }
                    }
                    
                    // Ne pas afficher si l'heure est en dehors de la plage visible (8h-20h)
                    if (eventHour < 8 || eventHour > 20) return null
                    
                    // Calcul responsive : 48px (h-12) mobile, 64px (h-16) sm, 80px (h-20) md
                    const cellHeight = 48 // h-12 sur mobile
                    const top = (eventHour - 8) * cellHeight + (eventMinute / 60) * cellHeight
                    const height = 44

                    return (
                      <motion.div
                        key={event.id || idx}
                        whileHover={{ scale: 1.02, zIndex: 10 }}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        className="absolute left-0.5 right-0.5 sm:left-1 sm:right-1 bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white p-1 sm:p-1.5 rounded-md shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                        title={event.title}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                      >
                        <div className="text-[9px] sm:text-[10px] font-bold truncate leading-tight">{event.title}</div>
                        <div className="text-[8px] sm:text-[9px] opacity-90 mt-0.5 leading-tight">
                          {event.time || `${String(eventHour).padStart(2, '0')}:${String(eventMinute).padStart(2, '0')}`}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>
    )
  }

  // Render Day View
  const renderDayView = () => {
    const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8h à 20h
    const dayEvents = events.filter((event) =>
      isSameDay(new Date(event.date), selectedDate || currentDate)
    )

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col h-full overflow-hidden"
      >
        {/* Grille des heures - SCROLLABLE - Sans en-tête */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-gray-100">
          <div className="grid min-h-full" style={{ gridTemplateColumns: '60px 1fr' }}>
            {/* Colonne des heures */}
            <div className="border-r border-gray-100 bg-gray-50/50 sticky left-0 z-10">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-16 sm:h-20 md:h-24 border-b border-gray-100 flex items-start justify-end pr-1.5 xs:pr-2 sm:pr-2.5 md:pr-3 pt-1.5 xs:pt-2"
                >
                  <span className="text-[10px] xs:text-xs sm:text-sm font-semibold text-gray-600">{`${hour}:00`}</span>
                </div>
              ))}
            </div>

            {/* Colonne du jour */}
            <div className="relative bg-gradient-to-b from-white to-purple-50/10">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-16 sm:h-20 md:h-24 border-b border-gray-100 hover:bg-purple-50/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedDate(selectedDate || currentDate)}
                />
              ))}

              {/* Événements positionnés */}
              {dayEvents.map((event, idx) => {
                // Utiliser event.time si disponible, sinon utiliser une heure par défaut (9h)
                let eventHour = 9
                let eventMinute = 0
                
                if (event.time) {
                  const [hours, minutes] = event.time.split(':').map(Number)
                  eventHour = hours || 9
                  eventMinute = minutes || 0
                } else {
                  // Si pas d'heure, essayer d'extraire de la date
                  const eventDate = new Date(event.date)
                  if (!isNaN(eventDate.getTime())) {
                    eventHour = eventDate.getHours() || 9
                    eventMinute = eventDate.getMinutes() || 0
                  }
                }
                
                // Ne pas afficher si l'heure est en dehors de la plage visible (8h-20h)
                if (eventHour < 8 || eventHour > 20) return null
                
                // Calcul responsive : 64px (h-16) mobile, 80px (h-20) sm, 96px (h-24) md
                const top = (eventHour - 8) * 64 + (eventMinute / 60) * 64
                const height = 60

                return (
                  <motion.div
                    key={event.id || idx}
                    whileHover={{ scale: 1.01, zIndex: 10 }}
                    style={{ top: `${top}px`, height: `${height}px` }}
                    className="absolute left-1 right-1 sm:left-2 sm:right-2 md:left-3 md:right-3 bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white p-1.5 sm:p-2 md:p-3 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                    title={event.title}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEventClick(event)
                    }}
                  >
                    <div className="text-[10px] sm:text-xs md:text-sm font-bold truncate">{event.title}</div>
                    <div className="text-[9px] sm:text-[10px] opacity-90 mt-0.5">
                      {event.time || `${String(eventHour).padStart(2, '0')}:${String(eventMinute).padStart(2, '0')}`}
                    </div>
                    {event.description && (
                      <div className="text-[9px] sm:text-[10px] opacity-80 mt-1 line-clamp-2">
                        {event.description}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Render Agenda View
  const renderAgendaView = () => {
    const groupedEvents: { [key: string]: CalendarEvent[] } = {}
    
    const sortedEvents = [...events].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      if (a.time && b.time) return a.time.localeCompare(b.time)
      return 0
    })
    
    sortedEvents.forEach(event => {
      if (!groupedEvents[event.date]) groupedEvents[event.date] = []
      groupedEvents[event.date].push(event)
    })

    const dates = Object.keys(groupedEvents).sort()

    if (dates.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-900">Aucun événement</p>
            <p className="text-xs text-gray-500 mt-1">Cliquez sur "Nouvel événement"</p>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-4xl mx-auto p-3 xs:p-4 sm:p-5 md:p-6 space-y-4 xs:space-y-5 sm:space-y-6 overflow-y-auto">
        {dates.map((dateStr) => {
          const date = new Date(dateStr)
          const eventsForDate = groupedEvents[dateStr]
          const isTodayDate = isToday(date)
          const isPastDate = isPast(startOfDay(date)) && !isTodayDate

          return (
            <div key={dateStr}>
              <div className={cn(
                "flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-3 px-3 xs:px-4 py-2.5 xs:py-3 mb-2 xs:mb-3 rounded-lg sticky top-0 bg-white border-b border-gray-100 z-10",
                isTodayDate && "bg-purple-50/50",
                isPastDate && "opacity-50"
              )}>
                <div className={cn(
                  "text-sm xs:text-base font-semibold",
                  isPastDate ? "text-gray-400" : "text-gray-900"
                )}>
                  {date.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
                <div className={cn(
                  "text-xs xs:text-sm",
                  isPastDate ? "text-gray-400" : "text-gray-500"
                )}>
                  {eventsForDate.length} événement{eventsForDate.length > 1 ? 's' : ''}
                </div>
                {isTodayDate && (
                  <span className="xs:ml-auto text-xs font-medium text-[#823F91] bg-[#823F91]/10 px-2 py-1 rounded">
                    Aujourd'hui
                  </span>
                )}
              </div>
            
              <div className={cn(
                "space-y-2 ml-2 xs:ml-4",
                isPastDate && "opacity-60"
              )}>
                {eventsForDate.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col xs:flex-row items-start xs:items-start gap-2 xs:gap-3 p-2.5 xs:p-3 rounded-lg border border-gray-200 hover:border-[#823F91]/30 hover:bg-gray-50/50 cursor-pointer transition-all"
                    onClick={() => handleEventClick(event)}
                  >
                    {event.time && (
                      <div className="flex-shrink-0 w-full xs:w-16 text-xs xs:text-sm font-medium text-gray-600">
                        {event.time}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm xs:text-base font-medium text-gray-900">{event.title}</h4>
                      {event.description && (
                        <p className="text-xs xs:text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Pop-up d'événements pour la vue mois
  const selectedDayEvents = events.filter((event) =>
    isSameDay(new Date(event.date), selectedDate || currentDate)
  )

  return (
    <div className="flex h-full w-full">
      {/* Main content */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 flex flex-col gap-2 sm:gap-0 px-2 sm:px-4 md:px-6 py-2 sm:py-4 bg-white border-b border-gray-100">
          {/* Mobile: Navigation compacte */}
          <div className="flex items-center justify-between sm:hidden">
            {showSidebar && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 text-gray-600 hover:text-gray-900"
              >
                {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            )}
            {/* Flèches de navigation mobile */}
            <button
              onClick={previousPeriod}
              className="p-1.5 text-[#823F91] hover:bg-purple-50 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-xs font-medium bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent flex-1 text-center px-2">
              {getPeriodTitle()}
            </h2>
            <button
              onClick={nextPeriod}
              className="p-1.5 text-[#823F91] hover:bg-purple-50 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const today = new Date()
                setSelectedDate(today)
                setNewEvent({ date: today, time: '', title: '', description: '' })
                setIsDialogOpen(true)
              }}
              className="p-1.5 text-[#823F91] hover:bg-purple-50 rounded-lg"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile: Sélecteur de vue */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 sm:hidden">
            {(['month', 'week', 'day', 'agenda'] as const).map((viewType) => {
              const labels = {
                month: 'Mois',
                week: 'Semaine',
                day: 'Jour',
                agenda: 'Agenda',
              }
              
              return (
                <button
                  key={viewType}
                  onClick={() => setViewMode(viewType)}
                  className={cn(
                    'flex-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all',
                    viewMode === viewType
                      ? 'bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white shadow-sm'
                      : 'text-[#823F91] hover:bg-purple-50'
                  )}
                >
                  {labels[viewType]}
                </button>
              )
            })}
          </div>

          {/* Desktop: Navigation complète */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 flex-1">
              {showSidebar && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              )}
              {/* Flèche gauche */}
              <Button
                variant="ghost"
                size="icon"
                onClick={previousPeriod}
                className="h-8 w-8 text-[#823F91] hover:bg-purple-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {/* Titre au centre */}
              <h2 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent flex-1 text-center px-2">
                {getPeriodTitle()}
              </h2>
              {/* Flèche droite */}
              <Button
                variant="ghost"
                size="icon"
                onClick={nextPeriod}
                className="h-8 w-8 text-[#823F91] hover:bg-purple-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <button
                onClick={goToToday}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all text-[#823F91] hover:bg-purple-50 ml-1"
              >
                Aujourd'hui
              </button>
            </div>

            {/* Desktop: Sélecteur de vue */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(['month', 'week', 'day', 'agenda'] as const).map((viewType) => {
                const labels = {
                  month: 'Mois',
                  week: 'Semaine',
                  day: 'Jour',
                  agenda: 'Agenda',
                }
                
                return (
                  <button
                    key={viewType}
                    onClick={() => setViewMode(viewType)}
                    className={cn(
                      'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all',
                      viewMode === viewType
                        ? 'bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white shadow-md'
                        : 'text-[#823F91] hover:bg-purple-50'
                    )}
                  >
                    {labels[viewType]}
                  </button>
                )
              })}
            </div>

            {/* Desktop: Actions */}
            <Button
              onClick={() => {
                const today = new Date()
                setSelectedDate(today)
                setNewEvent({ date: today, time: '', title: '', description: '' })
                setIsDialogOpen(true)
              }}
              className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white shadow-lg"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvel événement
            </Button>
          </div>
        </div>

        {/* Calendar content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#823F91] mx-auto mb-4"></div>
                    <p className="text-gray-500">Chargement...</p>
                  </div>
                </div>
              ) : (
                <>
                  {viewMode === 'month' && renderMonthView()}
                  {viewMode === 'week' && renderWeekView()}
                  {viewMode === 'day' && renderDayView()}
                  {viewMode === 'agenda' && renderAgendaView()}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Event creation dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent size="sm" className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Créer un événement</DialogTitle>
          </DialogHeader>

          <motion.div
            className="space-y-4 py-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {/* 1. Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <DatePicker
                value={newEvent.date || undefined}
                onChange={(date) => setNewEvent({ ...newEvent, date: date || null })}
                placeholder="Sélectionner une date"
              />
            </div>

            {/* 2. Heure (si showTime est activé) */}
            {showTime && (
              <div className="space-y-2">
                <Label htmlFor="time">Heure</Label>
                <Input
                  id="time"
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  placeholder="HH:MM"
                />
              </div>
            )}

            {/* 3. Titre */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'événement *</Label>
              <Input
                id="title"
                placeholder="Ex: Essayage robe, Dégustation menu..."
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                autoFocus
              />
            </div>

            {/* 4. Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                placeholder="Ajoutez des détails sur cet événement..."
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="min-h-[80px] resize-none"
                rows={3}
              />
            </div>
          </motion.div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                setNewEvent({ date: null, time: '', title: '', description: '' })
                setSelectedDate(null)
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddEvent}
              className="bg-[#823F91] hover:bg-[#6D3478] text-white"
              disabled={!newEvent.title || !newEvent.date}
            >
              Créer l'événement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event edit/delete dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent size="sm" className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Modifier l'événement</DialogTitle>
          </DialogHeader>

          <motion.div
            className="space-y-4 py-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {/* 1. Date */}
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date *</Label>
              <DatePicker
                value={editEvent.date || undefined}
                onChange={(date) => setEditEvent({ ...editEvent, date: date || null })}
                placeholder="Sélectionner une date"
              />
            </div>

            {/* 2. Heure (si showTime est activé) */}
            {showTime && (
              <div className="space-y-2">
                <Label htmlFor="edit-time">Heure</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editEvent.time}
                  onChange={(e) => setEditEvent({ ...editEvent, time: e.target.value })}
                  placeholder="HH:MM"
                />
              </div>
            )}

            {/* 3. Titre */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre de l'événement *</Label>
              <Input
                id="edit-title"
                placeholder="Ex: Essayage robe, Dégustation menu..."
                value={editEvent.title}
                onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                autoFocus
              />
            </div>

            {/* 4. Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optionnel)</Label>
              <Textarea
                id="edit-description"
                placeholder="Ajoutez des détails sur cet événement..."
                value={editEvent.description}
                onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
                className="min-h-[80px] resize-none"
                rows={3}
              />
            </div>
          </motion.div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={handleDeleteEvent}
              disabled={isDeleting || !onEventDelete}
              className="w-full sm:w-auto"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setSelectedEvent(null)
                  setEditEvent({ date: null, time: '', title: '', description: '' })
                }}
                className="flex-1 sm:flex-none"
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpdateEvent}
                disabled={!editEvent.title || !editEvent.date}
                className="bg-[#823F91] hover:bg-[#6D3478] text-white flex-1 sm:flex-none"
              >
                Enregistrer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog événements du jour */}
      <AnimatePresence>
        {showEventDialog && selectedDayEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowEventDialog(false)}
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9999
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl xs:rounded-2xl shadow-2xl max-w-[calc(100vw-1rem)] sm:max-w-md w-full max-h-[60vh] sm:max-h-[70vh] overflow-hidden mx-2 xs:mx-4 relative z-[10000]"
            >
              {/* En-tête */}
              <div className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white p-3 xs:p-4 sm:p-6">
                <h3 className="text-base xs:text-lg sm:text-xl font-bold">
                  {format(selectedDate || currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </h3>
                <p className="text-xs xs:text-sm opacity-90 mt-1">
                  {selectedDayEvents.length} événement{selectedDayEvents.length > 1 ? 's' : ''}
                </p>
              </div>

              {/* Liste des événements */}
              <div className="p-3 xs:p-4 sm:p-6 space-y-2 xs:space-y-3 overflow-y-auto max-h-[calc(85vh-140px)] xs:max-h-[calc(80vh-120px)]">
                {selectedDayEvents.map((event, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-2.5 xs:p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg xs:rounded-xl border border-purple-200 hover:shadow-md transition-shadow"
                  >
                    <div className="text-sm xs:text-base font-semibold text-gray-900">{event.title}</div>
                    <div className="text-xs xs:text-sm text-purple-600 mt-0.5 xs:mt-1">
                      {format(new Date(event.date), 'HH:mm')}
                    </div>
                    {event.description && (
                      <div className="text-xs xs:text-sm text-gray-600 mt-1.5 xs:mt-2">{event.description}</div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-3 xs:p-4 border-t border-gray-200">
                <button
                  onClick={() => setShowEventDialog(false)}
                  className="w-full py-2 xs:py-2.5 bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white rounded-lg font-medium hover:shadow-lg transition-shadow text-sm xs:text-base"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
