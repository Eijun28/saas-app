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
} from '@/components/ui/select-radix'
import type { CoupleEventFormData, CoupleEventStatus, CoupleEventWithType } from '@/types/cultural-events.types'
import { EMPTY_EVENT_FORM, EVENT_STATUS_CONFIG } from '@/types/cultural-events.types'
import type { CulturalEventType } from '@/types/cultural-events.types'

interface EventFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CoupleEventFormData) => Promise<void>
  editingEvent?: CoupleEventWithType | null
  eventTypes: CulturalEventType[]
  loading?: boolean
}

export function EventForm({
  open,
  onOpenChange,
  onSubmit,
  editingEvent,
  eventTypes,
  loading = false,
}: EventFormProps) {
  const [form, setForm] = useState<CoupleEventFormData>(EMPTY_EVENT_FORM)
  const [submitting, setSubmitting] = useState(false)

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
        guest_count: editingEvent.guest_count?.toString() || '',
        budget_min: editingEvent.budget_min?.toString() || '',
        budget_max: editingEvent.budget_max?.toString() || '',
        status: editingEvent.status,
        notes: editingEvent.notes || '',
      })
    } else {
      setForm(EMPTY_EVENT_FORM)
    }
  }, [editingEvent, open])

  const handleEventTypeChange = (eventTypeId: string) => {
    if (eventTypeId === 'custom') {
      setForm(prev => ({
        ...prev,
        event_type_id: null,
        custom_event_name: '',
        title: '',
      }))
      return
    }

    const eventType = eventTypes.find(et => et.id === eventTypeId)
    if (eventType) {
      setForm(prev => ({
        ...prev,
        event_type_id: eventType.id,
        custom_event_name: '',
        title: prev.title || eventType.label,
      }))
    }
  }

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
              ? 'Modifiez les détails de votre événement culturel'
              : 'Créez un nouvel événement pour votre mariage'}
          </DialogDescription>
        </DialogHeader>

        <motion.div
          className="space-y-4 py-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {/* Type d'événement */}
          <div className="space-y-2">
            <Label>Type d'événement</Label>
            <Select
              value={form.event_type_id || 'custom'}
              onValueChange={handleEventTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un type d'événement" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((et) => (
                  <SelectItem key={et.id} value={et.id}>
                    {et.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Événement personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nom personnalisé (si custom) */}
          {!form.event_type_id && (
            <div className="space-y-2">
              <Label htmlFor="custom-name">Nom de l'événement *</Label>
              <Input
                id="custom-name"
                value={form.custom_event_name}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  custom_event_name: e.target.value,
                  title: e.target.value,
                }))}
                placeholder="Ex: Cérémonie de bénédiction..."
              />
            </div>
          )}

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre affiché *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Titre de votre événement"
            />
          </div>

          {/* Date + Heure */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <DatePicker
                value={form.event_date || undefined}
                onChange={(date) => setForm(prev => ({ ...prev, event_date: date || null }))}
                placeholder="Date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Heure</Label>
              <Input
                id="time"
                type="time"
                value={form.event_time}
                onChange={(e) => setForm(prev => ({ ...prev, event_time: e.target.value }))}
              />
            </div>
          </div>

          {/* Lieu */}
          <div className="space-y-2">
            <Label htmlFor="venue">Lieu</Label>
            <Input
              id="venue"
              value={form.venue}
              onChange={(e) => setForm(prev => ({ ...prev, venue: e.target.value }))}
              placeholder="Nom du lieu"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue-address">Adresse</Label>
            <Input
              id="venue-address"
              value={form.venue_address}
              onChange={(e) => setForm(prev => ({ ...prev, venue_address: e.target.value }))}
              placeholder="Adresse complète"
            />
          </div>

          {/* Invités + Budget */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="guests">Invités</Label>
              <Input
                id="guests"
                type="number"
                value={form.guest_count}
                onChange={(e) => setForm(prev => ({ ...prev, guest_count: e.target.value }))}
                placeholder="Nb"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-min">Budget min (€)</Label>
              <Input
                id="budget-min"
                type="number"
                value={form.budget_min}
                onChange={(e) => setForm(prev => ({ ...prev, budget_min: e.target.value }))}
                placeholder="Min"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-max">Budget max (€)</Label>
              <Input
                id="budget-max"
                type="number"
                value={form.budget_max}
                onChange={(e) => setForm(prev => ({ ...prev, budget_max: e.target.value }))}
                placeholder="Max"
                min={0}
              />
            </div>
          </div>

          {/* Statut (seulement en édition) */}
          {isEditing && (
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={form.status}
                onValueChange={(val) => setForm(prev => ({ ...prev, status: val as CoupleEventStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(EVENT_STATUS_CONFIG) as [CoupleEventStatus, { label: string }][]).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
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
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez votre événement..."
              className="min-h-[80px] resize-none"
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes personnelles (non partagées)..."
              className="min-h-[60px] resize-none"
              rows={2}
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
