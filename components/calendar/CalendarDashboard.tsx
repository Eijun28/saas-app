'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'

export interface CalendarEvent {
  id: string
  title: string
  date: string // Format YYYY-MM-DD
  time?: string // Format HH:MM (optionnel)
  description?: string
  [key: string]: any // Pour permettre d'autres propriétés spécifiques
}

interface CalendarDashboardProps {
  events: CalendarEvent[]
  onEventCreate: (event: Omit<CalendarEvent, 'id'>) => Promise<void>
  onEventUpdate?: (event: CalendarEvent) => Promise<void>
  onEventDelete?: (eventId: string) => Promise<void>
  showTime?: boolean // Si true, affiche et permet de saisir l'heure
  eventColor?: (event: CalendarEvent) => string // Fonction pour déterminer la couleur
  loading?: boolean
}

export function CalendarDashboard({
  events,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  showTime = false,
  eventColor,
  loading = false,
}: CalendarDashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    time: '',
    description: '',
    date: null as Date | null,
  })

  // Détection mobile avec breakpoints plus précis
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // Tailwind 'sm' breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const firstDayOfMonth = (date: Date) => {
    // getDay() retourne 0 pour dimanche, 1 pour lundi, etc.
    // On convertit pour que lundi = 0, dimanche = 6
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    return (day + 6) % 7 // Convertit dimanche (0) en 6, lundi (1) en 0, etc.
  }

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const formatDateKey = (day: number) => {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    return `${year}-${month}-${dayStr}`
  }

  const getEventsForDate = (dateKey: string) => {
    return events.filter(event => event.date === dateKey)
  }

  const getEventColor = (event: CalendarEvent) => {
    if (eventColor) {
      return eventColor(event)
    }
    // Couleurs par défaut
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500']
    const hash = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const handleDateClick = (day: number) => {
    setSelectedDate(day)
    const dateKey = formatDateKey(day)
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setNewEvent({
      title: '',
      time: '',
      description: '',
      date: date,
    })
    setIsDialogOpen(true)
  }

  const handleAddEvent = async () => {
    if (!selectedDate || !newEvent.title || !newEvent.date) return

    const dateKey = formatDateKey(selectedDate)
    
    try {
      await onEventCreate({
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

  const renderCalendarDays = () => {
    const days: React.ReactNode[] = []
    const totalDays = daysInMonth(currentDate)
    const firstDay = firstDayOfMonth(currentDate)
    const today = new Date()
    const isCurrentMonth = 
      today.getMonth() === currentDate.getMonth() && 
      today.getFullYear() === currentDate.getFullYear()

    // Cellules vides pour les jours avant le début du mois
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-1 sm:p-1.5 md:p-2 min-h-[100px] sm:min-h-[112px] md:min-h-[128px]"></div>)
    }

    // Jours réels
    for (let day = 1; day <= totalDays; day++) {
      const dateKey = formatDateKey(day)
      const dayEvents = getEventsForDate(dateKey)
      const isToday = isCurrentMonth && day === today.getDate()

      days.push(
        <div
          key={day}
          className={`p-1 sm:p-1.5 md:p-2 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden min-h-[100px] sm:min-h-[112px] md:min-h-[128px] flex flex-col ${
            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
          }`}
          onClick={() => handleDateClick(day)}
        >
          <div className={`text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1 flex-shrink-0 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="flex-1 overflow-hidden flex flex-col gap-0.5 sm:gap-1 min-h-0">
            {dayEvents.slice(0, isMobile ? 2 : 3).map((event) => (
              <div
                key={event.id}
                className={`${getEventColor(event)} text-white text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 rounded truncate leading-tight flex-shrink-0 min-h-[18px] sm:min-h-[20px] flex items-center`}
                title={`${event.time ? `${event.time} - ` : ''}${event.title}`}
              >
                {showTime && event.time && !isMobile && (
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                )}
                <span className="truncate">{showTime && event.time && isMobile ? `${event.time} ` : ''}{event.title}</span>
              </div>
            ))}
            {dayEvents.length > (isMobile ? 2 : 3) && (
              <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 px-1 sm:px-1.5 flex-shrink-0">
                +{dayEvents.length - (isMobile ? 2 : 3)} autres
              </div>
            )}
          </div>
        </div>
      )
    }

    return days
  }

  return (
    <div className="w-full">
      <Card className="shadow-none border-0">
        <CardHeader className="border-b bg-white pb-2 sm:pb-4 px-2 sm:px-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="outline" size="sm" onClick={previousMonth} className="h-8 w-8 sm:h-9 sm:w-9">
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <span className="text-sm sm:text-base md:text-lg font-semibold min-w-[140px] sm:min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <Button variant="outline" size="sm" onClick={nextMonth} className="h-8 w-8 sm:h-9 sm:w-9">
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 md:p-6">
          {/* En-tête des jours */}
          <div className="grid grid-cols-7 gap-0 mb-1 sm:mb-2">
            {dayNames.map((day) => (
              <div key={day} className="p-1 sm:p-1.5 md:p-2 text-center font-semibold text-gray-600 text-[10px] sm:text-xs md:text-sm">
                {/* Mobile: première lettre seulement */}
                <span className="sm:hidden">{day[0]}</span>
                <span className="hidden sm:inline">{day}</span>
              </div>
            ))}
          </div>
          
          {/* Grille du calendrier */}
          <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
            {loading ? (
              <div className="col-span-7 p-8 text-center text-gray-500">
                Chargement...
              </div>
            ) : (
              renderCalendarDays()
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog d'ajout d'événement */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent size="sm" className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Créer un événement</DialogTitle>
            <DialogDescription>
              {selectedDate && (
                <span className="font-medium text-[#823F91]">
                  {new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
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
            {/* Événements existants - Seulement si > 0 */}
            {selectedDate && getEventsForDate(formatDateKey(selectedDate)).length > 0 && (
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
                  {getEventsForDate(formatDateKey(selectedDate)).map((event) => (
                    <motion.div
                      key={event.id}
                      className={`${getEventColor(event)} text-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm`}
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
