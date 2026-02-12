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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EventTypeSelector } from './EventTypeSelector'
import type {
  CoupleEvent,
  CoupleEventFormData,
  CoupleEventStatus,
} from '@/types/cultural-events.types'
import { EMPTY_COUPLE_EVENT_FORM, EVENT_STATUS_CONFIG } from '@/types/cultural-events.types'
import type { CulturalEventDefinition, CultureEventGroup } from '@/lib/constants/cultural-events'

interface EventFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CoupleEventFormData) => Promise<void>
  editingEvent?: CoupleEvent | null
  coupleCultureCategories?: string[]
  existingEventSlugs?: Set<string>
}

type Step = 'type_selection' | 'details'

export function EventForm({
  open,
  onOpenChange,
  onSubmit,
  editingEvent,
  coupleCultureCategories = [],
  existingEventSlugs = new Set(),
}: EventFormProps) {
  const [form, setForm] = useState<CoupleEventFormData>(EMPTY_COUPLE_EVENT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<Step>('type_selection')

  const isEditing = !!editingEvent

  useEffect(() => {
    if (editingEvent) {
      setForm({
        event_type_id: editingEvent.event_type_id,
        custom_event_name: editingEvent.custom_event_name || '',
        title: editingEvent.title,
        description: editingEvent.description || '',
        event_date: editingEvent.event_date ? new Date(editingEvent.event_date) : null,
        event_time: editingEvent.event_time || '',
        venue: editingEvent.venue || '',
        venue_address: editingEvent.venue_address || '',
        guest_count: editingEvent.guest_count,
        budget_min: editingEvent.budget_min,
        budget_max: editingEvent.budget_max,
        status: editingEvent.status,
        notes: editingEvent.notes || '',
      })
      setStep('details')
    } else {
      setForm(EMPTY_COUPLE_EVENT_FORM)
      setStep('type_selection')
    }
  }, [editingEvent, open])

  const handleSelectType = (event: CulturalEventDefinition, _group: CultureEventGroup) => {
    setForm(prev => ({
      ...prev,
      event_type_id: event.slug,
      title: event.label,
      description: event.description,
    }))
    setStep('details')
  }

  const handleCustomEvent = () => {
    setForm(prev => ({
      ...prev,
      event_type_id: null,
      custom_event_name: '',
      title: '',
    }))
    setStep('details')
  }

  const handleSubmit = async () => {
    if (!form.title) return
    setSubmitting(true)
    try {
      await onSubmit(form)
      setForm(EMPTY_COUPLE_EVENT_FORM)
      setStep('type_selection')
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const updateField = <K extends keyof CoupleEventFormData>(
    key: K,
    value: CoupleEventFormData[K]
  ) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? 'Modifier l\'événement'
              : step === 'type_selection'
                ? 'Quel événement souhaitez-vous organiser ?'
                : 'Détails de l\'événement'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifiez les détails de votre événement'
              : step === 'type_selection'
                ? 'Choisissez parmi les suggestions ou créez un événement personnalisé'
                : 'Renseignez les informations de planification'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1 : Sélection du type (uniquement en création) */}
        {step === 'type_selection' && !isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="py-2"
          >
            <EventTypeSelector
              coupleCultureCategories={coupleCultureCategories}
              existingEventSlugs={existingEventSlugs}
              onSelect={handleSelectType}
              onCustom={handleCustomEvent}
            />
          </motion.div>
        )}

        {/* Step 2 : Détails de l'événement */}
        {step === 'details' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="space-y-4 py-2"
          >
            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="title">Nom de l'événement *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="Ex: Henné, Réception, Cérémonie civile..."
              />
            </div>

            {/* Date + Heure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <DatePicker
                  value={form.event_date || undefined}
                  onChange={date => updateField('event_date', date || null)}
                  placeholder="Date de l'événement"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_time">Heure</Label>
                <Input
                  id="event_time"
                  type="time"
                  value={form.event_time}
                  onChange={e => updateField('event_time', e.target.value)}
                />
              </div>
            </div>

            {/* Lieu */}
            <div className="space-y-2">
              <Label htmlFor="venue">Lieu</Label>
              <Input
                id="venue"
                value={form.venue}
                onChange={e => updateField('venue', e.target.value)}
                placeholder="Nom du lieu (ex: Salle des fêtes, Domaine...)"
              />
            </div>

            {/* Nombre d'invités + Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="guest_count">Invités</Label>
                <Input
                  id="guest_count"
                  type="number"
                  min={0}
                  value={form.guest_count ?? ''}
                  onChange={e =>
                    updateField('guest_count', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="Nb"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_min">Budget min (€)</Label>
                <Input
                  id="budget_min"
                  type="number"
                  min={0}
                  value={form.budget_min ?? ''}
                  onChange={e =>
                    updateField('budget_min', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="Min"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_max">Budget max (€)</Label>
                <Input
                  id="budget_max"
                  type="number"
                  min={0}
                  value={form.budget_max ?? ''}
                  onChange={e =>
                    updateField('budget_max', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Statut (uniquement en édition) */}
            {isEditing && (
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={form.status}
                  onValueChange={v => updateField('status', v as CoupleEventStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(EVENT_STATUS_CONFIG) as CoupleEventStatus[]).map(status => (
                      <SelectItem key={status} value={status}>
                        {EVENT_STATUS_CONFIG[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={e => updateField('description', e.target.value)}
                placeholder="Décrivez votre événement, ambiance souhaitée..."
                className="min-h-[70px] resize-none"
                rows={2}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={e => updateField('notes', e.target.value)}
                placeholder="Notes pour vous (non visibles par les prestataires)"
                className="min-h-[50px] resize-none"
                rows={2}
              />
            </div>
          </motion.div>
        )}

        {step === 'details' && (
          <DialogFooter className="gap-2">
            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => setStep('type_selection')}
                disabled={submitting}
              >
                Retour
              </Button>
            )}
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
        )}
      </DialogContent>
    </Dialog>
  )
}
