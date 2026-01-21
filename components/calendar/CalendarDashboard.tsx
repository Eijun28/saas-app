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
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import { fr } from 'date-fns/locale'
import { isSameDay, isToday, format } from 'date-fns'
import { cn } from '@/lib/utils'

// Formatter pour capitaliser le mois
const formatMonth = (date: Date) => {
  const monthName = format(date, 'MMMM', { locale: fr })
  return monthName.charAt(0).toUpperCase() + monthName.slice(1)
}

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
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

  const formatDateKey = (date: Date) => {
    return format(date, 'yyyy-MM-dd')
  }

  const getEventsForDate = (date: Date) => {
    const dateKey = formatDateKey(date)
    return events.filter(event => event.date === dateKey)
  }

  const getEventColorHex = (event: CalendarEvent): string => {
    if (eventColor) {
      const colorClass = eventColor(event)
      // Si c'est déjà une couleur hex, la retourner
      if (colorClass.startsWith('#')) return colorClass
      // Sinon convertir les classes Tailwind en hex
      const colorMap: Record<string, string> = {
        'bg-blue-500': '#3b82f6',
        'bg-green-500': '#22c55e',
        'bg-purple-500': '#a855f7',
        'bg-pink-500': '#ec4899',
        'bg-orange-500': '#f97316',
      }
      return colorMap[colorClass] || '#3b82f6'
    }
    // Couleurs par défaut (retourner directement la couleur hex)
    const colors = ['#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#f97316'] // blue, green, purple, pink, orange
    const hash = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const getEventColorClass = (event: CalendarEvent): string => {
    if (eventColor) {
      return eventColor(event)
    }
    // Couleurs par défaut (classes Tailwind)
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500']
    const hash = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    
    setSelectedDate(date)
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

  return (
    <div className="w-full">
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4 sm:p-6 md:p-8">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Chargement...
            </div>
          ) : (
            <div className="flex justify-center items-center w-full">
              <div className="w-full flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={handleDateSelect}
                  month={currentDate}
                  onMonthChange={setCurrentDate}
                  locale={fr}
                  className="rounded-lg border-0 [--cell-size:2.5rem] sm:[--cell-size:3rem] md:[--cell-size:4rem] lg:[--cell-size:5rem]"
                  formatters={{
                    formatCaption: (date) => {
                      const monthName = formatMonth(date)
                      const year = format(date, 'yyyy')
                      return `${monthName} ${year}`
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
                    const hasEvents = dayEvents.length > 0
                    
                    return (
                      <div className="relative w-full h-full">
                        <CalendarDayButton 
                          {...props}
                          className={cn(
                            props.className,
                            "!text-gray-900 hover:!text-gray-900 focus:!text-gray-900",
                            "data-[selected=true]:!text-white data-[selected=true]:!bg-[#823F91]",
                            "shadow-sm hover:shadow-md transition-shadow",
                            "!border-0 !border-none",
                            "[&>span]:!text-gray-900 [&>span]:!opacity-100",
                            "data-[selected=true]:[&>span]:!text-white",
                            "hover:[&>span]:!text-gray-900",
                            "focus:!ring-0 focus-visible:!ring-0",
                            "group-data-[focused=true]/day:!border-0 group-data-[focused=true]/day:!ring-0",
                            // Griser les jours hors du mois (utiliser le modifier outside)
                            props.modifiers.outside && "!text-gray-400 !opacity-50 [&>span]:!text-gray-400 [&>span]:!opacity-50 hover:!text-gray-400"
                          )}
                        />
                        {/* Indicateur subtil pour les événements */}
                        {hasEvents && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 justify-center items-center pointer-events-none">
                            {dayEvents.slice(0, 3).map((event) => {
                              const colorHex = getEventColorHex(event)
                              return (
                                <div
                                  key={event.id}
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: colorHex }}
                                  title={`${event.time ? `${event.time} - ` : ''}${event.title}`}
                                />
                              )
                            })}
                            {dayEvents.length > 3 && (
                              <span className="text-[8px] text-gray-600 ml-0.5 font-medium">
                                +{dayEvents.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  },
                  CaptionLabel: () => {
                    const monthName = formatMonth(currentDate)
                    const year = format(currentDate, 'yyyy')
                    
                    const handlePreviousMonth = () => {
                      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
                    }
                    
                    const handleNextMonth = () => {
                      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
                    }
                    
                    return (
                      <div className="flex items-center gap-2 relative z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handlePreviousMonth()
                          }}
                          className="h-6 w-6 flex items-center justify-center text-gray-900 hover:text-gray-700 transition-colors cursor-pointer z-20 relative"
                          aria-label="Mois précédent"
                        >
                          <ChevronLeft className="h-4 w-4 pointer-events-none" />
                        </button>
                        <span className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                          {monthName} {year}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleNextMonth()
                          }}
                          className="h-6 w-6 flex items-center justify-center text-gray-900 hover:text-gray-700 transition-colors cursor-pointer z-20 relative"
                          aria-label="Mois suivant"
                        >
                          <ChevronRight className="h-4 w-4 pointer-events-none" />
                        </button>
                      </div>
                    )
                  },
                }}
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 justify-center",
                  month: "space-y-4 w-full",
                  caption: "flex justify-center items-center pt-1 mb-4 w-full relative",
                  caption_label: "text-base sm:text-lg md:text-xl font-semibold text-gray-900 text-center",
                  nav: "space-x-1 flex items-center justify-between w-full absolute inset-x-0 pointer-events-none",
                  nav_button: cn(
                    "h-8 w-8 md:h-9 md:w-9 bg-transparent p-0 opacity-0 pointer-events-none"
                  ),
                  nav_button_previous: "pointer-events-none",
                  nav_button_next: "pointer-events-none",
                  table: "w-full border-collapse border-0",
                  head_row: "flex",
                  head_cell: "text-gray-900 font-semibold rounded-md w-full font-normal text-xs sm:text-sm md:text-base border-0",
                  row: "flex w-full mt-1 sm:mt-2",
                  cell: "h-auto w-full text-center text-sm p-0 relative focus-within:relative focus-within:z-20 border-0",
                  day: cn(
                    "h-auto w-full p-0 font-normal text-gray-900 border-0",
                    "hover:text-gray-900 focus:text-gray-900",
                    "aria-selected:opacity-100"
                  ),
                  day_range_end: "day-range-end",
                  day_selected: "bg-[#823F91] text-white hover:bg-[#6D3478] hover:text-white focus:bg-[#823F91] focus:text-white shadow-md border-0",
                  day_today: "bg-gray-100 text-gray-900 font-semibold border-0",
                  day_outside: "text-gray-400 opacity-50 border-0 [&>button]:!text-gray-400 [&>button]:!opacity-50 [&>button>span]:!text-gray-400 [&>button>span]:!opacity-50",
                  day_disabled: "text-gray-300 opacity-40 border-0",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground border-0",
                  day_hidden: "invisible",
                }}
              />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'ajout d'événement */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px] max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Créer un événement</DialogTitle>
            <DialogDescription>
              {selectedDate && (
                <span className="font-medium text-[#823F91]">
                  {selectedDate.toLocaleDateString('fr-FR', {
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
                      className={cn(getEventColorClass(event), "text-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm")}
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
