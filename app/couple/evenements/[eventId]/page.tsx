'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Edit2,
  Trash2,
  FileText,
  MapPin,
  Clock,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { EventForm } from '@/components/couple-events/EventForm'
import { cn } from '@/lib/utils'
import type { TimelineEvent, TimelineEventFormData } from '@/types/cultural-events.types'
import { EVENT_CATEGORY_CONFIG, EVENT_STATUS_CONFIG } from '@/types/cultural-events.types'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Non définie'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getDaysInfo(dateStr: string | null): { label: string; variant: 'today' | 'future' | 'past' } | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eventDate = new Date(dateStr)
  eventDate.setHours(0, 0, 0, 0)
  const diff = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff === 0) return { label: "Aujourd'hui", variant: 'today' }
  if (diff > 0)   return { label: `Dans ${diff} jour${diff > 1 ? 's' : ''}`, variant: 'future' }
  return { label: `Il y a ${Math.abs(diff)} jour${Math.abs(diff) > 1 ? 's' : ''}`, variant: 'past' }
}

export default function EventDetailPage() {
  const params   = useParams()
  const router   = useRouter()
  const { user } = useUser()
  const eventId  = params.eventId as string

  const [loading, setLoading]   = useState(true)
  const [event, setEvent]       = useState<TimelineEvent | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    if (user && eventId) loadEvent()
  }, [user, eventId])

  const loadEvent = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('Événement introuvable')
          router.push('/couple/evenements')
          return
        }
        throw error
      }

      setEvent(data as TimelineEvent)
    } catch (err) {
      console.error('Erreur chargement événement:', err)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (formData: TimelineEventFormData) => {
    if (!event) return

    const supabase = createClient()
    const payload = {
      title:       formData.title,
      description: formData.description || null,
      event_date:  formData.event_date
        ? formData.event_date.toISOString().split('T')[0]
        : event.event_date,
      status:      formData.status,
      start_time:  formData.start_time || null,
      end_time:    formData.end_time   || null,
      location:    formData.location   || null,
      category:    formData.category   || null,
    }

    try {
      const { error } = await supabase
        .from('timeline_events')
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
        .from('timeline_events')
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

  const categoryConfig = event.category ? EVENT_CATEGORY_CONFIG[event.category] : null
  const statusConfig   = event.status   ? EVENT_STATUS_CONFIG[event.status]     : null
  const daysInfo       = getDaysInfo(event.event_date)
  const timeLabel      =
    event.start_time
      ? `${event.start_time.slice(0, 5)}${event.end_time ? ` – ${event.end_time.slice(0, 5)}` : ''}`
      : null

  return (
    <div className="max-w-3xl mx-auto">
      {/* Retour */}
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
        className="mb-6 rounded-xl bg-gradient-to-r from-[#823F91]/5 to-purple-50 border border-[#823F91]/10 p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Catégorie + titre */}
            <div className="flex items-center gap-2.5 flex-wrap mb-2">
              {categoryConfig && (
                <span className="text-2xl leading-none">{categoryConfig.emoji}</span>
              )}
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#823F91] tracking-tight">
                {event.title}
              </h1>
            </div>

            {/* Badges : statut + J-X */}
            <div className="flex items-center gap-2 flex-wrap">
              {statusConfig && (
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    statusConfig.bgColor,
                    statusConfig.color,
                  )}
                >
                  {statusConfig.label}
                </span>
              )}
              {daysInfo && (
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    daysInfo.variant === 'today'  && 'bg-[#823F91]/10 text-[#823F91]',
                    daysInfo.variant === 'future' && 'bg-blue-50 text-blue-600',
                    daysInfo.variant === 'past'   && 'bg-gray-100 text-gray-500',
                  )}
                >
                  {daysInfo.label}
                </span>
              )}
            </div>

            {event.description && (
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          {/* Actions */}
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

      {/* Cards de détails */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Date */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-gray-200/80 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-[#823F91]/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-[#823F91]" />
                </div>
                Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-gray-900">{formatDate(event.event_date)}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Catégorie */}
        {categoryConfig && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
          >
            <Card className="border-gray-200/80 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-[#823F91]/10 flex items-center justify-center">
                    <Tag className="h-4 w-4 text-[#823F91]" />
                  </div>
                  Catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-gray-900">
                  {categoryConfig.emoji} {categoryConfig.label}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Horaires */}
        {timeLabel && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14 }}
          >
            <Card className="border-gray-200/80 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-[#823F91]/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-[#823F91]" />
                  </div>
                  Horaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-gray-900">{timeLabel}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Lieu */}
        {event.location && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
          >
            <Card className="border-gray-200/80 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-[#823F91]/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-[#823F91]" />
                  </div>
                  Lieu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-gray-900">{event.location}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Description */}
        {event.description && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className={cn(!event.location && !timeLabel && !categoryConfig ? 'sm:col-span-1' : 'sm:col-span-2')}
          >
            <Card className="border-gray-200/80 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-[#823F91]/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-[#823F91]" />
                  </div>
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Dialog formulaire d'édition */}
      <EventForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        editingEvent={event}
      />
    </div>
  )
}
