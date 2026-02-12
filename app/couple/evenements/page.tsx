'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Calendar, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PageTitle } from '@/components/couple/shared/PageTitle'
import { EventCard } from '@/components/couple-events/EventCard'
import { EventForm } from '@/components/couple-events/EventForm'
import { EventSuggestions } from '@/components/couple-events/EventSuggestions'
import { getSuggestedEvents, type CulturalEventDefinition } from '@/lib/constants/cultural-events'
import type { CoupleEvent, CoupleEventFormData, CoupleEventStatus } from '@/types/cultural-events.types'

type FilterStatus = 'all' | CoupleEventStatus

export default function EvenementsPage() {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<CoupleEvent[]>([])
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CoupleEvent | null>(null)
  const [cultureCategories, setCultureCategories] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    const supabase = createClient()

    try {
      // Charger le couple + préférences culturelles
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

      // Charger les préférences culturelles pour les suggestions
      const { data: prefs } = await supabase
        .from('couple_preferences')
        .select('primary_culture_id, secondary_culture_ids')
        .eq('couple_id', couple.id)
        .single()

      if (prefs) {
        const categories: string[] = []
        if (prefs.primary_culture_id) categories.push(prefs.primary_culture_id)
        if (prefs.secondary_culture_ids) {
          categories.push(...(prefs.secondary_culture_ids as string[]))
        }
        setCultureCategories(categories)
      }

      // Charger les événements depuis couple_events
      const { data: eventsData, error: eventsError } = await supabase
        .from('couple_events')
        .select('*')
        .eq('couple_id', couple.id)
        .order('display_order', { ascending: true })
        .order('event_date', { ascending: true })

      if (eventsError) {
        console.error('Erreur chargement événements:', eventsError)
        toast.error('Erreur lors du chargement des événements')
      }

      setEvents((eventsData as CoupleEvent[]) || [])
    } catch (err) {
      console.error('Erreur chargement données événements:', err)
      toast.error('Erreur lors du chargement des événements')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (formData: CoupleEventFormData) => {
    if (!coupleId) return

    const supabase = createClient()
    const payload = {
      title: formData.title,
      description: formData.description || null,
      event_type_id: formData.event_type_id || null,
      custom_event_name: formData.custom_event_name || null,
      event_date: formData.event_date
        ? formData.event_date.toISOString().split('T')[0]
        : null,
      event_time: formData.event_time || null,
      venue: formData.venue || null,
      venue_address: formData.venue_address || null,
      guest_count: formData.guest_count,
      budget_min: formData.budget_min,
      budget_max: formData.budget_max,
      status: formData.status,
      notes: formData.notes || null,
    }

    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('couple_events')
          .update(payload)
          .eq('id', editingEvent.id)

        if (error) throw error
        toast.success('Événement mis à jour')
      } else {
        const { error } = await supabase
          .from('couple_events')
          .insert({
            couple_id: coupleId,
            display_order: events.length,
            ...payload,
          })

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

  const handleAddSuggestion = (suggestion: CulturalEventDefinition) => {
    setEditingEvent(null)
    setIsFormOpen(true)
    // Le formulaire s'ouvrira directement sur les détails avec le type pré-rempli
    // via EventTypeSelector
  }

  const handleEventClick = (event: CoupleEvent) => {
    router.push(`/couple/evenements/${event.id}`)
  }

  const handleOpenCreate = () => {
    setEditingEvent(null)
    setIsFormOpen(true)
  }

  // Slugs des événements déjà ajoutés (pour griser les suggestions)
  const existingEventSlugs = useMemo(
    () => new Set(events.map(e => e.event_type_id).filter(Boolean) as string[]),
    [events]
  )

  // Suggestions culturelles
  const suggestions = useMemo(
    () => getSuggestedEvents(cultureCategories),
    [cultureCategories]
  )

  // Label de culture pour les suggestions
  const cultureLabel = cultureCategories.length > 0
    ? `Vos traditions`
    : ''

  // Filtrage par statut
  const filteredEvents = useMemo(() => {
    if (filterStatus === 'all') return events
    return events.filter(e => e.status === filterStatus)
  }, [events, filterStatus])

  // Compteurs par statut
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: events.length }
    for (const e of events) {
      counts[e.status] = (counts[e.status] || 0) + 1
    }
    return counts
  }, [events])

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

  return (
    <div className="max-w-4xl mx-auto">
      <PageTitle
        title="Mes événements"
        description="Organisez chaque cérémonie et fête de votre mariage : religieuse, culturelle, réception, henné..."
      />

      {/* Suggestions culturelles */}
      {events.length > 0 && suggestions.length > 0 && cultureLabel && (
        <div className="mb-5">
          <EventSuggestions
            suggestions={suggestions}
            existingEventSlugs={existingEventSlugs}
            cultureLabel={cultureLabel}
            onAddSuggestion={handleAddSuggestion}
          />
        </div>
      )}

      {/* Header avec filtres + bouton ajouter */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {events.length > 0 && (
            <>
              <Filter className="h-4 w-4 text-gray-400" />
              {(['all', 'planning', 'confirmed', 'completed'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                    filterStatus === status
                      ? 'bg-[#823F91] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'Tous' : status === 'planning' ? 'En cours' : status === 'confirmed' ? 'Confirmés' : 'Terminés'}
                  {statusCounts[status] ? ` (${statusCounts[status]})` : ''}
                </button>
              ))}
            </>
          )}
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

      {/* Liste des événements */}
      {events.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Suggestions culturelles en mode vide */}
          {suggestions.length > 0 && cultureLabel && (
            <EventSuggestions
              suggestions={suggestions}
              existingEventSlugs={existingEventSlugs}
              cultureLabel={cultureLabel}
              onAddSuggestion={handleAddSuggestion}
            />
          )}

          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-[#823F91]/10 flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-[#823F91]/60" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun événement
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              Commencez par ajouter les événements de votre mariage : cérémonie religieuse, henné, réception, sangeet...
            </p>
            <Button
              onClick={handleOpenCreate}
              className="bg-[#823F91] hover:bg-[#6D3478] text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Créer mon premier événement
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              index={index}
              onClick={() => handleEventClick(event)}
            />
          ))}
          {filteredEvents.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              Aucun événement avec ce filtre
            </p>
          )}
        </div>
      )}

      {/* Dialog formulaire */}
      <EventForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        editingEvent={editingEvent}
        coupleCultureCategories={cultureCategories}
        existingEventSlugs={existingEventSlugs}
      />
    </div>
  )
}
