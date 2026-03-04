'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  TimelineEventFormData,
  TimelineEvent,
  EventCategory,
  CoupleEventStatus,
} from '@/types/cultural-events.types'
import {
  EMPTY_EVENT_FORM,
  EVENT_CATEGORY_CONFIG,
  EVENT_STATUS_CONFIG,
} from '@/types/cultural-events.types'

interface EventFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TimelineEventFormData) => Promise<void>
  editingEvent?: TimelineEvent | null
  loading?: boolean
  /** Valeurs pré-remplies depuis une suggestion culturelle */
  initialValues?: { title: string; description: string; category?: EventCategory }
}

export function EventForm({
  open,
  onOpenChange,
  onSubmit,
  editingEvent,
  loading = false,
  initialValues,
}: EventFormProps) {
  const [form, setForm] = useState<TimelineEventFormData>(EMPTY_EVENT_FORM)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (editingEvent) {
      setForm({
        title:       editingEvent.title,
        description: editingEvent.description || '',
        event_date:  editingEvent.event_date ? new Date(editingEvent.event_date) : null,
        status:      editingEvent.status || 'planning',
        start_time:  editingEvent.start_time || '',
        end_time:    editingEvent.end_time || '',
        location:    editingEvent.location || '',
        category:    editingEvent.category || '',
      })
    } else if (initialValues) {
      setForm({
        ...EMPTY_EVENT_FORM,
        title:       initialValues.title,
        description: initialValues.description,
        category:    initialValues.category || '',
      })
    } else {
      setForm(EMPTY_EVENT_FORM)
    }
  }, [editingEvent, open, initialValues])

  const handleSubmit = async () => {
    if (!form.title) return
    setSubmitting(true)
    try {
      await onSubmit(form)
      setForm(EMPTY_EVENT_FORM)
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const isEditing = !!editingEvent

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 sm:p-6">
        <DialogHeader className="pb-1 sm:pb-2">
          <DialogTitle className="text-base sm:text-lg">
            {isEditing ? "Modifier l'événement" : 'Ajouter un événement'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {isEditing
              ? 'Modifiez les détails de votre événement'
              : 'Créez un nouvel événement pour votre mariage'}
          </DialogDescription>
        </DialogHeader>

        <motion.div
          className="space-y-3 sm:space-y-4 py-2 sm:py-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {/* Titre */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="title" className="text-sm">Titre *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Titre de votre événement"
              className="h-9 sm:h-10"
            />
          </div>

          {/* Catégorie + Statut côte à côte */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm">Catégorie</Label>
              <Select
                value={form.category}
                onValueChange={(val) =>
                  setForm(prev => ({ ...prev, category: val as EventCategory | '' }))
                }
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue placeholder="Catégorie..." />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(EVENT_CATEGORY_CONFIG) as [
                      EventCategory,
                      { label: string; emoji: string },
                    ][]
                  ).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.emoji} {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm">Statut</Label>
              <Select
                value={form.status}
                onValueChange={(val) =>
                  setForm(prev => ({ ...prev, status: val as CoupleEventStatus }))
                }
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(EVENT_STATUS_CONFIG) as [
                      CoupleEventStatus,
                      { label: string },
                    ][]
                  ).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-sm">Date</Label>
            <DatePicker
              value={form.event_date || undefined}
              onChange={(date) => setForm(prev => ({ ...prev, event_date: date || null }))}
              placeholder="Date de l'événement"
              className="h-9 sm:h-10"
            />
          </div>

          {/* Horaires */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="start_time" className="flex items-center gap-1 text-sm">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
                Début
              </Label>
              <Input
                id="start_time"
                type="time"
                value={form.start_time}
                onChange={(e) => setForm(prev => ({ ...prev, start_time: e.target.value }))}
                className="text-sm h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="end_time" className="flex items-center gap-1 text-sm">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
                Fin
              </Label>
              <Input
                id="end_time"
                type="time"
                value={form.end_time}
                onChange={(e) => setForm(prev => ({ ...prev, end_time: e.target.value }))}
                className="text-sm h-9 sm:h-10"
              />
            </div>
          </div>

          {/* Lieu */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="location" className="flex items-center gap-1 text-sm">
              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
              Lieu
            </Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Salle, adresse, ville..."
              className="h-9 sm:h-10"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez votre événement..."
              className="min-h-[60px] sm:min-h-[80px] resize-none text-sm"
              rows={2}
            />
          </div>
        </motion.div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2 sm:pt-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting || loading}
            className="w-full sm:w-auto h-9 sm:h-10 text-sm"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#823F91] hover:bg-[#6D3478] text-white w-full sm:w-auto h-9 sm:h-10 text-sm"
            disabled={!form.title || submitting || loading}
          >
            {submitting
              ? 'En cours...'
              : isEditing
                ? 'Enregistrer'
                : "Créer l'événement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
