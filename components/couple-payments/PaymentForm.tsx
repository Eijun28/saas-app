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
import type {
  CouplePayment,
  CreatePaymentInput,
  PaymentCategory,
  PaymentMethod,
} from '@/types/couple-payments'
import { CATEGORY_LABELS, METHOD_LABELS } from '@/types/couple-payments'

interface PaymentFormProps {
  open:      boolean
  onClose:   () => void
  onSaved:   (payment: CouplePayment) => void
  existing?: CouplePayment | null
}

const EMPTY: CreatePaymentInput = {
  provider_name: '',
  label:         'Acompte',
  category:      'autre',
  amount_total:  0,
  amount_paid:   0,
  due_date:      null,
  paid_date:     null,
  method:        'virement',
  reference:     null,
  notes:         null,
}

export function PaymentForm({ open, onClose, onSaved, existing }: PaymentFormProps) {
  const [form, setForm]     = useState<CreatePaymentInput>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existing) {
      setForm({
        provider_name: existing.provider_name,
        label:         existing.label,
        category:      existing.category,
        amount_total:  existing.amount_total,
        amount_paid:   existing.amount_paid,
        due_date:      existing.due_date,
        paid_date:     existing.paid_date,
        method:        existing.method,
        reference:     existing.reference,
        notes:         existing.notes,
      })
    } else {
      setForm(EMPTY)
    }
  }, [existing, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.provider_name.trim()) { toast.error('Le prestataire est requis'); return }
    if (!form.label.trim())         { toast.error('Le libellé est requis');     return }
    if (form.amount_total < 0)      { toast.error('Le montant doit être positif'); return }
    if ((form.amount_paid ?? 0) > form.amount_total) {
      toast.error('Le montant réglé ne peut pas dépasser le montant total')
      return
    }

    setSaving(true)
    try {
      const url    = existing ? `/api/couple-payments/${existing.id}` : '/api/couple-payments'
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
      toast.success(existing ? 'Paiement mis à jour' : 'Paiement ajouté')
      onSaved(data.payment)
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur inattendue')
    } finally {
      setSaving(false)
    }
  }

  const isFullyPaid = (form.amount_paid ?? 0) >= form.amount_total && form.amount_total > 0

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#823F91] font-bold text-lg">
            {existing ? 'Modifier le paiement' : 'Ajouter un paiement'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">

          {/* Prestataire + Libellé */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="provider_name">Prestataire <span className="text-red-500">*</span></Label>
              <Input
                id="provider_name"
                value={form.provider_name}
                onChange={e => setForm(p => ({ ...p, provider_name: e.target.value }))}
                placeholder="Photographe Dupont…"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="label">Libellé <span className="text-red-500">*</span></Label>
              <Input
                id="label"
                value={form.label}
                onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                placeholder="Acompte 30%, Solde…"
                required
              />
            </div>
          </div>

          {/* Catégorie */}
          <div className="space-y-1.5">
            <Label>Catégorie</Label>
            <Select
              value={form.category}
              onValueChange={v => setForm(p => ({ ...p, category: v as PaymentCategory }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(CATEGORY_LABELS) as [PaymentCategory, string][]).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Montants */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount_total">Montant total (€) <span className="text-red-500">*</span></Label>
              <Input
                id="amount_total"
                type="number"
                min="0"
                step="0.01"
                value={form.amount_total === 0 ? '' : form.amount_total}
                onChange={e => setForm(p => ({ ...p, amount_total: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount_paid">Montant réglé (€)</Label>
              <Input
                id="amount_paid"
                type="number"
                min="0"
                step="0.01"
                max={form.amount_total}
                value={form.amount_paid === 0 ? '' : form.amount_paid}
                onChange={e => setForm(p => ({ ...p, amount_paid: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Raccourci "Tout payer" */}
          {!isFullyPaid && form.amount_total > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => setForm(p => ({
                ...p,
                amount_paid: p.amount_total,
                paid_date:   p.paid_date ?? new Date().toISOString().slice(0, 10),
              }))}
            >
              Marquer comme entièrement payé
            </Button>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="due_date">Échéance</Label>
              <Input
                id="due_date"
                type="date"
                value={form.due_date ?? ''}
                onChange={e => setForm(p => ({ ...p, due_date: e.target.value || null }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paid_date">Date de paiement</Label>
              <Input
                id="paid_date"
                type="date"
                value={form.paid_date ?? ''}
                onChange={e => setForm(p => ({ ...p, paid_date: e.target.value || null }))}
              />
            </div>
          </div>

          {/* Mode de paiement + Référence */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Mode de paiement</Label>
              <Select
                value={form.method}
                onValueChange={v => setForm(p => ({ ...p, method: v as PaymentMethod }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(METHOD_LABELS) as [PaymentMethod, string][]).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reference">Référence / N° facture</Label>
              <Input
                id="reference"
                value={form.reference ?? ''}
                onChange={e => setForm(p => ({ ...p, reference: e.target.value || null }))}
                placeholder="FAC-2024-001"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes ?? ''}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value || null }))}
              placeholder="Informations complémentaires…"
              rows={2}
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
