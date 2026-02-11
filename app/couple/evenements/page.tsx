'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PageTitle } from '@/components/couple/shared/PageTitle'
import { EventCard } from '@/components/couple-events/EventCard'
import { EventForm } from '@/components/couple-events/EventForm'
import { EventSuggestions } from '@/components/couple-events/EventSuggestions'
import { getSuggestedEvents } from '@/lib/constants/cultural-events'
import { CULTURE_CATEGORIES } from '@/lib/constants/cultures'
import type { CoupleEventWithType, CoupleEventFormData, CulturalEventType } from '@/types/cultural-events.types'
import type { CulturalEventDefinition } from '@/lib/constants/cultural-events'

export default function EvenementsPage() {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<CoupleEventWithType[]>([])
  const [eventTypes, setEventTypes] = useState<CulturalEventType[]>([])
  const [cultureCategoryIds, setCultureCategoryIds] = useState<string[]>([])
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CoupleEventWithType | null>(null)

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
      // Charger le couple_id et les préférences culturelles
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

      // Charger préférences culturelles, événements et types en parallèle
      const [prefsResult, eventsResult, typesResult] = await Promise.all([
        supabase
          .from('couple_preferences')
          .select('primary_culture_id, secondary_culture_ids')
          .eq('couple_id', couple.id)
          .maybeSingle(),
        supabase
          .from('couple_events')
          .select(`
            *,
            event_type:cultural_event_types(*)
          `)
          .eq('couple_id', couple.id)
          .order('display_order')
          .order('event_date', { ascending: true, nullsFirst: false }),
        supabase
          .from('cultural_event_types')
          .select('*')
          .eq('is_active', true)
          .order('culture_category_id')
          .order('display_order'),
      ])

      // Déterminer les catégories culturelles du couple
      if (prefsResult.data) {
        const categoryIds: string[] = []
        const primaryId = prefsResult.data.primary_culture_id
        const secondaryIds = prefsResult.data.secondary_culture_ids || []

        // Résoudre la catégorie parente pour chaque culture
        const allCultureIds = [primaryId, ...secondaryIds].filter(Boolean)
        for (const cultureId of allCultureIds) {
          // Chercher dans les catégories principales
          const mainCat = CULTURE_CATEGORIES.find(c => c.id === cultureId)
          if (mainCat) {
            categoryIds.push(mainCat.id)
            continue
          }
          // Chercher dans les sous-catégories
          for (const cat of CULTURE_CATEGORIES) {
            if (cat.subcategories?.some(sub => sub.id === cultureId)) {
              categoryIds.push(cat.id)
              break
            }
          }
        }

        setCultureCategoryIds([...new Set(categoryIds)])
      }

      setEvents((eventsResult.data as CoupleEventWithType[]) || [])
      setEventTypes((typesResult.data as CulturalEventType[]) || [])
    } catch (err) {
      console.error('Erreur chargement données événements:', err)
      toast.error('Erreur lors du chargement des événements')
    } finally {
      setLoading(false)
    }
  }

  // Suggestions basées sur la culture
  const suggestions = useMemo(() => {
    if (cultureCategoryIds.length === 0) return []
    return getSuggestedEvents(cultureCategoryIds)
  }, [cultureCategoryIds])

  const existingEventSlugs = useMemo(() => {
    return new Set(
      events
        .map(e => e.event_type?.slug)
        .filter((slug): slug is string => !!slug)
    )
  }, [events])

  const cultureLabel = useMemo(() => {
    if (cultureCategoryIds.length === 0) return ''
    return cultureCategoryIds
      .map(id => CULTURE_CATEGORIES.find(c => c.id === id)?.label || '')
      .filter(Boolean)
      .join(' & ')
  }, [cultureCategoryIds])

  const handleAddSuggestion = (suggestion: CulturalEventDefinition) => {
    // Trouver le type d'événement correspondant dans la DB
    const eventType = eventTypes.find(et => et.slug === suggestion.slug)

    setEditingEvent(null)
    setIsFormOpen(true)

    // Pré-remplir sera géré via un state séparé
    // On ouvre simplement le formulaire avec le type pré-sélectionné
    setTimeout(() => {
      const selectElement = document.querySelector('[data-slot="select-trigger"]')
      // Le formulaire va se pré-remplir via editingEvent = null et le type
    }, 0)

    // Alternative plus simple : créer directement l'événement
    if (eventType && coupleId) {
      handleCreateFromSuggestion(eventType, suggestion)
    }
  }

  const handleCreateFromSuggestion = async (
    eventType: CulturalEventType,
    suggestion: CulturalEventDefinition
  ) => {
    if (!coupleId) return

    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('couple_events')
        .insert({
          couple_id: coupleId,
          event_type_id: eventType.id,
          title: eventType.label,
          description: eventType.description,
          status: 'planning',
        })

      if (error) throw error

      toast.success(`${eventType.label} ajouté`)
      await loadData()
    } catch (err) {
      console.error('Erreur création événement:', err)
      toast.error('Erreur lors de la création')
    }
  }

  const handleFormSubmit = async (formData: CoupleEventFormData) => {
    if (!coupleId) return

    const supabase = createClient()
    const payload = {
      event_type_id: formData.event_type_id,
      custom_event_name: formData.custom_event_name || null,
      title: formData.title,
      description: formData.description || null,
      event_date: formData.event_date
        ? formData.event_date.toISOString().split('T')[0]
        : null,
      event_time: formData.event_time || null,
      venue: formData.venue || null,
      venue_address: formData.venue_address || null,
      guest_count: formData.guest_count ? parseInt(formData.guest_count) : null,
      budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
      budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
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

  const handleEventClick = (event: CoupleEventWithType) => {
    router.push(`/couple/evenements/${event.id}`)
  }

  const handleOpenCreate = () => {
    setEditingEvent(null)
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

  return (
    <div className="max-w-4xl mx-auto">
      <PageTitle
        title="Mes événements"
        description="Organisez chaque événement de votre mariage : cérémonies, fêtes traditionnelles, réceptions..."
      />

      {/* Suggestions culturelles */}
      {suggestions.length > 0 && events.length < 6 && (
        <div className="mb-6">
          <EventSuggestions
            suggestions={suggestions}
            existingEventSlugs={existingEventSlugs}
            cultureLabel={cultureLabel}
            onAddSuggestion={handleAddSuggestion}
          />
        </div>
      )}

      {/* Header avec bouton ajouter */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          {events.length === 0
            ? 'Aucun événement pour le moment'
            : `${events.length} événement${events.length > 1 ? 's' : ''}`}
        </p>
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
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="h-16 w-16 rounded-full bg-[#823F91]/10 flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-[#823F91]/60" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun événement
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            Commencez par ajouter les événements de votre mariage : cérémonie religieuse, henné, réception...
          </p>
          <Button
            onClick={handleOpenCreate}
            className="bg-[#823F91] hover:bg-[#6D3478] text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Créer mon premier événement
          </Button>
        </motion.div>
      ) : (
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
      )}

      {/* Dialog formulaire */}
      <EventForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        editingEvent={editingEvent}
        eventTypes={eventTypes}
      />
    </div>
  )
}
