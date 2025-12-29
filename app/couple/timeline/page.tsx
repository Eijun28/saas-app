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
import { Calendar as CalendarIcon, Plus, X, Edit2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarWrapper as Calendar } from '@/components/ui/calendar-wrapper'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

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
          alert('La table timeline_events n\'existe pas. Veuillez exécuter le script SQL migrations/create_timeline_events.sql dans Supabase.')
        } else {
          alert(`Erreur lors de la mise à jour: ${error.message}`)
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
          alert('La table timeline_events n\'existe pas. Veuillez exécuter le script SQL migrations/create_timeline_events.sql dans Supabase.')
        } else {
          alert(`Erreur lors de la création: ${error.message}`)
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

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return

    const supabase = createClient()
    const { error } = await supabase.from('timeline_events').delete().eq('id', id)

    if (error) {
      console.error('Erreur suppression:', error)
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        alert('La table timeline_events n\'existe pas. Veuillez exécuter le script SQL migrations/create_timeline_events.sql dans Supabase.')
      } else {
        alert(`Erreur lors de la suppression: ${error.message}`)
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#4A4A4A]">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="mb-8">
            <p className="text-[#4A4A4A] mb-4 text-center">
              Planifiez votre mariage étape par étape
            </p>
            <div className="flex items-center justify-center gap-4">
              {/* Date du mariage - Version compacte */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 flex-shrink-0">
                <CalendarIcon className="h-5 w-5 text-[#823F91] flex-shrink-0" />
                {dateMarriage ? (
                  <div>
                    <p className="text-sm font-medium text-[#0D0D0D] whitespace-nowrap">
                      {(() => {
                        const dateStr = new Date(dateMarriage).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                        return dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
                      })()}
                    </p>
                    <p className="text-xs text-[#6B7280] mt-1 whitespace-nowrap">
                      {(() => {
                        const date = new Date(dateMarriage)
                        const today = new Date()
                        const diff = date.getTime() - today.getTime()
                        const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
                        if (days > 0) {
                          return `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`
                        } else if (days === 0) {
                          return "C'est aujourd'hui !"
                        } else {
                          return `Il y a ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''}`
                        }
                      })()}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-[#4A4A4A] whitespace-nowrap">
                      Aucune date de mariage renseignée.{' '}
                      <a href="/couple/profil" className="text-[#823F91] hover:underline font-medium">
                        Définir dans le profil
                      </a>
                    </p>
                  </div>
                )}
              </div>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-[#823F91] hover:bg-[#6D3478] text-white gap-2 flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
                Créer un événement
              </Button>
            </div>
          </div>

          {/* Liste des événements */}
          {events.length > 0 && (
            <Card className="border-gray-200 mb-8">
              <CardHeader>
                <CardTitle>Événements planifiés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#0D0D0D] mb-1">
                            {event.title}
                          </h3>
                          {event.description && (
                            <p className="text-sm text-[#4A4A4A] mb-2">
                              {event.description}
                            </p>
                          )}
                          <p className="text-xs text-[#6B7280]">
                            {(() => {
                              const dateStr = new Date(event.event_date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                              return dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
                            })()}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEvent(event)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEvent(event.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendrier */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Calendrier</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                onDateSelect={(date) => {
                  setEventForm({
                    title: '',
                    description: '',
                    event_date: date,
                  })
                  setEditingEvent(null)
                  setIsDialogOpen(true)
                }}
                showSelectedDateInfo={false}
                maxWidth="max-w-full"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Dialog de création d'événement */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Modifier l\'événement' : 'Créer un événement'}</DialogTitle>
              <DialogDescription>
                {editingEvent ? 'Modifiez les détails de votre événement' : 'Ajoutez un événement à votre timeline de mariage'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="event-title">Titre de l'événement</Label>
                <Input
                  id="event-title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="Ex: Essayage robe, Dégustation menu..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !eventForm.event_date && "text-muted-foreground"
                      )}
                    >
                      <div className="relative w-full">
                        <Input
                          readOnly
                          value={
                            eventForm.event_date
                              ? eventForm.event_date.toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })
                              : "Sélectionner une date"
                          }
                          placeholder="Sélectionner une date"
                          className="cursor-pointer pr-10"
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="bg-white rounded-xl border p-4">
                      <Calendar
                        mode="single"
                        selected={eventForm.event_date || undefined}
                        onSelect={(date) => setEventForm({ ...eventForm, event_date: date || null })}
                        locale={fr}
                        className="rounded-md"
                        captionLayout="dropdown-buttons"
                        fromYear={2025}
                        toYear={2030}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-description">Description (optionnel)</Label>
                <Textarea
                  id="event-description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Ajoutez des détails sur cet événement..."
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>

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
    </div>
  )
}
