'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, MessageCircle, StickyNote, Heart, MapPin, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CRMStatusBadge } from './CRMStatusBadge'
import { TagPills } from '../demandes/RequestTags'
import type { CRMContact, SortField, SortDirection } from './CRMTypes'

interface CRMTableViewProps {
  contacts: CRMContact[]
  selectedId: string | null
  onSelect: (contact: CRMContact) => void
  sort: { field: SortField; direction: SortDirection }
  onSort: (field: SortField) => void
}

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `${days}j`
  if (days < 30) return `${Math.floor(days / 7)}sem`
  if (days < 365) return `${Math.floor(days / 30)}m`
  return `${Math.floor(days / 365)}a`
}

function SortHeader({ label, field, sort, onSort }: { label: string; field: SortField; sort: { field: SortField; direction: SortDirection }; onSort: (f: SortField) => void }) {
  const active = sort.field === field
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        'flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider hover:text-gray-900 transition-colors',
        active ? 'text-gray-900' : 'text-gray-400'
      )}
    >
      {label}
      {active && (sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
    </button>
  )
}

export function CRMTableView({ contacts, selectedId, onSelect, sort, onSort }: CRMTableViewProps) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Header - hidden on mobile, shown as table on desktop */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_120px_120px_100px_120px] gap-4 px-4 py-2.5 bg-gray-50/80 border-b border-gray-100">
        <SortHeader label="Contact" field="coupleName" sort={sort} onSort={onSort} />
        <SortHeader label="Statut" field="status" sort={sort} onSort={onSort} />
        <SortHeader label="Mariage" field="weddingDate" sort={sort} onSort={onSort} />
        <SortHeader label="Demande" field="createdAt" sort={sort} onSort={onSort} />
        <SortHeader label="Dernier msg" field="lastMessageAt" sort={sort} onSort={onSort} />
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {contacts.map(contact => (
          <button
            key={contact.requestId}
            onClick={() => onSelect(contact)}
            className={cn(
              'w-full text-left px-4 py-3 hover:bg-gray-50/50 transition-colors',
              selectedId === contact.requestId && 'bg-[#823F91]/[0.04] hover:bg-[#823F91]/[0.06]'
            )}
          >
            {/* Mobile layout */}
            <div className="lg:hidden space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-gray-900 truncate">{contact.coupleName}</span>
                <CRMStatusBadge status={contact.status} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                {contact.weddingDate && (
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {formatDate(contact.weddingDate)}
                  </span>
                )}
                {contact.weddingLocation && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {contact.weddingLocation}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {formatRelative(contact.createdAt)}
                </span>
              </div>
              {contact.tags.length > 0 && <TagPills tags={contact.tags} max={4} />}
            </div>

            {/* Desktop layout */}
            <div className="hidden lg:grid lg:grid-cols-[1fr_120px_120px_100px_120px] gap-4 items-center">
              {/* Contact info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm text-gray-900 truncate">{contact.coupleName}</span>
                  {contact.notesCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                      <StickyNote className="h-3 w-3" /> {contact.notesCount}
                    </span>
                  )}
                </div>
                {contact.tags.length > 0 && <TagPills tags={contact.tags} max={3} />}
                {contact.initialMessage && (
                  <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{contact.initialMessage}</p>
                )}
              </div>

              {/* Status */}
              <CRMStatusBadge status={contact.status} />

              {/* Wedding date */}
              <span className="text-xs text-gray-500">{formatDate(contact.weddingDate)}</span>

              {/* Request date */}
              <span className="text-xs text-gray-400">{formatRelative(contact.createdAt)}</span>

              {/* Last message */}
              <span className="text-xs text-gray-400">
                {contact.lastMessageAt ? (
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {formatRelative(contact.lastMessageAt)}
                  </span>
                ) : '-'}
              </span>
            </div>
          </button>
        ))}
      </div>

      {contacts.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-gray-400">Aucun contact ne correspond a vos filtres</p>
        </div>
      )}
    </div>
  )
}
