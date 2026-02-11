'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
import type { TimelineEventFormData, TimelineEvent } from '@/types/cultural-events.types'
import { EMPTY_EVENT_FORM } from '@/types/cultural-events.types'

interface EventFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TimelineEventFormData) => Promise<void>
  editingEvent?: TimelineEvent | null
  eventTypes?: unknown[]
  loading?: boolean
}

export function EventForm({
  open,
  onOpenChange,
  onSubmit,
  editingEvent,
  loading = false,
}: EventFormProps) {
  const [form, setForm] = useState<TimelineEventFormData>(EMPTY_EVENT_FORM)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (editingEvent) {
      setForm({
        title: editingEvent.title,
        description: editingEvent.description || '',
        event_date: editingEvent.event_date ? new Date(editingEvent.event_date) : null,
      })
    } else {
      setForm(EMPTY_EVENT_FORM)
    }
  }, [editingEvent, open])

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
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier l\'événement' : 'Ajouter un événement'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifiez les détails de votre événement'
              : 'Créez un nouvel événement pour votre mariage'}
          </DialogDescription>
        </DialogHeader>

        <motion.div
          className="space-y-4 py-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Titre de votre événement"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <DatePicker
              value={form.event_date || undefined}
              onChange={(date) => setForm(prev => ({ ...prev, event_date: date || null }))}
              placeholder="Date de l'événement"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez votre événement..."
              className="min-h-[80px] resize-none"
              rows={3}
            />
          </div>
        </motion.div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#823F91] hover:bg-[#6D3478] text-white"
            disabled={!form.title || submitting}
          >
            {submitting
              ? 'En cours...'
              : isEditing
                ? 'Enregistrer'
                : 'Créer l\'événement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
