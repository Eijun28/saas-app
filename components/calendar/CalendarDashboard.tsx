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
      days.push(<div key={`empty-${i}`} className="p-0.5 sm:p-1 aspect-square min-h-[60px] sm:min-h-[70px] md:min-h-[80px]"></div>)
    }

    // Jours réels
    for (let day = 1; day <= totalDays; day++) {
      const dateKey = formatDateKey(day)
      const dayEvents = getEventsForDate(dateKey)
      const isToday = isCurrentMonth && day === today.getDate()

      days.push(
        <div
          key={day}
          className={`p-0.5 sm:p-1 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden aspect-square min-h-[60px] sm:min-h-[70px] md:min-h-[80px] flex flex-col ${
            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
          }`}
          onClick={() => handleDateClick(day)}
        >
          <div className={`text-[10px] sm:text-xs md:text-sm font-semibold mb-0.5 flex-shrink-0 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="flex-1 overflow-hidden flex flex-col gap-0.5 min-h-0">
            {dayEvents.slice(0, isMobile ? 1 : 2).map((event) => (
              <div
                key={event.id}
                className={`${getEventColor(event)} text-white text-[8px] sm:text-[9px] md:text-[10px] px-0.5 sm:px-1 py-0.5 rounded truncate leading-tight flex-shrink-0 min-h-[14px] sm:min-h-[16px] flex items-center`}
                title={`${event.time ? `${event.time} - ` : ''}${event.title}`}
              >
                {showTime && event.time && !isMobile && (
                  <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5 flex-shrink-0" />
                )}
                <span className="truncate">{showTime && event.time && isMobile ? `${event.time} ` : ''}{event.title}</span>
              </div>
            ))}
            {dayEvents.length > (isMobile ? 1 : 2) && (
              <div className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-500 px-0.5 sm:px-1 flex-shrink-0">
                +{dayEvents.length - (isMobile ? 1 : 2)}
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
        <CardHeader className="border-b bg-[rgba(252,249,253,1)] pb-2 sm:pb-3 px-3 sm:px-4 md:px-6" style={{ borderBottomColor: 'rgba(255, 252, 250, 1)', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(252, 249, 253, 1)' }}>
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={previousMonth} 
                className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 border-0 shadow-sm hover:shadow-md transition-all bg-white hover:bg-gray-50 p-0"
              >
                <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
              </Button>
              <span className="text-xs sm:text-sm md:text-base font-semibold min-w-[120px] sm:min-w-[160px] md:min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={nextMonth} 
                className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 border-0 shadow-sm hover:shadow-md transition-all bg-white hover:bg-gray-50 p-0"
              >
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 md:p-4">
          {/* En-tête des jours */}
          <div className="grid grid-cols-7 gap-0 mb-1">
            {dayNames.map((day) => (
              <div key={day} className="p-1 sm:p-1.5 text-center font-semibold text-gray-600 text-[10px] sm:text-xs">
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
