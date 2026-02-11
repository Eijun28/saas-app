'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Wallet,
  Edit2,
  Trash2,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { EventStatusBadge } from '@/components/couple-events/EventStatusBadge'
import { EventForm } from '@/components/couple-events/EventForm'
import type { CoupleEventWithProviders, CoupleEventFormData, CulturalEventType } from '@/types/cultural-events.types'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Non définie'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatBudget(min: number | null, max: number | null): string {
  if (!min && !max) return 'Non défini'
  if (min && max) return `${min.toLocaleString('fr-FR')} - ${max.toLocaleString('fr-FR')} €`
  if (min) return `À partir de ${min.toLocaleString('fr-FR')} €`
  if (max) return `Jusqu'à ${max.toLocaleString('fr-FR')} €`
  return 'Non défini'
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const eventId = params.eventId as string

  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<CoupleEventWithProviders | null>(null)
  const [eventTypes, setEventTypes] = useState<CulturalEventType[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    if (user && eventId) {
      loadEvent()
    }
  }, [user, eventId])

  const loadEvent = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      const [eventResult, typesResult] = await Promise.all([
        supabase
          .from('couple_events')
          .select(`
            *,
            event_type:cultural_event_types(*),
            providers:couple_event_providers(
              *,
              provider:profiles(id, nom_entreprise, avatar_url, service_type)
            )
          `)
          .eq('id', eventId)
          .single(),
        supabase
          .from('cultural_event_types')
          .select('*')
          .eq('is_active', true)
          .order('culture_category_id')
          .order('display_order'),
      ])

      if (eventResult.error) {
        if (eventResult.error.code === 'PGRST116') {
          toast.error('Événement introuvable')
          router.push('/couple/evenements')
          return
        }
        throw eventResult.error
      }

      setEvent(eventResult.data as CoupleEventWithProviders)
      setEventTypes((typesResult.data as CulturalEventType[]) || [])
    } catch (err) {
      console.error('Erreur chargement événement:', err)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (formData: CoupleEventFormData) => {
    if (!event) return

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
      const { error } = await supabase
        .from('couple_events')
        .update(payload)
        .eq('id', event.id)

      if (error) throw error

      toast.success('Événement mis à jour')
      await loadEvent()
    } catch (err) {
      console.error('Erreur mise à jour:', err)
      toast.error('Erreur lors de la mise à jour')
      throw err
    }
  }

  const handleDelete = async () => {
    if (!event) return
    if (!confirm(`Supprimer "${event.title}" ? Cette action est irréversible.`)) return

    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('couple_events')
        .delete()
        .eq('id', event.id)

      if (error) throw error

      toast.success('Événement supprimé')
      router.push('/couple/evenements')
    } catch (err) {
      console.error('Erreur suppression:', err)
      toast.error('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#823F91] border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-500">Événement introuvable</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Navigation retour */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/couple/evenements')}
          className="text-gray-500 hover:text-gray-900 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Retour aux événements
        </Button>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#823F91] tracking-tight">
                {event.title}
              </h1>
              <EventStatusBadge status={event.status} />
            </div>
            {event.event_type && (
              <p className="text-sm text-gray-500">
                {event.event_type.description}
              </p>
            )}
            {event.description && !event.event_type?.description && (
              <p className="text-sm text-gray-500">
                {event.description}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFormOpen(true)}
              className="border-[#823F91]/30 text-[#823F91] hover:bg-[#823F91]/10"
            >
              <Edit2 className="h-3.5 w-3.5 mr-1.5" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Cards grille */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Planning */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-gray-200/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#823F91]/70" />
                Planning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Date</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(event.event_date)}</p>
              </div>
              {event.event_time && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Heure</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    {event.event_time.slice(0, 5)}
                  </p>
                </div>
              )}
              {event.venue && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Lieu</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    {event.venue}
                  </p>
                  {event.venue_address && (
                    <p className="text-xs text-gray-500 ml-5">{event.venue_address}</p>
                  )}
                </div>
              )}
              {event.guest_count && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Invités</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-gray-400" />
                    {event.guest_count} personnes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Budget */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card className="border-gray-200/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#823F91]/70" />
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">
                {formatBudget(event.budget_min, event.budget_max)}
              </p>
              {event.budget_min && event.budget_max && (
                <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#823F91]/30 rounded-full"
                    style={{ width: '0%' }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Description / Notes */}
        {(event.description || event.notes) && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="sm:col-span-2"
          >
            <Card className="border-gray-200/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#823F91]/70" />
                  Détails
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {event.description && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Description</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.description}</p>
                  </div>
                )}
                {event.notes && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Notes internes</p>
                    <p className="text-sm text-gray-600 italic whitespace-pre-wrap">{event.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Prestataires (placeholder pour le MVP) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="sm:col-span-2"
        >
          <Card className="border-gray-200/80 border-dashed">
            <CardContent className="py-8 text-center">
              <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500 mb-1">Prestataires</p>
              <p className="text-xs text-gray-400">
                La gestion des prestataires par événement sera disponible prochainement.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Dialog formulaire d'édition */}
      <EventForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        editingEvent={event}
        eventTypes={eventTypes}
      />
    </div>
  )
}
