'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
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
  endTime?: string // Format HH:MM (optionnel)
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
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const weekScrollRef = useRef<HTMLDivElement>(null)
  const dayScrollRef = useRef<HTMLDivElement>(null)
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

  const [currentTime, setCurrentTime] = useState(new Date())

  // Auto-scroll to current hour when switching to week/day view
  useEffect(() => {
    if (viewMode !== 'week' && viewMode !== 'day') return
    const scrollToCurrentHour = () => {
      const ref = viewMode === 'week' ? weekScrollRef.current : dayScrollRef.current
      if (!ref) return
      const currentHour = new Date().getHours()
      const hourHeight = viewMode === 'week' ? 64 : 72
      const scrollTop = Math.max(0, (currentHour - 8) * hourHeight - 80)
      ref.scrollTop = scrollTop
    }
    const timer = setTimeout(scrollToCurrentHour, 80)
    return () => clearTimeout(timer)
  }, [viewMode])

  // Tick every minute to keep the current time indicator up to date
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Swipe gesture handlers for mobile navigation (not used in week view due to h-scroll)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (viewMode === 'week') return
    setTouchStartX(e.targetTouches[0].clientX)
    setTouchStartY(e.targetTouches[0].clientY)
  }, [viewMode])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (viewMode === 'week' || touchStartX === null || touchStartY === null) return
    const deltaX = touchStartX - e.changedTouches[0].clientX
    const deltaY = Math.abs(touchStartY - e.changedTouches[0].clientY)
    // Only navigate if swipe is clearly horizontal (not a scroll attempt)
    if (Math.abs(deltaX) < 50 || deltaY > Math.abs(deltaX) * 0.75) return
    if (deltaX > 0) nextPeriod()
    else previousPeriod()
    setTouchStartX(null)
    setTouchStartY(null)
  }, [viewMode, touchStartX, touchStartY])

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
      // Pour la vue jour, utiliser selectedDate si défini, sinon currentDate
      const dateToUse = selectedDate || currentDate
      // Normaliser la date et soustraire un jour
      const normalizedDate = normalizeDate(dateToUse)
      const previousDay = new Date(normalizedDate.getTime() - 24 * 60 * 60 * 1000)
      setCurrentDate(previousDay)
      setSelectedDate(previousDay)
    }
  }

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))
    } else if (viewMode === 'day') {
      // Pour la vue jour, utiliser selectedDate si défini, sinon currentDate
      const dateToUse = selectedDate || currentDate
      // Normaliser la date et ajouter un jour
      const normalizedDate = normalizeDate(dateToUse)
      const nextDay = new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000)
      setCurrentDate(nextDay)
      setSelectedDate(nextDay)
    }
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  // Helpers
  const normalizeDate = (date: Date): Date => {
    // Normaliser la date à minuit en heure locale pour éviter les problèmes de fuseau horaire
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }

  const formatDateKey = (date: Date) => {
    // Utiliser la date normalisée pour éviter les problèmes de fuseau horaire
    const normalized = normalizeDate(date)
    const year = normalized.getFullYear()
    const month = String(normalized.getMonth() + 1).padStart(2, '0')
    const day = String(normalized.getDate()).padStart(2, '0')
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
    const normalizedDate = normalizeDate(date)
    setSelectedDate(normalizedDate)
    setNewEvent({ date: normalizedDate, time: '', title: '', description: '' })
    setIsDialogOpen(true)
  }

  const handleAddEvent = async () => {
    if (!newEvent.date || !newEvent.title) return

    // Normaliser la date avant de la formater
    const normalizedDate = normalizeDate(newEvent.date)
    const dateKey = formatDateKey(normalizedDate)

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
    // Créer la date en utilisant les composants pour éviter les problèmes de fuseau horaire
    const [year, month, day] = event.date.split('-').map(Number)
    const eventDate = new Date(year, month - 1, day)
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
      // Normaliser la date avant de la formater
      const normalizedDate = normalizeDate(editEvent.date)
      const updatedEvent: CalendarEvent = {
        ...selectedEvent,
        title: editEvent.title,
        date: formatDateKey(normalizedDate),
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
    setIsDeleting(true)
    try {
      await onEventDelete(selectedEvent.id)
      setIsDeleteConfirmOpen(false)
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
      // Utiliser selectedDate si défini, sinon currentDate
      const dateToDisplay = selectedDate || currentDate
      return dateToDisplay.toLocaleDateString('fr-FR', {
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
              className="text-center py-2.5 sm:py-3 md:py-3.5 text-xs sm:text-sm md:text-base font-semibold text-gray-600"
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
                  'border-r border-b border-gray-100 p-1.5 sm:p-2 md:p-2.5',
                  'hover:bg-purple-50/30 active:bg-purple-50/60 transition-all duration-150 cursor-pointer touch-manipulation',
                  'flex flex-col items-center sm:items-start justify-start min-h-[52px] sm:min-h-[80px] md:min-h-[90px]',
                  !isCurrentMonth && 'bg-gray-50/30',
                  isCurrentMonth && 'bg-white',
                  isPastDay && 'opacity-50'
                )}
                onClick={() => {
                  const normalizedDay = normalizeDate(day)
                  setSelectedDate(normalizedDay)
                  setCurrentDate(normalizedDay)
                  setViewMode('day')
                }}
              >
                {/* Numéro du jour */}
                <div className="flex items-center justify-center mb-1.5 sm:mb-1 flex-shrink-0">
                  <span
                    className={cn(
                      'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm sm:text-base md:text-lg font-semibold transition-all',
                      isToday &&
                        'bg-[#823F91] text-white shadow-md scale-105',
                      !isToday && isCurrentMonth && !isPastDay && 'text-gray-900',
                      !isCurrentMonth && 'text-gray-400',
                      isPastDay && isCurrentMonth && 'text-gray-400'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Événements : points sur mobile, pills avec titre sur desktop */}
                {hasEvents && (
                  <div className="w-full mt-1">
                    {/* Mobile : points */}
                    <div className="flex gap-1 justify-center sm:hidden">
                      {dayEvents.slice(0, 3).map((_, idx) => (
                        <div key={idx} className="w-1.5 h-1.5 rounded-full bg-[#823F91]" />
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-300" />
                      )}
                    </div>
                    {/* Desktop : pill avec titre */}
                    <div className="hidden sm:flex flex-col gap-0.5 w-full">
                      {dayEvents.slice(0, 2).map((ev, idx) => (
                        <div
                          key={idx}
                          className="w-full text-left px-1.5 py-0.5 bg-[#823F91]/10 hover:bg-[#823F91]/20 text-[#6D3478] text-[10px] md:text-xs font-medium rounded truncate transition-colors"
                          title={ev.title}
                          onClick={(e) => { e.stopPropagation(); handleEventClick(ev) }}
                        >
                          {ev.time && <span className="opacity-70 mr-1">{ev.time.slice(0, 5)}</span>}
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-gray-400 pl-1">
                          +{dayEvents.length - 2} autre{dayEvents.length - 2 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    )
  }

  // Calcule les positions (top, height) et les colonnes de chevauchement pour un ensemble d'événements
  const layoutEvents = (dayEvents: CalendarEvent[], hourHeight: number) => {
    type LayoutEvent = CalendarEvent & { top: number; height: number; col: number; totalCols: number }

    const positioned: LayoutEvent[] = dayEvents.map((event) => {
      let h = 9, m = 0
      if (event.time) { [h, m] = event.time.split(':').map(Number) }
      const top = (h - 8) * hourHeight + (m / 60) * hourHeight

      let endH = h + 1, endM = m
      if (event.endTime) { [endH, endM] = event.endTime.split(':').map(Number) }
      const endTop = (endH - 8) * hourHeight + (endM / 60) * hourHeight
      const height = Math.max(endTop - top, hourHeight * 0.75) // min 45min de hauteur visuelle

      return { ...event, top, height, col: 0, totalCols: 1 }
    })

    // Algorithme de colonnes : pour chaque event, chercher la première colonne libre
    const columns: LayoutEvent[][] = []
    positioned.sort((a, b) => a.top - b.top)

    positioned.forEach((event) => {
      let placed = false
      for (let c = 0; c < columns.length; c++) {
        const lastInCol = columns[c][columns[c].length - 1]
        if (lastInCol.top + lastInCol.height <= event.top + 2) {
          event.col = c
          columns[c].push(event)
          placed = true
          break
        }
      }
      if (!placed) {
        event.col = columns.length
        columns.push([event])
      }
    })

    const totalCols = columns.length
    positioned.forEach((e) => { e.totalCols = totalCols })

    return positioned
  }

  // Render Week View
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8h à 20h
    const HOUR_HEIGHT = 64 // px par heure — plus aéré qu'avant (56px)
    const TIME_COL_WIDTH = '60px'
    const GRID_COLS = `${TIME_COL_WIDTH} repeat(7, minmax(90px, 1fr))`
    const GRID_MIN_WIDTH = '690px'

    // Indicateur heure courante
    const nowHour = currentTime.getHours()
    const nowMinute = currentTime.getMinutes()
    const nowTop = (nowHour - 8) * HOUR_HEIGHT + (nowMinute / 60) * HOUR_HEIGHT
    const isCurrentWeek = weekDays.some((d) => isSameDay(d, new Date()))

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col h-full overflow-hidden"
      >
        {/* Conteneur scrollable horizontal + vertical */}
        <div
          ref={weekScrollRef}
          className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-gray-100"
        >
          <div style={{ minWidth: GRID_MIN_WIDTH }}>

            {/* En-têtes des jours — sticky en haut */}
            <div
              className="grid sticky top-0 bg-white z-20 border-b border-gray-200 shadow-sm"
              style={{ gridTemplateColumns: GRID_COLS }}
            >
              {/* Coin heure */}
              <div className="border-r border-gray-100 bg-gray-50/60" />

              {weekDays.map((day, index) => {
                const isToday = isSameDay(day, new Date())
                const isPastDay = isPast(startOfDay(day)) && !isToday
                return (
                  <div
                    key={index}
                    className={cn(
                      'text-center py-3 transition-all cursor-pointer touch-manipulation hover:bg-purple-50/40 border-r border-gray-100 last:border-r-0',
                      isToday && 'bg-purple-50/60',
                      isPastDay && 'opacity-50'
                    )}
                    onClick={() => {
                      setSelectedDate(day)
                      setCurrentDate(day)
                      setViewMode('day')
                    }}
                  >
                    {/* Nom du jour — abrégé mobile, complet desktop */}
                    <div className={cn(
                      'text-xs font-medium uppercase tracking-wide',
                      isToday ? 'text-[#823F91]' : isPastDay ? 'text-gray-400' : 'text-gray-500'
                    )}>
                      <span className="sm:hidden">{format(day, 'EEE', { locale: fr })}</span>
                      <span className="hidden sm:inline">{format(day, 'EEEE', { locale: fr })}</span>
                    </div>
                    {/* Numéro du jour */}
                    <div className={cn(
                      'mt-1 mx-auto w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-base sm:text-lg font-bold transition-all',
                      isToday
                        ? 'bg-[#823F91] text-white shadow-md'
                        : isPastDay
                          ? 'text-gray-400'
                          : 'text-gray-900 hover:bg-purple-100'
                    )}>
                      {format(day, 'd')}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Grille des heures */}
            <div className="grid relative" style={{ gridTemplateColumns: GRID_COLS }}>

              {/* Colonne des heures */}
              <div className="border-r border-gray-100 bg-gray-50/40">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="border-b border-gray-100 flex items-start justify-end pr-3 pt-1"
                  >
                    <span className="text-xs font-medium text-gray-400">{`${hour}:00`}</span>
                  </div>
                ))}
              </div>

              {/* Colonnes des jours */}
              {weekDays.map((day, dayIndex) => {
                const isDayToday = isSameDay(day, new Date())
                const isPastDay = isPast(startOfDay(day)) && !isDayToday
                const dayEvents = events.filter((event) =>
                  isSameDay(new Date(event.date), day)
                )

                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      'relative border-r border-gray-100 last:border-r-0',
                      isDayToday && 'bg-purple-50/20',
                      isPastDay && 'opacity-60'
                    )}
                  >
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        style={{ height: `${HOUR_HEIGHT}px` }}
                        className="border-b border-gray-100 hover:bg-purple-50/40 active:bg-purple-50/70 transition-colors cursor-pointer touch-manipulation"
                        onClick={() => {
                          const timeString = `${String(hour).padStart(2, '0')}:00`
                          setSelectedDate(normalizeDate(day))
                          setNewEvent({ date: normalizeDate(day), time: timeString, title: '', description: '' })
                          setIsDialogOpen(true)
                        }}
                      />
                    ))}

                    {/* Indicateur heure courante — uniquement sur la colonne aujourd'hui */}
                    {isDayToday && nowHour >= 8 && nowHour <= 20 && (
                      <div
                        className="absolute left-0 right-0 z-10 pointer-events-none"
                        style={{ top: `${nowTop}px` }}
                      >
                        <div className="relative flex items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm -ml-1.5 flex-shrink-0" />
                          <div className="flex-1 h-[2px] bg-red-500 opacity-80" />
                        </div>
                      </div>
                    )}

                    {/* Événements positionnés avec gestion du chevauchement */}
                    {layoutEvents(dayEvents, HOUR_HEIGHT).map((event, idx) => {
                      if (event.top < 0 || event.top > HOUR_HEIGHT * 13) return null
                      const colWidth = 100 / event.totalCols
                      const leftPct = event.col * colWidth
                      const GAP = 2 // px entre colonnes

                      return (
                        <motion.div
                          key={event.id || idx}
                          whileHover={{ scale: 1.02, zIndex: 20 }}
                          style={{
                            top: `${event.top}px`,
                            height: `${event.height}px`,
                            left: `calc(${leftPct}% + ${event.col > 0 ? GAP : 4}px)`,
                            right: `calc(${100 - leftPct - colWidth}% + ${event.col < event.totalCols - 1 ? GAP : 4}px)`,
                            position: 'absolute',
                          }}
                          className="bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white p-1.5 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden touch-manipulation z-10"
                          title={event.title}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEventClick(event)
                          }}
                        >
                          <div className="text-[10px] sm:text-xs font-bold truncate leading-tight">{event.title}</div>
                          <div className="text-[9px] sm:text-[10px] opacity-80 mt-0.5 leading-tight">
                            {event.time || '09:00'}
                            {event.endTime && ` – ${event.endTime}`}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )
              })}

              {/* Ligne heure courante sur toute la largeur (hors colonne heure) — visible seulement si semaine courante */}
              {isCurrentWeek && nowHour >= 8 && nowHour <= 20 && (
                <div
                  className="absolute pointer-events-none z-10"
                  style={{
                    top: `${nowTop}px`,
                    left: TIME_COL_WIDTH,
                    right: 0,
                  }}
                >
                  <div className="h-[2px] bg-red-400 opacity-40 w-full" />
                </div>
              )}
            </div>

          </div>
        </div>
      </motion.div>
    )
  }

  // Render Day View
  const renderDayView = () => {
    const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8h à 20h
    // Utiliser selectedDate si défini, sinon currentDate
    const displayDate = selectedDate || currentDate
    const dayEvents = events.filter((event) =>
      isSameDay(new Date(event.date), displayDate)
    )

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col h-full overflow-hidden"
      >
        {/* Grille des heures - SCROLLABLE - Sans en-tête */}
        <div ref={dayScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-gray-100">
          <div className="grid min-h-full" style={{ gridTemplateColumns: '65px 1fr' }}>
            {/* Colonne des heures */}
            <div className="border-r border-gray-100 bg-gray-50/50 sticky left-0 z-10">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-[72px] sm:h-20 md:h-24 border-b border-gray-100 flex items-start justify-end pr-2 sm:pr-2.5 md:pr-3 pt-2 sm:pt-2"
                >
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-600">{`${hour}:00`}</span>
                </div>
              ))}
            </div>

            {/* Colonne du jour */}
            <div className="relative bg-gradient-to-b from-white to-purple-50/10">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-[72px] sm:h-20 md:h-24 border-b border-gray-100 hover:bg-purple-50/50 active:bg-purple-50 transition-colors cursor-pointer touch-manipulation relative group"
                  onClick={() => {
                    const dateToUse = normalizeDate(displayDate)
                    setSelectedDate(dateToUse)
                    const timeString = `${hour.toString().padStart(2, '0')}:00`
                    setNewEvent({ date: dateToUse, time: timeString, title: '', description: '' })
                    setIsDialogOpen(true)
                  }}
                >
                  {/* Indicateur visuel d'ajout au hover */}
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 text-[#823F91] text-xs font-medium transition-opacity pointer-events-none select-none">
                    + ajouter
                  </span>
                </div>
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
                
                // Calcul responsive : 72px (h-18) mobile, 80px (h-20) sm, 96px (h-24) md
                const top = (eventHour - 8) * 72 + (eventMinute / 60) * 72
                const height = 65

                return (
                  <motion.div
                    key={event.id || idx}
                    whileHover={{ scale: 1.01, zIndex: 10 }}
                    style={{ top: `${top}px`, height: `${height}px` }}
                    className="absolute left-2 right-2 sm:left-2.5 sm:right-2.5 md:left-3 md:right-3 bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white p-2 sm:p-2.5 md:p-3 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                    title={event.title}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEventClick(event)
                    }}
                  >
                    <div className="text-xs sm:text-sm md:text-base font-bold truncate">{event.title}</div>
                    <div className="text-[10px] sm:text-xs opacity-90 mt-1">
                      {event.time || `${String(eventHour).padStart(2, '0')}:${String(eventMinute).padStart(2, '0')}`}
                    </div>
                    {event.description && (
                      <div className="text-[10px] sm:text-xs opacity-80 mt-1.5 line-clamp-2">
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
                    className="flex flex-col xs:flex-row items-start xs:items-start gap-2 xs:gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#823F91]/30 hover:bg-gray-50/50 active:bg-purple-50/50 cursor-pointer transition-all touch-manipulation min-h-[52px]"
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
        <div className="flex-shrink-0 flex flex-col gap-3 sm:gap-0 px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-white border-b border-gray-100">
          {/* Mobile: Navigation compacte */}
          <div className="flex items-center justify-between sm:hidden gap-1">
            {showSidebar && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
            {/* Flèches de navigation mobile */}
            <button
              onClick={previousPeriod}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#823F91] hover:bg-purple-50 rounded-lg transition-colors active:scale-95 touch-manipulation"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-sm font-semibold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent flex-1 text-center px-1 line-clamp-1">
              {getPeriodTitle()}
            </h2>
            <button
              onClick={nextPeriod}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#823F91] hover:bg-purple-50 rounded-lg transition-colors active:scale-95 touch-manipulation"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-2 py-1.5 min-h-[36px] flex items-center rounded-lg text-xs font-semibold text-[#823F91] hover:bg-purple-50 active:scale-95 transition-all touch-manipulation"
            >
              Auj.
            </button>
            <button
              onClick={() => {
                const rawDate = viewMode === 'day' ? (selectedDate || currentDate) : new Date()
                const dateToUse = normalizeDate(rawDate)
                setSelectedDate(dateToUse)
                setNewEvent({ date: dateToUse, time: '', title: '', description: '' })
                setIsDialogOpen(true)
              }}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#823F91] hover:bg-purple-50 rounded-lg transition-colors active:scale-95 touch-manipulation"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile: Sélecteur de vue */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 sm:hidden">
            {(['month', 'week', 'day', 'agenda'] as const).map((viewType) => {
              const labels = {
                month: 'Mois',
                week: 'Sem.',
                day: 'Jour',
                agenda: 'Liste',
              }

              return (
                <button
                  key={viewType}
                  onClick={() => setViewMode(viewType)}
                  className={cn(
                    'flex-1 py-2.5 rounded-md text-xs font-semibold transition-all active:scale-95 touch-manipulation min-h-[40px]',
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
                // Utiliser la date du jour affiché si on est en vue jour, sinon aujourd'hui
                const rawDate = viewMode === 'day' ? (selectedDate || currentDate) : new Date()
                const dateToUse = normalizeDate(rawDate)
                setSelectedDate(dateToUse)
                setNewEvent({ date: dateToUse, time: '', title: '', description: '' })
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
        <div
          className="flex-1 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
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
        <DialogContent size="sm" className="sm:max-w-[450px] max-w-[calc(100vw-1rem)] max-h-[85vh] sm:max-h-[75vh] p-4 sm:p-6">
          <DialogHeader className="pb-2 sm:pb-4">
            <DialogTitle className="text-base sm:text-lg">Créer un événement</DialogTitle>
          </DialogHeader>

          <motion.div
            className="space-y-3 sm:space-y-4 py-2 sm:py-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {/* 1. Date */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="date" className="text-sm">Date *</Label>
              <DatePicker
                value={newEvent.date ? normalizeDate(newEvent.date) : undefined}
                onChange={(date) => {
                  // Normaliser la date dès la sélection
                  const normalizedDate = date ? normalizeDate(date) : null
                  setNewEvent({ ...newEvent, date: normalizedDate })
                }}
                placeholder="Sélectionner une date"
                className="h-9 sm:h-10"
              />
            </div>

            {/* 2. Heure (si showTime est activé) */}
            {showTime && (
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="time" className="text-sm">Heure</Label>
                <Input
                  id="time"
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  placeholder="HH:MM"
                  className="h-9 sm:h-10"
                />
              </div>
            )}

            {/* 3. Titre */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="title" className="text-sm">Titre de l'événement *</Label>
              <Input
                id="title"
                placeholder="Ex: Essayage robe, Dégustation menu..."
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                autoFocus
                className="h-9 sm:h-10"
              />
            </div>

            {/* 4. Description */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="description" className="text-sm">Description (optionnel)</Label>
              <Textarea
                id="description"
                placeholder="Ajoutez des détails sur cet événement..."
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="min-h-[60px] sm:min-h-[80px] resize-none text-sm"
                rows={2}
              />
            </div>
          </motion.div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2 sm:pt-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                setNewEvent({ date: null, time: '', title: '', description: '' })
                setSelectedDate(null)
              }}
              className="w-full sm:w-auto h-9 sm:h-10 text-sm"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddEvent}
              className="bg-[#823F91] hover:bg-[#6D3478] text-white w-full sm:w-auto h-9 sm:h-10 text-sm"
              disabled={!newEvent.title || !newEvent.date}
            >
              Créer l'événement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event edit/delete dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent size="sm" className="sm:max-w-[450px] max-w-[calc(100vw-1rem)] max-h-[85vh] sm:max-h-[75vh] p-4 sm:p-6">
          <DialogHeader className="pb-2 sm:pb-4">
            <DialogTitle className="text-base sm:text-lg">Modifier l'événement</DialogTitle>
          </DialogHeader>

          <motion.div
            className="space-y-3 sm:space-y-4 py-2 sm:py-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {/* 1. Date */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="edit-date" className="text-sm">Date *</Label>
              <DatePicker
                value={editEvent.date ? normalizeDate(editEvent.date) : undefined}
                onChange={(date) => {
                  // Normaliser la date dès la sélection
                  const normalizedDate = date ? normalizeDate(date) : null
                  setEditEvent({ ...editEvent, date: normalizedDate })
                }}
                placeholder="Sélectionner une date"
                className="h-9 sm:h-10"
              />
            </div>

            {/* 2. Heure (si showTime est activé) */}
            {showTime && (
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="edit-time" className="text-sm">Heure</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editEvent.time}
                  onChange={(e) => setEditEvent({ ...editEvent, time: e.target.value })}
                  placeholder="HH:MM"
                  className="h-9 sm:h-10"
                />
              </div>
            )}

            {/* 3. Titre */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="edit-title" className="text-sm">Titre de l'événement *</Label>
              <Input
                id="edit-title"
                placeholder="Ex: Essayage robe, Dégustation menu..."
                value={editEvent.title}
                onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                autoFocus
                className="h-9 sm:h-10"
              />
            </div>

            {/* 4. Description */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="edit-description" className="text-sm">Description (optionnel)</Label>
              <Textarea
                id="edit-description"
                placeholder="Ajoutez des détails sur cet événement..."
                value={editEvent.description}
                onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
                className="min-h-[60px] sm:min-h-[80px] resize-none text-sm"
                rows={2}
              />
            </div>
          </motion.div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2 sm:pt-0">
            <Button
              variant="destructive"
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={isDeleting || !onEventDelete}
              className="w-full sm:w-auto h-9 sm:h-10 text-sm order-2 sm:order-1"
            >
              Supprimer
            </Button>
            <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setSelectedEvent(null)
                  setEditEvent({ date: null, time: '', title: '', description: '' })
                }}
                className="flex-1 sm:flex-none h-9 sm:h-10 text-sm"
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpdateEvent}
                disabled={!editEvent.title || !editEvent.date}
                className="bg-[#823F91] hover:bg-[#6D3478] text-white flex-1 sm:flex-none h-9 sm:h-10 text-sm"
              >
                Enregistrer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent size="sm" className="sm:max-w-[380px] max-w-[calc(100vw-1rem)] p-4 sm:p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base sm:text-lg">Supprimer l'événement ?</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              "{selectedEvent?.title}" sera définitivement supprimé. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2 pt-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="w-full sm:w-auto h-10 text-sm"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEvent}
              disabled={isDeleting}
              className="w-full sm:w-auto h-10 text-sm"
            >
              {isDeleting ? 'Suppression...' : 'Oui, supprimer'}
            </Button>
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
