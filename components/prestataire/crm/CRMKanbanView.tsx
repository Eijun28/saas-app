'use client'

import { cn } from '@/lib/utils'
import { Heart, MapPin, Mail, Phone } from 'lucide-react'
import { KANBAN_COLUMNS, STATUS_CONFIG } from './CRMTypes'
import type { CRMContact, CRMStatus } from './CRMTypes'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CRM_STATUSES } from './CRMTypes'

interface CRMKanbanViewProps {
  contacts: CRMContact[]
  selectedId: string | null
  onSelect: (contact: CRMContact) => void
  onUpdate: (id: string, field: string, value: unknown) => void
}

function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function CRMKanbanView({ contacts, selectedId, onSelect, onUpdate }: CRMKanbanViewProps) {
  const grouped = KANBAN_COLUMNS.map(col => ({
    ...col,
    contacts: contacts.filter(c => c.status === col.id),
  }))

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
      {grouped.map(col => {
        const config = STATUS_CONFIG[col.id]
        return (
          <div key={col.id} className="flex-shrink-0 w-[260px] sm:w-[280px] bg-gray-50/80 rounded-xl p-2.5 min-h-[300px]">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-semibold', config.color, config.bg)}>
                  {col.label}
                </span>
              </div>
              <span className="text-[11px] font-medium text-gray-400">{col.contacts.length}</span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {col.contacts.map(contact => {
                const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Sans nom'
                return (
                  <button
                    key={contact.id}
                    onClick={() => onSelect(contact)}
                    className={cn(
                      'w-full text-left p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all',
                      selectedId === contact.id && 'border-[#823F91]/30 shadow-sm'
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{fullName}</p>
                      {contact.source === 'nuply_request' && (
                        <span className="px-1 py-0.5 bg-[#823F91]/10 text-[#823F91] rounded text-[8px] font-semibold flex-shrink-0">N</span>
                      )}
                    </div>

                    {contact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 mb-1">
                        {contact.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">{tag}</span>
                        ))}
                        {contact.tags.length > 2 && <span className="text-[10px] text-gray-400">+{contact.tags.length - 2}</span>}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 text-[11px] text-gray-400 mt-1">
                      {contact.wedding_date && (
                        <span className="flex items-center gap-0.5">
                          <Heart className="h-3 w-3" /> {formatDate(contact.wedding_date)}
                        </span>
                      )}
                      {contact.wedding_location && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" /> {contact.wedding_location}
                        </span>
                      )}
                    </div>

                    {contact.budget && (
                      <p className="text-[11px] text-gray-400 mt-1">{contact.budget.toLocaleString('fr-FR')} EUR</p>
                    )}
                  </button>
                )
              })}

              {col.contacts.length === 0 && (
                <p className="text-[11px] text-gray-300 text-center py-8">Aucun contact</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
