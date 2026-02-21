'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Pencil, Trash2, MoreHorizontal, Eye, EyeOff } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { AvailabilityStatusBadge } from './AvailabilityStatusBadge'
import { SlotForm } from './SlotForm'
import type { AvailabilitySlot } from '@/types/provider-availability'
import { formatDateRange, slotDurationDays } from '@/types/provider-availability'

interface SlotListProps {
  slots:     AvailabilitySlot[]
  onUpdated: (slot: AvailabilitySlot) => void
  onDeleted: (id: string) => void
}

export function SlotList({ slots, onUpdated, onDeleted }: SlotListProps) {
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null)
  const [deletingId, setDeletingId]   = useState<string | null>(null)

  async function handleDelete(slot: AvailabilitySlot) {
    if (!confirm(`Supprimer la période "${formatDateRange(slot.start_date, slot.end_date)}" ?`)) return
    setDeletingId(slot.id)
    try {
      const res = await fetch(`/api/provider-availability/${slot.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      onDeleted(slot.id)
      toast.success('Période supprimée')
    } catch {
      toast.error('Impossible de supprimer cette période')
    } finally {
      setDeletingId(null)
    }
  }

  if (slots.length === 0) {
    return (
      <p className="text-center text-sm text-gray-400 py-6">
        Aucune période bloquée — vous apparaissez disponible sur toute l'année
      </p>
    )
  }

  // Grouper par année
  const byYear = slots.reduce<Record<string, AvailabilitySlot[]>>((acc, s) => {
    const y = s.start_date.slice(0, 4)
    ;(acc[y] ??= []).push(s)
    return acc
  }, {})

  return (
    <>
      <div className="space-y-6">
        {Object.entries(byYear)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([year, yearSlots]) => (
            <div key={year}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{year}</p>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {yearSlots.map(slot => {
                    const days = slotDurationDays(slot.start_date, slot.end_date)
                    return (
                      <motion.div
                        key={slot.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.18 }}
                        className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3.5 group hover:shadow-sm transition-shadow"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <AvailabilityStatusBadge status={slot.status} />
                            {!slot.is_public && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                                <EyeOff className="h-3 w-3" /> Privé
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] font-medium text-gray-800 truncate">
                            {formatDateRange(slot.start_date, slot.end_date)}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {days} jour{days > 1 ? 's' : ''}
                            {slot.note && ` · ${slot.note}`}
                          </p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => setEditingSlot(slot)}
                              className="text-[13px] gap-2"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Modifier
                            </DropdownMenuItem>
                            {slot.is_public ? (
                              <DropdownMenuItem
                                className="text-[13px] gap-2 text-gray-500"
                                onClick={async () => {
                                  const res = await fetch(`/api/provider-availability/${slot.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ is_public: false }),
                                  })
                                  if (res.ok) { const d = await res.json(); onUpdated(d.slot); toast.success('Masqué') }
                                }}
                              >
                                <EyeOff className="h-3.5 w-3.5" /> Rendre privé
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-[13px] gap-2 text-gray-500"
                                onClick={async () => {
                                  const res = await fetch(`/api/provider-availability/${slot.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ is_public: true }),
                                  })
                                  if (res.ok) { const d = await res.json(); onUpdated(d.slot); toast.success('Rendu public') }
                                }}
                              >
                                <Eye className="h-3.5 w-3.5" /> Rendre public
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(slot)}
                              disabled={deletingId === slot.id}
                              className="text-[13px] gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {deletingId === slot.id ? 'Suppression...' : 'Supprimer'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
      </div>

      <SlotForm
        open={!!editingSlot}
        onClose={() => setEditingSlot(null)}
        onSaved={updated => { onUpdated(updated); setEditingSlot(null) }}
        existing={editingSlot}
      />
    </>
  )
}
