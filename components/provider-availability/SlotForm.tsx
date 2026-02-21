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
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { AvailabilitySlot, CreateAvailabilityInput, AvailabilityStatus } from '@/types/provider-availability'
import { STATUS_CONFIG } from '@/types/provider-availability'

interface SlotFormProps {
  open:      boolean
  onClose:   () => void
  onSaved:   (slot: AvailabilitySlot) => void
  existing?: AvailabilitySlot | null
  /** Date pré-remplie (clic sur un jour du calendrier) */
  defaultDate?: string
}

const EMPTY: CreateAvailabilityInput = {
  start_date: '',
  end_date:   '',
  status:     'unavailable',
  note:       null,
  is_public:  true,
}

export function SlotForm({ open, onClose, onSaved, existing, defaultDate }: SlotFormProps) {
  const [form, setForm]     = useState<CreateAvailabilityInput>(EMPTY)
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (existing) {
      setForm({
        start_date: existing.start_date,
        end_date:   existing.end_date,
        status:     existing.status,
        note:       existing.note,
        is_public:  existing.is_public,
      })
    } else {
      const d = defaultDate ?? today
      setForm({ ...EMPTY, start_date: d, end_date: d })
    }
  }, [existing, defaultDate, open, today])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.start_date) { toast.error('La date de début est requise'); return }
    if (!form.end_date)   { toast.error('La date de fin est requise');   return }
    if (form.end_date < form.start_date) {
      toast.error('La date de fin doit être égale ou postérieure à la date de début')
      return
    }

    setSaving(true)
    try {
      const url    = existing ? `/api/provider-availability/${existing.id}` : '/api/provider-availability'
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
      toast.success(existing ? 'Créneau mis à jour' : 'Créneau bloqué')
      onSaved(data.slot)
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur inattendue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#823F91] font-bold text-lg">
            {existing ? 'Modifier la disponibilité' : 'Bloquer une période'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Du <span className="text-red-500">*</span></Label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date}
                min={today}
                onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_date">Au <span className="text-red-500">*</span></Label>
              <Input
                id="end_date"
                type="date"
                value={form.end_date}
                min={form.start_date || today}
                onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Statut */}
          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select
              value={form.status}
              onValueChange={v => setForm(p => ({ ...p, status: v as AvailabilityStatus }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(STATUS_CONFIG) as [AvailabilityStatus, typeof STATUS_CONFIG[AvailabilityStatus]][]).map(([k, cfg]) => (
                  <SelectItem key={k} value={k}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                      {cfg.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[12px] text-gray-400">
              {form.status === 'unavailable'
                ? 'Vous êtes certain·e de ne pas être disponible (mariage confirmé, congés…)'
                : 'Vous avez posé une option mais rien n\'est encore signé'}
            </p>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optionnelle)</Label>
            <Textarea
              id="note"
              value={form.note ?? ''}
              onChange={e => setForm(p => ({ ...p, note: e.target.value || null }))}
              placeholder="Mariage Dupont, Vacances en famille..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Visibilité */}
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div>
              <p className="text-[13px] font-medium text-gray-700">Visible publiquement</p>
              <p className="text-[12px] text-gray-400">
                Les couples voient cette période comme indisponible
              </p>
            </div>
            <Switch
              checked={form.is_public ?? true}
              onCheckedChange={v => setForm(p => ({ ...p, is_public: v }))}
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
              {saving ? 'Enregistrement...' : existing ? 'Mettre à jour' : 'Bloquer cette période'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
