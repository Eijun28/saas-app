'use client'

import { useState, useEffect } from 'react'
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
import { CulturalEventSuggestions } from '@/components/couple-events/CulturalEventSuggestions'
import type { TimelineEvent, TimelineEventFormData } from '@/types/cultural-events.types'

export default function EvenementsPage() {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading]           = useState(true)
  const [events, setEvents]             = useState<TimelineEvent[]>([])
  const [coupleId, setCoupleId]         = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen]     = useState(false)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const [cultures, setCultures]         = useState<string[]>([])
  const [religions, setReligions]       = useState<string[]>([])
  const [suggestionValues, setSuggestionValues] = useState<{ title: string; description: string } | undefined>()

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
      // Charger le couple_id
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

      // Charger en parallèle : événements + préférences culturelles
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

      // Extraire cultures et religions des préférences
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
      title: formData.title,
      description: formData.description || null,
      event_date: formData.event_date
        ? formData.event_date.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
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

  const handleEventClick = (event: TimelineEvent) => {
    router.push(`/couple/evenements/${event.id}`)
  }

  const handleOpenCreate = () => {
    setEditingEvent(null)
    setSuggestionValues(undefined)
    setIsFormOpen(true)
  }

  const handleSuggestionSelect = (title: string, description: string) => {
    setEditingEvent(null)
    setSuggestionValues({ title, description })
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
        description="Organisez chaque cérémonie et fête de votre mariage : religieuse, culturelle, réception, henné..."
      />

      {/* Header avec bouton ajouter */}
      <div className="flex items-center justify-between mb-6">
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

      {/* Suggestions culturelles */}
      <CulturalEventSuggestions
        cultures={cultures}
        religions={religions}
        onSelect={handleSuggestionSelect}
      />

      {/* Liste des événements */}
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun événement
          </h3>
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
