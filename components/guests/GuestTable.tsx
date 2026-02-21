'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Users,
  Plus,
  Loader2,
  Link2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RsvpBadge } from './RsvpBadge'
import { GuestForm } from './GuestForm'
import type { Guest, RsvpStatus, GuestSide, GuestCategory } from '@/types/guest'
import { CATEGORY_LABELS, SIDE_LABELS, RSVP_LABELS } from '@/types/guest'
import { cn } from '@/lib/utils'

interface GuestTableProps {
  guests: Guest[]
  onAdded: (guest: Guest) => void
  onUpdated: (guest: Guest) => void
  onDeleted: (id: string) => void
}

const RSVP_OPTIONS: RsvpStatus[] = ['confirmed', 'maybe', 'declined', 'pending']

// ─── Inline Add Row (style Notion) ───────────────────────────────────────────

function InlineAddRow({ onSaved }: { onSaved: (guest: Guest) => void }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name:  '',
    side:       'commun' as GuestSide,
    category:   'famille' as GuestCategory,
  })
  const [saving, setSaving] = useState(false)
  const firstRef = useRef<HTMLInputElement>(null)

  async function save() {
    if (!form.first_name.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/guests', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success(`${form.first_name} ajouté(e) ✓`)
      onSaved(data.guest)
      setForm({ first_name: '', last_name: '', side: 'commun', category: 'famille' })
      firstRef.current?.focus()
    } catch {
      toast.error("Impossible d'ajouter l'invité")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-3 border-t border-dashed border-[#823F91]/15 bg-purple-50/30">
      <Input
        ref={firstRef}
        value={form.first_name}
        onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
        placeholder="Prénom *"
        className="h-8 text-[13px] border-gray-200 rounded-lg bg-white"
        onKeyDown={e => { if (e.key === 'Enter') save() }}
      />
      <Input
        value={form.last_name}
        onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
        placeholder="Nom de famille"
        className="h-8 text-[13px] border-gray-200 rounded-lg bg-white"
        onKeyDown={e => { if (e.key === 'Enter') save() }}
      />
      <Select value={form.side} onValueChange={v => setForm(p => ({ ...p, side: v as GuestSide }))}>
        <SelectTrigger className="h-8 text-[13px] rounded-lg border-gray-200 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(SIDE_LABELS) as [GuestSide, string][]).map(([k, label]) => (
            <SelectItem key={k} value={k} className="text-[13px]">{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as GuestCategory }))}>
        <SelectTrigger className="h-8 text-[13px] rounded-lg border-gray-200 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(CATEGORY_LABELS) as [GuestCategory, string][]).map(([k, label]) => (
            <SelectItem key={k} value={k} className="text-[13px]">{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={save}
        disabled={!form.first_name.trim() || saving}
        size="sm"
        className="h-8 w-8 p-0 bg-[#823F91] hover:bg-[#6D3478] text-white rounded-lg"
        aria-label="Ajouter l'invité"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
      </Button>
    </div>
  )
}

// ─── Table principale ─────────────────────────────────────────────────────────

export function GuestTable({ guests, onAdded, onUpdated, onDeleted }: GuestTableProps) {
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [deletingId, setDeletingId]     = useState<string | null>(null)
  const [updatingRsvp, setUpdatingRsvp] = useState<string | null>(null)

  async function handleRsvpChange(guest: Guest, status: RsvpStatus) {
    if (guest.rsvp_status === status) return
    setUpdatingRsvp(guest.id)
    try {
      const res = await fetch(`/api/guests/${guest.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rsvp_status: status }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      onUpdated(data.guest)
      toast.success(`RSVP mis à jour : ${RSVP_LABELS[status]}`)
    } catch {
      toast.error('Impossible de mettre à jour le statut RSVP')
    } finally {
      setUpdatingRsvp(null)
    }
  }

  async function handleDelete(guest: Guest) {
    if (!confirm(`Supprimer ${guest.first_name} ${guest.last_name} de la liste des invités ?`)) return
    setDeletingId(guest.id)
    try {
      const res = await fetch(`/api/guests/${guest.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      onDeleted(guest.id)
      toast.success(`${guest.first_name} supprimé(e)`)
    } catch {
      toast.error("Impossible de supprimer l'invité")
    } finally {
      setDeletingId(null)
    }
  }

  if (guests.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <div className="h-16 w-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-[#823F91]/50" />
          </div>
          <p className="text-gray-500 font-medium">Aucun invité pour le moment</p>
          <p className="text-sm text-gray-400 mt-1 mb-6">Ajoutez directement ci-dessous ou via le bouton en haut</p>
        </div>
        <InlineAddRow onSaved={onAdded} />
      </div>
    )
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
          {['Invité', 'Contact', 'Catégorie', 'Côté', 'RSVP', ''].map(h => (
            <span key={h} className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{h}</span>
          ))}
        </div>

        {/* Rows */}
        <AnimatePresence initial={false}>
          {guests.map((guest, idx) => {
            const fullName = [guest.first_name, guest.last_name].filter(Boolean).join(' ')
            const initials = [guest.first_name[0], guest.last_name?.[0]].filter(Boolean).join('').toUpperCase()
            const isUpdating = updatingRsvp === guest.id

            return (
              <motion.div
                key={guest.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8, height: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.02 }}
                className={cn(
                  'grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center',
                  'border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors duration-100'
                )}
              >
                {/* Nom + +1 */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[13px] font-bold text-[#823F91]">{initials}</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-gray-900">{fullName}</p>
                    {guest.plus_one && (
                      <p className="text-[11px] text-gray-400">
                        +1 {guest.plus_one_name ? `(${guest.plus_one_name})` : ''}
                      </p>
                    )}
                    {guest.table_number && (
                      <p className="text-[11px] text-purple-500 font-medium">Table {guest.table_number}</p>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-0.5">
                  {guest.email && (
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate max-w-[180px]">{guest.email}</span>
                    </div>
                  )}
                  {guest.phone && (
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span>{guest.phone}</span>
                    </div>
                  )}
                  {!guest.email && !guest.phone && (
                    <span className="text-[12px] text-gray-300">–</span>
                  )}
                </div>

                {/* Catégorie */}
                <span className="text-[12px] text-gray-600 hidden md:block">
                  {CATEGORY_LABELS[guest.category]}
                </span>

                {/* Côté */}
                <span className="text-[12px] text-gray-600 hidden md:block">
                  {SIDE_LABELS[guest.side]}
                </span>

                {/* RSVP select inline */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="focus:outline-none"
                        disabled={isUpdating}
                        aria-label="Changer le statut RSVP"
                      >
                        <RsvpBadge status={guest.rsvp_status} className={isUpdating ? 'opacity-50' : 'cursor-pointer hover:opacity-80'} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40">
                      {RSVP_OPTIONS.map(s => (
                        <DropdownMenuItem
                          key={s}
                          onClick={() => handleRsvpChange(guest, s)}
                          className={cn('text-[13px]', guest.rsvp_status === s && 'font-semibold')}
                        >
                          {RSVP_LABELS[s]}
                          {guest.rsvp_status === s && ' ✓'}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-700">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={() => setEditingGuest(guest)} className="text-[13px] gap-2">
                      <Pencil className="h-3.5 w-3.5" /> Modifier
                    </DropdownMenuItem>
                    {/* Lien RSVP (si l'invité a un email ou non) */}
                    <DropdownMenuItem
                      onClick={() => {
                        const url = `${window.location.origin}/rsvp/${guest.id}`
                        navigator.clipboard.writeText(url)
                        toast.success(`Lien RSVP copié pour ${guest.first_name}`)
                      }}
                      className="text-[13px] gap-2 text-[#823F91] focus:text-[#823F91] focus:bg-purple-50"
                    >
                      <Link2 className="h-3.5 w-3.5" /> Copier le lien RSVP
                    </DropdownMenuItem>
                    {/* Changer RSVP (mobile) */}
                    <div className="md:hidden">
                      <DropdownMenuSeparator />
                      {RSVP_OPTIONS.map(s => (
                        <DropdownMenuItem
                          key={s}
                          onClick={() => handleRsvpChange(guest, s)}
                          className={cn('text-[13px]', guest.rsvp_status === s && 'font-semibold text-[#823F91]')}
                        >
                          {RSVP_LABELS[s]}
                        </DropdownMenuItem>
                      ))}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(guest)}
                      disabled={deletingId === guest.id}
                      className="text-[13px] gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Ligne d'ajout rapide style Notion */}
        <InlineAddRow onSaved={onAdded} />
      </div>

      {/* Modal édition */}
      <GuestForm
        open={!!editingGuest}
        onClose={() => setEditingGuest(null)}
        onSaved={updated => {
          onUpdated(updated)
          setEditingGuest(null)
        }}
        existing={editingGuest}
      />
    </>
  )
}
