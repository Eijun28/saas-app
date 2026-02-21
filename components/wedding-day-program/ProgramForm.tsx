'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { ProgramItem, CreateProgramItemInput, ProgramCategory } from '@/types/wedding-day-program'
import { CATEGORY_LABELS } from '@/types/wedding-day-program'

interface ProgramFormProps {
  open:      boolean
  onClose:   () => void
  onSaved:   (item: ProgramItem) => void
  existing?: ProgramItem | null
  /** Heure pré-remplie quand on clique sur un créneau vide dans la timeline */
  defaultStartTime?: string
}

const EMPTY_FORM: CreateProgramItemInput = {
  start_time:  '09:00',
  end_time:    null,
  title:       '',
  description: null,
  location:    null,
  responsible: null,
  provider_id: null,
  category:    'autre',
  is_public:   true,
  sort_order:  0,
}

export function ProgramForm({ open, onClose, onSaved, existing, defaultStartTime }: ProgramFormProps) {
  const [form, setForm]     = useState<CreateProgramItemInput>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existing) {
      setForm({
        start_time:  existing.start_time.slice(0, 5),
        end_time:    existing.end_time ? existing.end_time.slice(0, 5) : null,
        title:       existing.title,
        description: existing.description,
        location:    existing.location,
        responsible: existing.responsible,
        provider_id: existing.provider_id,
        category:    existing.category,
        is_public:   existing.is_public,
        sort_order:  existing.sort_order,
      })
    } else {
      setForm({ ...EMPTY_FORM, start_time: defaultStartTime ?? '09:00' })
    }
  }, [existing, defaultStartTime, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Le titre est requis'); return }
    if (!form.start_time)   { toast.error('L\'heure de début est requise'); return }

    if (form.end_time && form.end_time <= form.start_time) {
      toast.error('L\'heure de fin doit être après l\'heure de début')
      return
    }

    setSaving(true)
    try {
      const url    = existing ? `/api/wedding-day-program/${existing.id}` : '/api/wedding-day-program'
      const method = existing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erreur lors de l\'enregistrement')
      }

      const data = await res.json()
      toast.success(existing ? 'Créneau mis à jour' : 'Créneau ajouté')
      onSaved(data.item)
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur inattendue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#823F91] font-bold text-lg">
            {existing ? 'Modifier le créneau' : 'Ajouter un créneau'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">

          {/* Titre */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Titre <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Cérémonie civile, Vin d'honneur..."
              required
            />
          </div>

          {/* Horaires */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start_time">Heure de début <span className="text-red-500">*</span></Label>
              <Input
                id="start_time"
                type="time"
                value={form.start_time}
                onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_time">Heure de fin</Label>
              <Input
                id="end_time"
                type="time"
                value={form.end_time ?? ''}
                onChange={e => setForm(p => ({ ...p, end_time: e.target.value || null }))}
              />
            </div>
          </div>

          {/* Catégorie */}
          <div className="space-y-1.5">
            <Label>Catégorie</Label>
            <Select
              value={form.category}
              onValueChange={v => setForm(p => ({ ...p, category: v as ProgramCategory }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(CATEGORY_LABELS) as [ProgramCategory, string][]).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lieu */}
          <div className="space-y-1.5">
            <Label htmlFor="location">Lieu</Label>
            <Input
              id="location"
              value={form.location ?? ''}
              onChange={e => setForm(p => ({ ...p, location: e.target.value || null }))}
              placeholder="Salle des fêtes, Mairie de Paris..."
            />
          </div>

          {/* Responsable */}
          <div className="space-y-1.5">
            <Label htmlFor="responsible">Responsable</Label>
            <Input
              id="responsible"
              value={form.responsible ?? ''}
              onChange={e => setForm(p => ({ ...p, responsible: e.target.value || null }))}
              placeholder="Nom du témoin, du wedding planner..."
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description / Notes</Label>
            <Textarea
              id="description"
              value={form.description ?? ''}
              onChange={e => setForm(p => ({ ...p, description: e.target.value || null }))}
              placeholder="Détails, informations pour les prestataires..."
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#823F91] hover:bg-[#6D3478] text-white"
            >
              {saving ? 'Enregistrement...' : existing ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
