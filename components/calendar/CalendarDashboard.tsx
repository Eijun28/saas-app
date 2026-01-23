'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, ChevronRight, Plus, Clock, Menu, X, Filter } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarDashboardProps, CalendarEvent, ViewMode } from './types'
import { MonthView } from './views/MonthView'
import { WeekView } from './views/WeekView'
import { DayView } from './views/DayView'
import { AgendaView } from './views/AgendaView'
import { MiniCalendar } from './MiniCalendar'

// Formatter pour capitaliser le mois
const formatMonth = (date: Date) => {
  const monthName = format(date, 'MMMM', { locale: fr })
  return monthName.charAt(0).toUpperCase() + monthName.slice(1)
}

export function CalendarDashboard({
  events,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onEventClick,
  viewMode: initialViewMode = 'month',
  onViewModeChange,
  enableDragDrop = false,
  enableMinimap = true,
  showSidebar = true,
  showTime = false,
  eventColor,
  loading = false,
  highlightDates = [],
  className,
}: CalendarDashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile && showSidebar)
  const [newEvent, setNewEvent] = useState({
    title: '',
    time: '',
    description: '',
    date: null as Date | null,
  })

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(showSidebar)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [showSidebar])

  // Synchroniser viewMode externe
  useEffect(() => {
    if (initialViewMode !== viewMode) {
      setViewMode(initialViewMode)
    }
  }, [initialViewMode])

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    onViewModeChange?.(mode)
  }

  const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd')

  const getEventsForDate = (date: Date) => {
    const dateKey = formatDateKey(date)
    return events.filter(event => event.date === dateKey)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setNewEvent({
      title: '',
      time: '',
      description: '',
      date: date,
    })
    setIsDialogOpen(true)
  }

  const handleCellClick = (date: Date, hour: number) => {
    const newDate = new Date(date)
    newDate.setHours(hour, 0, 0, 0)
    handleDateSelect(newDate)
  }

  const handleAddEvent = async () => {
    if (!selectedDate || !newEvent.title || !newEvent.date) return

    const dateKey = formatDateKey(selectedDate)
    
    try {
      await onEventCreate?.({
        title: newEvent.title,
        date: dateKey,
        time: showTime ? newEvent.time : undefined,
        description: newEvent.description || undefined,
      })
      
      setNewEvent({ title: '', time: '', description: '', date: null })
      setIsDialogOpen(false)
      setSelectedDate(null)
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error)
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    switch (viewMode) {
      case 'month':
        setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
        break
      case 'week':
        setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1))
        break
      case 'day':
        setCurrentDate(direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1))
        break
      default:
        break
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  // Événements du jour sélectionné pour la sidebar
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []
  const todayEvents = getEventsForDate(new Date())
  
  // Stats mensuelles
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const monthEvents = events.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate >= monthStart && eventDate <= monthEnd
  })
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate >= new Date()
  })

  // Variantes d'animation pour les transitions de vues
  const viewVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1] as const
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  }

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      {/* Header moderne */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b sticky top-0 z-30">
        {/* Gauche : Navigation mois */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1">
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent">
            {viewMode === 'month' && `${formatMonth(currentDate)} ${currentDate.getFullYear()}`}
            {viewMode === 'week' && `Semaine du ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMMM', { locale: fr })}`}
            {viewMode === 'day' && format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
            {viewMode === 'agenda' && 'Agenda'}
          </h2>
          <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday} className="hidden sm:inline-flex">
            Aujourd'hui
          </Button>
        </div>

        {/* Centre : Switcher de vues */}
        <div className="hidden md:flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          {(['Mois', 'Semaine', 'Jour', 'Agenda'] as const).map((label, index) => {
            const mode: ViewMode = ['month', 'week', 'day', 'agenda'][index] as ViewMode
            return (
              <Button
                key={label}
                variant={viewMode === mode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange(mode)}
                className={cn(
                  "transition-all text-xs sm:text-sm",
                  viewMode === mode && "bg-[#823F91] text-white shadow-lg"
                )}
              >
                {label}
              </Button>
            )
          })}
        </div>

        {/* Droite : Actions */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => handleDateSelect(new Date())}
            className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white shadow-lg hidden sm:inline-flex"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvel événement
          </Button>
          <Button 
            onClick={() => handleDateSelect(new Date())}
            size="icon"
            className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white shadow-lg sm:hidden"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenu principal avec sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: isMobile ? '100%' : 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "border-r bg-gray-50/50 overflow-hidden flex flex-col",
                  isMobile && "fixed inset-0 z-40 bg-white"
                )}
              >
                <div className="p-4 space-y-6 overflow-y-auto flex-1">
                  {/* Mini calendrier */}
                  {enableMinimap && (
                    <MiniCalendar
                      currentDate={currentDate}
                      onDateSelect={(date) => {
                        setCurrentDate(date)
                        setSelectedDate(date)
                      }}
                      highlightDates={highlightDates}
                      events={events}
                    />
                  )}

                  {/* Événements du jour sélectionné */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">
                        {selectedDate
                          ? `Événements du ${format(selectedDate, 'd MMMM', { locale: fr })}`
                          : 'Événements aujourd\'hui'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                      {(selectedDate ? selectedDateEvents : todayEvents).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Aucun événement
                        </p>
                      ) : (
                        (selectedDate ? selectedDateEvents : todayEvents).map((event) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-2 rounded-lg border bg-white hover:shadow-sm transition-shadow cursor-pointer"
                            onClick={() => onEventClick?.(event)}
                          >
                            {showTime && event.time && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                <Clock className="w-3 h-3" />
                                {event.time}
                              </div>
                            )}
                            <div className="font-medium text-sm">{event.title}</div>
                          </motion.div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Stats rapides */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Ce mois</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Événements</span>
                        <span className="font-semibold">{monthEvents.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">À venir</span>
                        <span className="font-semibold text-[#823F91]">{upcomingEvents.length}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Zone principale du calendrier */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Chargement...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                variants={viewVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-full"
              >
                {viewMode === 'month' && (
                  <MonthView
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    events={events}
                    onDateSelect={handleDateSelect}
                    onEventClick={onEventClick}
                    eventColor={eventColor}
                    showTime={showTime}
                  />
                )}
                {viewMode === 'week' && (
                  <WeekView
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    events={events}
                    onDateSelect={setSelectedDate}
                    onCellClick={handleCellClick}
                    onEventClick={onEventClick}
                    eventColor={eventColor}
                  />
                )}
                {viewMode === 'day' && (
                  <DayView
                    currentDate={currentDate}
                    events={events}
                    onCellClick={handleCellClick}
                    onEventClick={onEventClick}
                    eventColor={eventColor}
                  />
                )}
                {viewMode === 'agenda' && (
                  <AgendaView
                    events={events}
                    onEventClick={onEventClick}
                    eventColor={eventColor}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Dialog d'ajout d'événement */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px] max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Créer un événement</DialogTitle>
            <DialogDescription>
              {selectedDate && (
                <span className="font-medium text-[#823F91]">
                  {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <motion.div
            className="space-y-4 py-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {/* Événements existants */}
            {selectedDate && getEventsForDate(selectedDate).length > 0 && (
              <motion.div
                className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
              >
                <h4 className="font-semibold mb-2 text-sm text-gray-600">
                  Événements ce jour :
                </h4>
                <div className="space-y-2">
                  {getEventsForDate(selectedDate).map((event) => (
                    <motion.div
                      key={event.id}
                      className="px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm bg-[#823F91] text-white"
                      whileHover={{ scale: 1.02 }}
                    >
                      {showTime && event.time && (
                        <>
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{event.time}</span>
                          <span className="text-white/70">-</span>
                        </>
                      )}
                      <span className="flex-1">{event.title}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

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

            {showTime && (
              <div className="space-y-2">
                <Label htmlFor="time">Heure</Label>
                <Input
                  id="time"
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                />
              </div>
            )}

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
                setNewEvent({ title: '', time: '', description: '', date: null })
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
    </div>
  )
}

// Export du type pour compatibilité - réexport depuis types.ts
export type { CalendarEvent, ViewMode } from './types'
