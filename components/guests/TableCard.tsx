'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, UserMinus, UserPlus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { RSVP_COLORS } from '@/types/guest'
import type { ReceptionTable, Guest } from '@/types/guest'

// ─── Forme visuelle de la table ───────────────────────────────────────────────

function TableShape({
  shape,
  capacity,
  occupied,
}: {
  shape: ReceptionTable['shape']
  capacity: number
  occupied: number
}) {
  const pct   = capacity > 0 ? Math.min(occupied / capacity, 1) : 0
  const color  = pct >= 1 ? '#ef4444' : pct >= 0.8 ? '#f59e0b' : '#823F91'

  const baseClass = 'flex items-center justify-center transition-all duration-300 bg-white border-2 shadow-sm'

  const shapeClass =
    shape === 'round'
      ? 'rounded-full w-16 h-16'
      : shape === 'oval'
      ? 'rounded-[50%] w-20 h-12'
      : 'rounded-xl w-20 h-12'

  return (
    <div
      className={cn(baseClass, shapeClass)}
      style={{ borderColor: color }}
    >
      <span className="text-[11px] font-bold" style={{ color }}>
        {occupied}/{capacity}
      </span>
    </div>
  )
}

// ─── Mini pastille invité ──────────────────────────────────────────────────────

function GuestPill({
  guest,
  onRemove,
}: {
  guest: Pick<Guest, 'id' | 'first_name' | 'last_name' | 'rsvp_status' | 'plus_one' | 'plus_one_name'>
  onRemove: (id: string) => void
}) {
  const initials = `${guest.first_name[0] ?? ''}${(guest.last_name?.[0] ?? '')}`.toUpperCase()
  const rsvpClass = RSVP_COLORS[guest.rsvp_status]

  return (
    <div className={cn(
      'group flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border',
      rsvpClass
    )}>
      <span className="font-semibold">{initials}</span>
      <span className="truncate max-w-[80px]">
        {guest.first_name}{guest.last_name ? ` ${guest.last_name}` : ''}
      </span>
      {guest.plus_one && (
        <span className="opacity-60">+1</span>
      )}
      <button
        type="button"
        onClick={() => onRemove(guest.id)}
        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-current hover:scale-110"
        aria-label={`Retirer ${guest.first_name}`}
      >
        <UserMinus className="h-3 w-3" />
      </button>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

type TableGuest = Pick<Guest,
  'id' | 'first_name' | 'last_name' | 'rsvp_status' |
  'dietary_restrictions' | 'plus_one' | 'plus_one_name' |
  'table_number' | 'side' | 'category'
>

interface TableCardProps {
  table: ReceptionTable & { guests: TableGuest[] }
  unassigned: TableGuest[]
  onEdit: (table: ReceptionTable) => void
  onDelete: (id: string) => void
  onAssign:   (guestId: string, tableNumber: number) => Promise<void>
  onUnassign: (guestId: string) => Promise<void>
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function TableCard({
  table,
  unassigned,
  onEdit,
  onDelete,
  onAssign,
  onUnassign,
}: TableCardProps) {
  const [showAssign, setShowAssign] = useState(false)
  const occupied  = table.guests.length + table.guests.filter(g => g.plus_one).length
  const isFull    = occupied >= table.capacity

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 space-y-3 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-900">
              Table {table.table_number}
            </span>
            {table.table_name && (
              <span className="text-xs text-gray-500 truncate">
                — {table.table_name}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5 capitalize">
            {table.shape === 'round' ? 'Ronde' : table.shape === 'rectangular' ? 'Rectangulaire' : 'Ovale'}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
              aria-label="Options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onEdit(table)} className="gap-2 text-[13px]">
              <Pencil className="h-3.5 w-3.5" /> Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(table.id)}
              className="gap-2 text-[13px] text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Visuel table */}
      <div className="flex justify-center py-1">
        <TableShape shape={table.shape} capacity={table.capacity} occupied={occupied} />
      </div>

      {/* Invités */}
      <div className="flex-1 min-h-[48px]">
        {table.guests.length === 0 ? (
          <p className="text-[11px] text-gray-300 text-center py-2">Aucun invité</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {table.guests.map((g) => (
              <GuestPill
                key={g.id}
                guest={g}
                onRemove={onUnassign}
              />
            ))}
          </div>
        )}
      </div>

      {/* Ajouter un invité */}
      {!isFull && unassigned.length > 0 && (
        <div className="pt-1 border-t border-gray-50">
          {!showAssign ? (
            <button
              type="button"
              onClick={() => setShowAssign(true)}
              className="w-full text-[11px] font-medium text-[#823F91] hover:text-[#6D3478] flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-[#823F91]/5 transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Assigner un invité
            </button>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Choisir un invité
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1 pr-0.5">
                {unassigned.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={async () => {
                      await onAssign(g.id, table.table_number)
                      setShowAssign(false)
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-[12px] rounded-lg hover:bg-[#823F91]/5 text-gray-700 hover:text-[#823F91] transition-colors flex items-center gap-2"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#E8D4EF] text-[#823F91] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {g.first_name[0]?.toUpperCase()}
                    </span>
                    {g.first_name} {g.last_name}
                    {g.plus_one && <Badge variant="outline" className="ml-auto text-[9px] py-0 px-1">+1</Badge>}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowAssign(false)}
                className="w-full text-[11px] text-gray-400 hover:text-gray-600 py-1"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      )}

      {isFull && (
        <div className="pt-1 border-t border-gray-50">
          <p className="text-[11px] text-center text-red-400 font-medium">Table complète</p>
        </div>
      )}
    </div>
  )
}
