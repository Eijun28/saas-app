'use client'

import { useState } from 'react'
import {
  ChevronUp, ChevronDown, Heart, MapPin, Mail, Phone,
  MoreHorizontal, Trash2, MessageCircle, ExternalLink,
} from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { CRMStatusBadge } from './CRMStatusBadge'
import { InlineEditableCell } from './InlineEditableCell'
import { CRM_STATUSES, STATUS_CONFIG, SOURCE_LABELS } from './CRMTypes'
import type { CRMContact, CRMStatus } from './CRMTypes'

export type SortField = 'name' | 'status' | 'wedding_date' | 'created_at' | 'budget' | 'source'
export type SortDirection = 'asc' | 'desc'

interface CRMTableViewProps {
  contacts: CRMContact[]
  selectedId: string | null
  onSelect: (contact: CRMContact) => void
  onUpdate: (id: string, field: string, value: unknown) => void
  onDelete: (id: string) => void
  sort: { field: SortField; direction: SortDirection }
  onSort: (field: SortField) => void
}

function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `il y a ${days}j`
  if (days < 30) return `il y a ${Math.floor(days / 7)}sem`
  return formatDate(d)
}

function SortHeader({ label, field, sort, onSort, className }: { label: string; field: SortField; sort: { field: SortField; direction: SortDirection }; onSort: (f: SortField) => void; className?: string }) {
  const active = sort.field === field
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        'flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider hover:text-gray-700 transition-colors whitespace-nowrap',
        active ? 'text-gray-700' : 'text-gray-400',
        className
      )}
    >
      {label}
      {active && (sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
    </button>
  )
}

export function CRMTableView({ contacts, selectedId, onSelect, onUpdate, onDelete, sort, onSort }: CRMTableViewProps) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Desktop header */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_100px_110px_90px_80px_90px_36px] gap-3 px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 items-center">
        <SortHeader label="Nom" field="name" sort={sort} onSort={onSort} />
        <SortHeader label="Statut" field="status" sort={sort} onSort={onSort} />
        <SortHeader label="Mariage" field="wedding_date" sort={sort} onSort={onSort} />
        <SortHeader label="Budget" field="budget" sort={sort} onSort={onSort} />
        <SortHeader label="Source" field="source" sort={sort} onSort={onSort} />
        <SortHeader label="Ajoute" field="created_at" sort={sort} onSort={onSort} />
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {contacts.map(contact => {
          const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Sans nom'
          return (
            <div
              key={contact.id}
              className={cn(
                'group',
                selectedId === contact.id && 'bg-[#823F91]/[0.03]'
              )}
            >
              {/* Mobile layout */}
              <div className="lg:hidden px-4 py-3 space-y-2">
                <button onClick={() => onSelect(contact)} className="w-full text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-gray-900 truncate">{fullName}</span>
                    <CRMStatusBadge status={contact.status} />
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                    {contact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</span>}
                    {contact.wedding_date && <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{formatDate(contact.wedding_date)}</span>}
                    {contact.wedding_location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{contact.wedding_location}</span>}
                  </div>
                  {contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {contact.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">{tag}</span>
                      ))}
                    </div>
                  )}
                </button>
              </div>

              {/* Desktop layout */}
              <div className="hidden lg:grid lg:grid-cols-[1fr_100px_110px_90px_80px_90px_36px] gap-3 px-4 py-2.5 items-center hover:bg-gray-50/50 transition-colors">
                {/* Name - clickable */}
                <button onClick={() => onSelect(contact)} className="text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 truncate">{fullName}</span>
                    {contact.source === 'nuply_request' && (
                      <span className="px-1 py-0.5 bg-[#823F91]/10 text-[#823F91] rounded text-[9px] font-semibold flex-shrink-0">N</span>
                    )}
                  </div>
                  {(contact.email || contact.phone) && (
                    <div className="flex gap-2 text-[11px] text-gray-400 mt-0.5">
                      {contact.email && <span className="truncate">{contact.email}</span>}
                      {contact.phone && <span>{contact.phone}</span>}
                    </div>
                  )}
                  {contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {contact.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-1 py-0 bg-gray-100 text-gray-500 rounded text-[9px] font-medium">{tag}</span>
                      ))}
                      {contact.tags.length > 3 && <span className="text-[9px] text-gray-400">+{contact.tags.length - 3}</span>}
                    </div>
                  )}
                </button>

                {/* Status - inline editable */}
                <Select
                  value={contact.status}
                  onValueChange={(v: string) => onUpdate(contact.id, 'status', v)}
                >
                  <SelectTrigger className="h-7 text-[11px] border-0 bg-transparent hover:bg-gray-100 rounded-md p-1 w-auto">
                    <CRMStatusBadge status={contact.status} />
                  </SelectTrigger>
                  <SelectContent>
                    {CRM_STATUSES.map(s => (
                      <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Wedding date */}
                <InlineEditableCell
                  value={contact.wedding_date || ''}
                  onSave={(v: string) => onUpdate(contact.id, 'wedding_date', v || null)}
                  type="date"
                  className="text-xs text-gray-500"
                />

                {/* Budget */}
                <InlineEditableCell
                  value={contact.budget ? String(contact.budget) : ''}
                  onSave={(v: string) => onUpdate(contact.id, 'budget', v ? parseInt(v, 10) : null)}
                  type="number"
                  placeholder="-"
                  className="text-xs text-gray-500"
                />

                {/* Source */}
                <span className="text-[11px] text-gray-400">
                  {SOURCE_LABELS[contact.source]}
                </span>

                {/* Date */}
                <span className="text-[11px] text-gray-400">{formatRelative(contact.created_at)}</span>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-7 w-7 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all">
                    <MoreHorizontal className="h-3.5 w-3.5 text-gray-400" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onDelete(contact.id)}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </div>

      {contacts.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-gray-400">Aucun contact</p>
        </div>
      )}
    </div>
  )
}
