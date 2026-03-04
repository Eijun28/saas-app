'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Calendar as CalendarIcon, Plus, X, Edit2, Trash2, CalendarCheck, CalendarDays, Heart } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'
import { CalendarDashboard, type CalendarEvent } from '@/components/calendar/CalendarDashboard'
import { CountdownTimer } from '@/components/calendar/CountdownTimer'

interface Event {
  id: string
  title: string
  description: string | null
  event_date: string
  created_at: string
}

export default function TimelinePage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [dateMarriage, setDateMarriage] = useState<string | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_date: null as Date | null,
  })

  useEffect(() => {
    if (user) {
      loadTimeline()
    }
  }, [user])

  // Load events once we have the coupleId
  useEffect(() => {
    if (coupleId) {
      loadEvents()
    }
  }, [coupleId])

  // Recharger les événements quand la page devient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && coupleId) {
        loadEvents()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, coupleId])

  const loadTimeline = async () => {
    if (!user) return

    setLoading(true)
    const supabase = createClient()

    try {
      // Charger depuis la table couples (nouvelle structure)
      const { data, error } = await supabase
        .from('couples')
        .select('id, wedding_date')
        .eq('user_id', user.id)
        .single()

      if (!error && data) {
        setCoupleId(data.id)
        if (data.wedding_date) {
          setDateMarriage(data.wedding_date)
        }
      }
    } catch (err) {
      console.error('Erreur chargement date mariage:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    if (!user || !coupleId) return

    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('couple_id', coupleId)
        .order('event_date', { ascending: true })

      if (error) {
        // Si la table n'existe pas ou erreur RLS, on initialise avec un tableau vide
        if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
          console.warn('La table timeline_events n\'existe pas encore. Les événements seront disponibles une fois la table créée.')
          setEvents([])
          return
        }
        // Autres erreurs (RLS, permissions, etc.)
        console.error('Erreur chargement événements:', error.code, error.message)
        setEvents([])
        return
      }
      
      // Succès : initialiser avec les données ou un tableau vide
      setEvents(data || [])
    } catch (err) {
      // Erreur inattendue
      console.error('Erreur inattendue lors du chargement des événements:', err)
      setEvents([])
    }
  }

  const handleCreateOrUpdateEvent = async () => {
    if (!user || !eventForm.title || !eventForm.event_date) return

    const supabase = createClient()
    
    if (editingEvent) {
      // Mettre à jour l'événement
      const { error } = await supabase
        .from('timeline_events')
        .update({
          title: eventForm.title,
          description: eventForm.description || null,
          event_date: eventForm.event_date.toISOString().split('T')[0],
        })
        .eq('id', editingEvent.id)

      if (error) {
        console.error('Erreur mise à jour événement:', error)
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          toast.error('La table timeline_events n\'existe pas. Veuillez exécuter le script SQL migrations/create_timeline_events.sql dans Supabase.')
        } else {
          toast.error(`Erreur lors de la mise à jour: ${error.message}`)
        }
        return
      }
    } else {
      // Créer un nouvel événement
      const { data, error } = await supabase
        .from('timeline_events')
        .insert({
          couple_id: coupleId!,
          title: eventForm.title,
          description: eventForm.description || null,
          event_date: eventForm.event_date.toISOString().split('T')[0],
        })
        .select()
        .single()

      if (error) {
        console.error('Erreur création événement:', error)
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          toast.error('La table timeline_events n\'existe pas. Veuillez exécuter le script SQL migrations/create_timeline_events.sql dans Supabase.')
        } else {
          toast.error(`Erreur lors de la création: ${error.message}`)
        }
        return
      }
    }

    // Recharger les événements depuis Supabase
    await loadEvents()
    setIsDialogOpen(false)
    setEventForm({ title: '', description: '', event_date: null })
    setEditingEvent(null)
  }

  const handleCalendarEventCreate = async (eventData: Omit<CalendarEvent, 'id'>) => {
    if (!user || !coupleId) return

    const supabase = createClient()
    const { error } = await supabase
      .from('timeline_events')
      .insert({
        couple_id: coupleId,
        title: eventData.title,
        description: eventData.description || null,
        event_date: eventData.date,
      })

    if (error) {
      console.error('Erreur création événement:', error)
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        toast.error('La table timeline_events n\'existe pas. Veuillez exécuter le script SQL migrations/create_timeline_events.sql dans Supabase.')
      } else {
        toast.error(`Erreur lors de la création: ${error.message}`)
      }
      throw error
    }

    await loadEvents()
    toast.success('Événement créé avec succès')
  }

  // Convertir les événements au format attendu par le calendrier
  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    date: event.event_date,
    description: event.description || undefined,
  }))

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return

    const supabase = createClient()
    const { error } = await supabase.from('timeline_events').delete().eq('id', id)

    if (error) {
      console.error('Erreur suppression:', error)
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        toast.error('La table timeline_events n\'existe pas. Veuillez exécuter le script SQL migrations/create_timeline_events.sql dans Supabase.')
      } else {
        toast.error(`Erreur lors de la suppression: ${error.message}`)
      }
      return
    }

    await loadEvents()
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setEventForm({
      title: event.title,
      description: event.description || '',
      event_date: new Date(event.event_date),
    })
    setIsDialogOpen(true)
  }


  const resetForm = () => {
    setEventForm({ title: '', description: '', event_date: null })
    setEditingEvent(null)
  }

  if (loading) {
    return (
      <div className="w-full space-y-5">
        <div className="h-8 w-56 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-4 w-80 bg-gray-100 rounded-lg animate-pulse" />
        <div className="flex-1 h-[480px] sm:h-[560px] bg-white rounded-2xl border border-gray-100 animate-pulse" />
      </div>
    )
  }

  // Stats
  const now = new Date()
  const todayKey = now.toISOString().split('T')[0]
  const todayCalEvents = calendarEvents.filter(e => e.date === todayKey)
  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() + 7)
  const weekEndKey = weekEnd.toISOString().split('T')[0]
  const weekCalEvents = calendarEvents.filter(e => e.date >= todayKey && e.date <= weekEndKey)

  // Days until wedding
  const daysUntilWedding = dateMarriage ? (() => {
    const date = new Date(dateMarriage)
    const today = new Date()
    const diff = date.getTime() - today.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  })() : null

  return (
    <div className="h-[calc(100dvh-80px)] sm:h-[calc(100dvh-140px)] min-h-[400px] flex flex-col gap-3 sm:gap-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex-shrink-0 space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#823F91] tracking-tight mb-0.5 sm:mb-1">
              Calendrier de mariage
            </h1>
            {dateMarriage ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-500">
                <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#823F91] flex-shrink-0" />
                <span className="hidden sm:inline">
                  {(() => {
                    const dateStr = new Date(dateMarriage).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
                  })()}
                </span>
                <span className="sm:hidden">
                  {new Date(dateMarriage).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className="text-gray-300">•</span>
                <span className="font-semibold text-[#823F91]">
                  {daysUntilWedding !== null && (
                    daysUntilWedding > 0 ? `J-${daysUntilWedding}` :
                    daysUntilWedding === 0 ? "Aujourd'hui !" :
                    `Il y a ${Math.abs(daysUntilWedding)} j`
                  )}
                </span>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-400">
                <a href="/couple/profil" className="text-[#823F91] hover:text-[#6D3478] underline">
                  Définir la date de mariage
                </a>{' '}
                pour voir le compte à rebours
              </p>
            )}
          </div>
        </div>

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-3 gap-2 sm:gap-3"
        >
          {daysUntilWedding !== null && daysUntilWedding > 0 ? (
            <div className="flex items-center gap-2 sm:gap-3 rounded-xl border border-gray-100 bg-white p-2.5 sm:p-3 shadow-sm">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-pink-50 flex-shrink-0">
                <Heart className="h-4 w-4 text-pink-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-bold text-gray-900">J-{daysUntilWedding}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 truncate">Mariage</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3 rounded-xl border border-gray-100 bg-white p-2.5 sm:p-3 shadow-sm">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#823F91]/10 flex-shrink-0">
                <CalendarCheck className="h-4 w-4 text-[#823F91]" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-bold text-gray-900">{todayCalEvents.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 truncate">Aujourd'hui</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 sm:gap-3 rounded-xl border border-gray-100 bg-white p-2.5 sm:p-3 shadow-sm">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#9D5FA8]/10 flex-shrink-0">
              <CalendarDays className="h-4 w-4 text-[#9D5FA8]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold text-gray-900">{weekCalEvents.length}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">Cette semaine</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 rounded-xl border border-gray-100 bg-white p-2.5 sm:p-3 shadow-sm">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#B87FC0]/10 flex-shrink-0">
              <CalendarIcon className="h-4 w-4 text-[#B87FC0]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold text-gray-900">{calendarEvents.length}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">Total</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Calendrier plein écran */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="flex-1 min-h-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <CalendarDashboard
          events={calendarEvents}
          onEventCreate={handleCalendarEventCreate}
          onEventUpdate={async (event) => {
            if (!coupleId) return
            const supabase = createClient()
            await supabase
              .from('timeline_events')
              .update({ title: event.title, event_date: event.date, description: event.description ?? null })
              .eq('id', event.id)
              .eq('couple_id', coupleId)
            loadEvents()
          }}
          onEventDelete={async (eventId) => {
            if (!coupleId) return
            const supabase = createClient()
            await supabase.from('timeline_events').delete().eq('id', eventId).eq('couple_id', coupleId)
            loadEvents()
          }}
          showTime={true}
          loading={loading}
          defaultView="week"
        />
      </motion.div>

      {/* Dialog de création/modification d'événement */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent size="sm" className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Modifier l\'événement' : 'Créer un événement'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Modifiez les détails de votre événement' : 'Ajoutez un événement à votre timeline de mariage'}
            </DialogDescription>
          </DialogHeader>

          <motion.div
            className="space-y-4 py-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="space-y-2">
              <Label htmlFor="event-title">Titre de l'événement *</Label>
              <Input
                id="event-title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Ex: Essayage robe, Dégustation menu..."
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-date">Date *</Label>
              <DatePicker
                value={eventForm.event_date || undefined}
                onChange={(date) => setEventForm({ ...eventForm, event_date: date || null })}
                placeholder="Sélectionner une date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Description (optionnel)</Label>
              <Textarea
                id="event-description"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Ajoutez des détails sur cet événement..."
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
                resetForm()
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateOrUpdateEvent}
              className="bg-[#823F91] hover:bg-[#6D3478] text-white"
              disabled={!eventForm.title || !eventForm.event_date}
            >
              {editingEvent ? 'Modifier' : 'Créer l\'événement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
