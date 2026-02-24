'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import type { Guest, CreateGuestInput } from '@/types/guest'
import {
  DIETARY_OPTIONS,
  SIDE_LABELS,
  CATEGORY_LABELS,
  RSVP_LABELS,
} from '@/types/guest'

interface GuestFormProps {
  open: boolean
  onClose: () => void
  onSaved: (guest: Guest) => void
  /** Si fourni, on est en mode édition */
  existing?: Guest | null
}

const EMPTY_FORM: CreateGuestInput = {
  first_name:           '',
  last_name:            '',
  email:                null,
  phone:                null,
  side:                 'commun',
  category:             'autre',
  dietary_restrictions: [],
  plus_one:             false,
  plus_one_name:        null,
  table_number:         null,
  notes:                null,
}

export function GuestForm({ open, onClose, onSaved, existing }: GuestFormProps) {
  const [form, setForm]       = useState<CreateGuestInput>(EMPTY_FORM)
  const [rsvp, setRsvp]       = useState<string>('pending')
  const [saving, setSaving]   = useState(false)

  // Charger les données si mode édition
  useEffect(() => {
    if (existing) {
      setForm({
        first_name:           existing.first_name,
        last_name:            existing.last_name,
        email:                existing.email,
        phone:                existing.phone,
        side:                 existing.side,
        category:             existing.category,
        dietary_restrictions: existing.dietary_restrictions ?? [],
        plus_one:             existing.plus_one,
        plus_one_name:        existing.plus_one_name,
        table_number:         existing.table_number,
        notes:                existing.notes,
      })
      setRsvp(existing.rsvp_status)
    } else {
      setForm(EMPTY_FORM)
      setRsvp('pending')
    }
  }, [existing, open])

  function toggleDietary(option: string) {
    setForm(prev => {
      const current = prev.dietary_restrictions ?? []
      return {
        ...prev,
        dietary_restrictions: current.includes(option)
          ? current.filter(d => d !== option)
          : [...current, option],
      }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name.trim()) {
      toast.error('Le prénom est requis')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        ...(existing ? { rsvp_status: rsvp } : {}),
      }

      const url    = existing ? `/api/guests/${existing.id}` : '/api/guests'
      const method = existing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erreur lors de l\'enregistrement')
      }

      const data = await res.json()
      toast.success(existing ? 'Invité mis à jour' : 'Invité ajouté')
      onSaved(data.guest)
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
            {existing ? 'Modifier l\'invité' : 'Ajouter un invité'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {existing ? 'Modifier les informations de l\'invité' : 'Ajouter un nouvel invité à la liste'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">

          {/* Prénom / Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">Prénom <span className="text-red-500">*</span></Label>
              <Input
                id="first_name"
                value={form.first_name}
                onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
                placeholder="Marie"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Nom</Label>
              <Input
                id="last_name"
                value={form.last_name ?? ''}
                onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
                placeholder="Dupont"
              />
            </div>
          </div>

          {/* Email / Téléphone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email ?? ''}
                onChange={e => setForm(p => ({ ...p, email: e.target.value || null }))}
                placeholder="marie@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone ?? ''}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value || null }))}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>

          {/* Côté / Catégorie */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Côté</Label>
              <Select
                value={form.side}
                onValueChange={v => setForm(p => ({ ...p, side: v as typeof p.side }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(SIDE_LABELS) as [string, string][]).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select
                value={form.category}
                onValueChange={v => setForm(p => ({ ...p, category: v as typeof p.category }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(CATEGORY_LABELS) as [string, string][]).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* RSVP (mode édition uniquement) */}
          {existing && (
            <div className="space-y-1.5">
              <Label>Statut RSVP</Label>
              <Select value={rsvp} onValueChange={setRsvp}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(RSVP_LABELS) as [string, string][]).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Table */}
          <div className="space-y-1.5">
            <Label htmlFor="table_number">Numéro de table</Label>
            <Input
              id="table_number"
              type="number"
              min={1}
              value={form.table_number ?? ''}
              onChange={e => setForm(p => ({
                ...p,
                table_number: e.target.value ? parseInt(e.target.value) : null,
              }))}
              placeholder="Laisser vide si non assigné"
            />
          </div>

          {/* +1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="plus_one"
                checked={form.plus_one}
                onCheckedChange={v => setForm(p => ({ ...p, plus_one: !!v, plus_one_name: v ? p.plus_one_name : null }))}
              />
              <Label htmlFor="plus_one" className="cursor-pointer">Accompagné(e) d'un +1</Label>
            </div>
            {form.plus_one && (
              <Input
                value={form.plus_one_name ?? ''}
                onChange={e => setForm(p => ({ ...p, plus_one_name: e.target.value || null }))}
                placeholder="Nom de l'accompagnant(e)"
                className="ml-6"
              />
            )}
          </div>

          {/* Restrictions alimentaires */}
          <div className="space-y-2">
            <Label>Restrictions alimentaires</Label>
            <div className="grid grid-cols-2 gap-2">
              {DIETARY_OPTIONS.map(option => (
                <div key={option} className="flex items-center gap-2">
                  <Checkbox
                    id={`diet-${option}`}
                    checked={(form.dietary_restrictions ?? []).includes(option)}
                    onCheckedChange={() => toggleDietary(option)}
                  />
                  <Label htmlFor={`diet-${option}`} className="text-sm cursor-pointer font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes ?? ''}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value || null }))}
              placeholder="Informations complémentaires..."
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
