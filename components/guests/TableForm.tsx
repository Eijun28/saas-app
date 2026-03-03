'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { ReceptionTable } from '@/types/guest'

interface TableFormProps {
  open: boolean
  onClose: () => void
  onSaved: (table: ReceptionTable) => void
  existingTable?: ReceptionTable | null
  /** Liste des numéros déjà pris (pour éviter les doublons) */
  usedNumbers?: number[]
}

export function TableForm({ open, onClose, onSaved, existingTable, usedNumbers = [] }: TableFormProps) {
  const [tableNumber, setTableNumber] = useState(existingTable?.table_number?.toString() ?? '')
  const [tableName,   setTableName]   = useState(existingTable?.table_name   ?? '')
  const [capacity,    setCapacity]    = useState(existingTable?.capacity?.toString() ?? '8')
  const [shape,       setShape]       = useState<ReceptionTable['shape']>(existingTable?.shape ?? 'round')
  const [notes,       setNotes]       = useState(existingTable?.notes ?? '')
  const [saving,      setSaving]      = useState(false)

  const isEditing = !!existingTable

  // Réinitialiser au changement d'existingTable
  useEffect(() => {
    setTableNumber(existingTable?.table_number?.toString() ?? '')
    setTableName(existingTable?.table_name ?? '')
    setCapacity(existingTable?.capacity?.toString() ?? '8')
    setShape(existingTable?.shape ?? 'round')
    setNotes(existingTable?.notes ?? '')
  }, [existingTable])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = parseInt(tableNumber, 10)
    if (!tableNumber || isNaN(num) || num < 1) {
      toast.error('Numéro de table invalide')
      return
    }
    const cap = parseInt(capacity, 10)
    if (!capacity || isNaN(cap) || cap < 1 || cap > 50) {
      toast.error('Capacité invalide (1-50)')
      return
    }
    // Check doublon (sauf si on édite la même table)
    if (!isEditing && usedNumbers.includes(num)) {
      toast.error(`La table n°${num} existe déjà`)
      return
    }

    setSaving(true)
    try {
      const url    = isEditing ? `/api/guests/tables/${existingTable!.id}` : '/api/guests/tables'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_number: num,
          table_name:   tableName.trim() || null,
          capacity:     cap,
          shape,
          notes: notes.trim() || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Erreur lors de la sauvegarde')
        return
      }

      toast.success(isEditing ? 'Table modifiée' : 'Table créée')
      onSaved(json.table as ReceptionTable)
      onClose()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier la table' : 'Nouvelle table'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="table_number">Numéro *</Label>
              <Input
                id="table_number"
                type="number"
                min={1}
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="1"
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacity">Capacité *</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={50}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="8"
                className="rounded-xl"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="table_name">Nom de la table (facultatif)</Label>
            <Input
              id="table_name"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="ex: Table des mariés, Table Provence…"
              className="rounded-xl"
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Forme</Label>
            <Select value={shape} onValueChange={(v) => setShape(v as ReceptionTable['shape'])}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="round">Ronde</SelectItem>
                <SelectItem value="rectangular">Rectangulaire</SelectItem>
                <SelectItem value="oval">Ovale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (facultatif)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Emplacement, remarques…"
              rows={2}
              className="resize-none rounded-xl"
              maxLength={500}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-[#823F91] hover:bg-[#6D3478]"
            >
              {saving ? 'Sauvegarde…' : isEditing ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
