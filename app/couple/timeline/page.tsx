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
import { Calendar as CalendarIcon, Plus, X, Edit2, Trash2 } from 'lucide-react'
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
      loadEvents()
    }
  }, [user])

  // Recharger les événements quand la page devient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        loadEvents()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  const loadTimeline = async () => {
    if (!user) return
    
    setLoading(true)
    const supabase = createClient()
    
    try {
      // Charger depuis la table couples (nouvelle structure)
      const { data, error } = await supabase
        .from('couples')
        .select('wedding_date')
        .eq('user_id', user.id)
        .single()

      if (!error && data?.wedding_date) {
        setDateMarriage(data.wedding_date)
      }
    } catch (err) {
      console.error('Erreur chargement date mariage:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    if (!user) return
    
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('couple_id', user.id)
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
          couple_id: user.id,
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
    if (!user) return

    const supabase = createClient()
    const { error } = await supabase
      .from('timeline_events')
      .insert({
        couple_id: user.id,
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

  return (
    <div className="w-full flex flex-col" style={{ height: 'calc(100dvh - 140px)', minHeight: '480px' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="mb-4 sm:mb-5 flex-shrink-0"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#823F91] tracking-tight mb-1">
              Calendrier de mariage
            </h1>
            {dateMarriage ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
                <CalendarIcon className="h-4 w-4 text-[#823F91] flex-shrink-0" />
                <span>
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
                <span className="text-gray-300">•</span>
                <span className="font-semibold text-[#823F91]">
                  {(() => {
                    const date = new Date(dateMarriage)
                    const today = new Date()
                    const diff = date.getTime() - today.getTime()
                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
                    if (days > 0) return `J-${days}`
                    if (days === 0) return "Aujourd'hui !"
                    return `Il y a ${Math.abs(days)} j`
                  })()}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                <a href="/couple/profil" className="text-[#823F91] hover:text-[#6D3478] underline">
                  Définir la date de mariage
                </a>{' '}
                pour voir le compte à rebours
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Calendrier plein écran */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="flex-1 overflow-hidden rounded-2xl border border-[#823F91]/15 bg-white shadow-sm"
      >
        <CalendarDashboard
          events={calendarEvents}
          onEventCreate={handleCalendarEventCreate}
          showTime={false}
          loading={loading}
          defaultView="agenda"
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
