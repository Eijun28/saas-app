'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { CRM_STATUSES, STATUS_CONFIG } from './CRMTypes'
import type { CRMContact } from './CRMTypes'

interface AddContactDialogProps {
  open: boolean
  onClose: () => void
  onAdded: (contact: CRMContact) => void
}

export function AddContactDialog({ open, onClose, onAdded }: AddContactDialogProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    wedding_date: '',
    wedding_location: '',
    budget: '',
    status: 'lead' as string,
    notes: '',
    tags: '',
  })

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.first_name.trim()) {
      toast.error('Le prenom est requis')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/prestataire/crm-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          wedding_date: form.wedding_date || undefined,
          wedding_location: form.wedding_location.trim() || undefined,
          budget: form.budget ? parseInt(form.budget, 10) : undefined,
          status: form.status,
          notes: form.notes.trim(),
          tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Erreur')
        return
      }
      toast.success('Contact ajoute')
      onAdded(json.contact)
      onClose()
      setForm({ first_name: '', last_name: '', email: '', phone: '', wedding_date: '', wedding_location: '', budget: '', status: 'lead', notes: '', tags: '' })
    } catch {
      toast.error('Erreur reseau')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent size="lg" className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un contact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="first_name" className="text-xs text-gray-500 mb-1">Prenom *</Label>
              <Input
                id="first_name"
                value={form.first_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('first_name', e.target.value)}
                placeholder="Marie"
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor="last_name" className="text-xs text-gray-500 mb-1">Nom</Label>
              <Input
                id="last_name"
                value={form.last_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('last_name', e.target.value)}
                placeholder="Dupont"
                className="h-9"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email" className="text-xs text-gray-500 mb-1">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('email', e.target.value)}
                placeholder="marie@example.com"
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-xs text-gray-500 mb-1">Telephone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('phone', e.target.value)}
                placeholder="06 12 34 56 78"
                className="h-9"
              />
            </div>
          </div>

          {/* Mariage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="wedding_date" className="text-xs text-gray-500 mb-1">Date mariage</Label>
              <Input
                id="wedding_date"
                type="date"
                value={form.wedding_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('wedding_date', e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor="wedding_location" className="text-xs text-gray-500 mb-1">Lieu</Label>
              <Input
                id="wedding_location"
                value={form.wedding_location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('wedding_location', e.target.value)}
                placeholder="Paris"
                className="h-9"
              />
            </div>
          </div>

          {/* Budget + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="budget" className="text-xs text-gray-500 mb-1">Budget (EUR)</Label>
              <Input
                id="budget"
                type="number"
                value={form.budget}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('budget', e.target.value)}
                placeholder="3000"
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1">Statut</Label>
              <Select value={form.status} onValueChange={(v: string) => update('status', v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRM_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags" className="text-xs text-gray-500 mb-1">Tags (separes par virgule)</Label>
            <Input
              id="tags"
              value={form.tags}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('tags', e.target.value)}
              placeholder="VIP, mariage champetre"
              className="h-9"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-xs text-gray-500 mb-1">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('notes', e.target.value)}
              placeholder="Notes sur ce contact..."
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} className="h-9">
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="h-9 bg-[#823F91] hover:bg-[#6D3478]">
              {saving ? 'Ajout...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
