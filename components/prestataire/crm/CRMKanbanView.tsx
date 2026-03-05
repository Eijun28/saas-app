'use client'

import { cn } from '@/lib/utils'
import { Heart, MessageCircle } from 'lucide-react'
import { TagPills } from '../demandes/RequestTags'
import { KANBAN_COLUMNS } from './CRMTypes'
import type { CRMContact } from './CRMTypes'

interface CRMKanbanViewProps {
  contacts: CRMContact[]
  selectedId: string | null
  onSelect: (contact: CRMContact) => void
}

function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `${days}j`
  return `${Math.floor(days / 7)}sem`
}

export function CRMKanbanView({ contacts, selectedId, onSelect }: CRMKanbanViewProps) {
  const grouped = KANBAN_COLUMNS.map(col => ({
    ...col,
    contacts: contacts.filter(c => {
      if (col.id === 'rejected') return c.status === 'rejected' || c.status === 'cancelled'
      return c.status === col.id
    }),
  }))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {grouped.map(col => (
        <div key={col.id} className="bg-gray-50/80 rounded-xl p-2.5 min-h-[200px]">
          {/* Column header */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className={cn('h-2.5 w-2.5 rounded-full', col.dotColor)} />
            <span className="text-xs font-semibold text-gray-600">{col.label}</span>
            <span className="text-[10px] font-medium text-gray-400 ml-auto">{col.contacts.length}</span>
          </div>

          {/* Cards */}
          <div className="space-y-2">
            {col.contacts.map(contact => (
              <button
                key={contact.requestId}
                onClick={() => onSelect(contact)}
                className={cn(
                  'w-full text-left p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all',
                  selectedId === contact.requestId && 'border-[#823F91]/30 shadow-sm'
                )}
              >
                <p className="text-[13px] font-semibold text-gray-900 truncate mb-1">{contact.coupleName}</p>

                {contact.tags.length > 0 && (
                  <div className="mb-1.5">
                    <TagPills tags={contact.tags} max={2} />
                  </div>
                )}

                <div className="flex flex-wrap gap-2 text-[11px] text-gray-400">
                  {contact.weddingDate && (
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-3 w-3" /> {formatDate(contact.weddingDate)}
                    </span>
                  )}
                  {contact.lastMessageAt && (
                    <span className="flex items-center gap-0.5">
                      <MessageCircle className="h-3 w-3" /> {formatRelative(contact.lastMessageAt)}
                    </span>
                  )}
                </div>

                {contact.initialMessage && (
                  <p className="text-[11px] text-gray-400 line-clamp-2 mt-1.5">{contact.initialMessage}</p>
                )}
              </button>
            ))}
            {col.contacts.length === 0 && (
              <p className="text-[11px] text-gray-300 text-center py-6">Aucun contact</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
