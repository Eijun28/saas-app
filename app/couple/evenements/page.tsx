'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Calendar, CalendarDays, CalendarCheck, List, TrendingUp, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PageTitle } from '@/components/couple/shared/PageTitle'
import { EventCard } from '@/components/couple-events/EventCard'
import { EventForm } from '@/components/couple-events/EventForm'
import { EventCalendarView } from '@/components/couple-events/EventCalendarView'
import { EventVisualSelector } from '@/components/couple-events/EventVisualSelector'
import { CulturalEventSuggestions } from '@/components/couple-events/CulturalEventSuggestions'
import { cn } from '@/lib/utils'
import type { TimelineEvent, TimelineEventFormData, EventCategory } from '@/types/cultural-events.types'

type ViewMode = 'cards' | 'list' | 'calendar'

export default function EvenementsPage() {
  const { user } = useUser()
  const router   = useRouter()

  const [loading, setLoading]           = useState(true)
  const [events, setEvents]             = useState<TimelineEvent[]>([])
  const [coupleId, setCoupleId]         = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen]     = useState(false)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const [cultures, setCultures]         = useState<string[]>([])
  const [religions, setReligions]       = useState<string[]>([])
  const [viewMode, setViewMode]         = useState<ViewMode>('cards')
  const [suggestionValues, setSuggestionValues] = useState<{
    title: string
    description: string
    category?: EventCategory
  } | undefined>()

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    const supabase = createClient()

    try {
      const { data: couple } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!couple) {
        setLoading(false)
        return
      }

      setCoupleId(couple.id)

      const [eventsResult, prefsResult] = await Promise.all([
        supabase
          .from('timeline_events')
          .select('*')
          .eq('couple_id', couple.id)
          .order('event_date', { ascending: true }),
        supabase
          .from('couple_preferences')
          .select('cultural_preferences')
          .eq('couple_id', couple.id)
          .maybeSingle(),
      ])

      if (eventsResult.error) {
        console.error('Erreur chargement événements:', eventsResult.error)
        toast.error('Erreur lors du chargement des événements')
      }

      setEvents((eventsResult.data as TimelineEvent[]) || [])

      const culturalPrefs = prefsResult.data?.cultural_preferences as Record<string, unknown> | null
      if (culturalPrefs) {
        setCultures((culturalPrefs.cultures as string[]) || [])
        setReligions((culturalPrefs.religions as string[]) || [])
      }
    } catch (err) {
      console.error('Erreur chargement données événements:', err)
      toast.error('Erreur lors du chargement des événements')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (formData: TimelineEventFormData) => {
    if (!coupleId) return

    const supabase = createClient()
    const payload = {
      title:       formData.title,
      description: formData.description || null,
      event_date:  formData.event_date
        ? formData.event_date.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      status:      formData.status,
      start_time:  formData.start_time || null,
      end_time:    formData.end_time   || null,
      location:    formData.location   || null,
      category:    formData.category   || null,
    }

    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('timeline_events')
          .update(payload)
          .eq('id', editingEvent.id)

        if (error) throw error
        toast.success('Événement mis à jour')
      } else {
        const { error } = await supabase
          .from('timeline_events')
          .insert({ couple_id: coupleId, ...payload })

        if (error) throw error
        toast.success('Événement créé')
      }

      await loadData()
    } catch (err) {
      console.error('Erreur sauvegarde événement:', err)
      toast.error('Erreur lors de la sauvegarde')
      throw err
    }
  }

  const handleEventClick = (event: TimelineEvent) => {
    router.push(`/couple/evenements/${event.id}`)
  }

  const handleOpenCreate = () => {
    setEditingEvent(null)
    setSuggestionValues(undefined)
    setIsFormOpen(true)
  }

  const handleSuggestionSelect = (title: string, description: string, category?: EventCategory) => {
    setEditingEvent(null)
    setSuggestionValues({ title, description, category })
    setIsFormOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#823F91] border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Chargement des événements...</p>
        </div>
      </div>
    )
  }

  // Stats
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const confirmedEvents = events.filter(e => e.status === 'confirmed')
  const upcomingEvents = events.filter(e => new Date(e.event_date) >= now)
  const planningEvents = events.filter(e => e.status === 'planning')

  return (
    <div className="max-w-5xl mx-auto px-1 sm:px-0">
      <PageTitle
        title="Mes événements"
        description="Organisez chaque cérémonie et fête de votre mariage : religieuse, culturelle, réception, henné..."
      />

      {/* Stats cards */}
      {events.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-3 gap-1 sm:gap-3 mb-5"
        >
          <div className="flex items-center gap-2 sm:gap-3 rounded-xl border border-gray-100 bg-white p-2 sm:p-3 shadow-sm">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#823F91]/10 flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-[#823F91]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold text-gray-900">{upcomingEvents.length}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">A venir</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 rounded-xl border border-gray-100 bg-white p-2 sm:p-3 shadow-sm">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-green-500/10 flex-shrink-0">
              <CalendarCheck className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold text-gray-900">{confirmedEvents.length}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">Confirmés</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 rounded-xl border border-gray-100 bg-white p-2 sm:p-3 shadow-sm">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#9D5FA8]/10 flex-shrink-0">
              <CalendarDays className="h-4 w-4 text-[#9D5FA8]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold text-gray-900">{planningEvents.length}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">En cours</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mobile: Header Google Calendar style */}
      <div className="sm:hidden space-y-2 mb-5">
        {/* Ligne 1 : ← Titre mois/semaine → (tap titre = aujourd'hui) */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {/* navigation handled by EventCalendarView */}}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#823F91] hover:bg-[#F5F0F7] rounded-full transition-colors active:scale-95 touch-manipulation invisible"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-semibold text-[#823F91] text-center truncate px-2">
            {events.length === 0
              ? 'Aucun événement'
              : `${events.length} événement${events.length > 1 ? 's' : ''}`}
          </h2>
          <button
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center invisible"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Ligne 2 : Sélecteur de vue (pills arrondis) */}
        <div className="flex gap-0.5 bg-gray-100/80 rounded-full p-0.5">
          {([
            { key: 'cards' as const, label: 'Cartes', icon: LayoutGrid },
            { key: 'list' as const, label: 'Liste', icon: List },
            { key: 'calendar' as const, label: 'Calendrier', icon: CalendarDays },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={cn(
                'flex-1 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 touch-manipulation',
                viewMode === key
                  ? 'bg-[#823F91] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: Header classique */}
      <div className="hidden sm:flex items-center justify-between mb-5 gap-2">
        <p className="text-xs sm:text-sm text-gray-500">
          {events.length === 0
            ? 'Aucun événement pour le moment'
            : `${events.length} événement${events.length > 1 ? 's' : ''}`}
        </p>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'cards'
                  ? 'bg-[#823F91] text-white'
                  : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cartes
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-200',
                viewMode === 'list'
                  ? 'bg-[#823F91] text-white'
                  : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              <List className="h-3.5 w-3.5" />
              Liste
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-200',
                viewMode === 'calendar'
                  ? 'bg-[#823F91] text-white'
                  : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Calendrier
            </button>
          </div>

          <Button
            onClick={handleOpenCreate}
            className="bg-[#823F91] hover:bg-[#6D3478] text-white"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Suggestions culturelles */}
      <CulturalEventSuggestions
        cultures={cultures}
        religions={religions}
        onSelect={handleSuggestionSelect}
      />

      {/* Vue liste ou calendrier */}
      {events.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="h-16 w-16 rounded-full bg-[#823F91]/10 flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-[#823F91]/60" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun événement</h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            Cliquez sur une suggestion ci-dessus ou créez un événement personnalisé.
          </p>
          <Button
            onClick={handleOpenCreate}
            className="bg-[#823F91] hover:bg-[#6D3478] text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Créer un événement personnalisé
          </Button>
        </motion.div>
      ) : viewMode === 'cards' ? (
        <EventVisualSelector
          events={events}
          onSelect={handleEventClick}
          onFindProvider={(event) => {
            const params = new URLSearchParams()
            if (event.category) params.set('event_type', event.category)
            if (event.location) params.set('city', event.location)
            if (event.event_date) params.set('date', event.event_date)
            if (event.title) params.set('event_title', event.title)
            params.set('event_id', event.id)
            router.push(`/couple/matching?${params.toString()}`)
          }}
        />
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              index={index}
              onClick={() => handleEventClick(event)}
            />
          ))}
        </div>
      ) : (
        <EventCalendarView
          events={events}
          onEventClick={handleEventClick}
        />
      )}

      {/* Mobile: FAB (Floating Action Button) style Google Calendar */}
      <button
        onClick={handleOpenCreate}
        className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 flex items-center justify-center bg-[#823F91] text-white rounded-2xl shadow-lg shadow-[#823F91]/30 active:scale-90 transition-transform touch-manipulation"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Dialog formulaire */}
      <EventForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setSuggestionValues(undefined)
        }}
        onSubmit={handleFormSubmit}
        editingEvent={editingEvent}
        initialValues={suggestionValues}
      />
    </div>
  )
}
