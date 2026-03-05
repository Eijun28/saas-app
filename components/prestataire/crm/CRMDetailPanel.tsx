'use client'

import { useState, useEffect } from 'react'
import {
  X, Heart, MapPin, Mail, Phone, Calendar, DollarSign, Users2,
  MessageCircle, ExternalLink, Tag, StickyNote, Pencil, Save, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CRMStatusBadge } from './CRMStatusBadge'
import { CRM_STATUSES, STATUS_CONFIG, SOURCE_LABELS } from './CRMTypes'
import type { CRMContact, CRMStatus } from './CRMTypes'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CRMDetailPanelProps {
  contact: CRMContact | null
  onClose: () => void
  onUpdate: (id: string, field: string, value: unknown) => void
  onDelete: (id: string) => void
}

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function CRMDetailPanel({ contact, onClose, onUpdate, onDelete }: CRMDetailPanelProps) {
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [editingTags, setEditingTags] = useState(false)
  const [tagsDraft, setTagsDraft] = useState('')

  useEffect(() => {
    if (contact) {
      setNotesDraft(contact.notes || '')
      setTagsDraft(contact.tags.join(', '))
      setEditingNotes(false)
      setEditingTags(false)
    }
  }, [contact?.id])

  if (!contact) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center h-full text-gray-300 p-8">
        <Users2 className="h-10 w-10 mb-3" />
        <p className="text-sm text-center">Selectionnez un contact</p>
      </div>
    )
  }

  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Sans nom'

  const handleSaveNotes = () => {
    onUpdate(contact.id, 'notes', notesDraft)
    setEditingNotes(false)
    toast.success('Notes enregistrees')
  }

  const handleSaveTags = () => {
    const newTags = tagsDraft.split(',').map(t => t.trim()).filter(Boolean)
    onUpdate(contact.id, 'tags', newTags)
    setEditingTags(false)
    toast.success('Tags enregistres')
  }

  const handleDelete = () => {
    if (confirm('Supprimer ce contact ?')) {
      onDelete(contact.id)
      onClose()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-gray-900 truncate">{fullName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <CRMStatusBadge status={contact.status} />
              <span className="text-[10px] text-gray-400">{SOURCE_LABELS[contact.source]}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Pipeline status */}
        <div className="mb-3">
          <Label className="text-[11px] text-gray-400 mb-1.5 block">Pipeline</Label>
          <Select
            value={contact.status}
            onValueChange={(v: string) => onUpdate(contact.id, 'status', v)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CRM_STATUSES.map(s => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Properties */}
        <div className="space-y-2 text-xs">
          {contact.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <a href={`mailto:${contact.email}`} className="hover:text-[#823F91] truncate">{contact.email}</a>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <a href={`tel:${contact.phone}`} className="hover:text-[#823F91]">{contact.phone}</a>
            </div>
          )}
          {contact.wedding_date && (
            <div className="flex items-center gap-2 text-gray-500">
              <Heart className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>Mariage le {formatDate(contact.wedding_date)}</span>
            </div>
          )}
          {contact.wedding_location && (
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>{contact.wedding_location}</span>
            </div>
          )}
          {contact.budget && (
            <div className="flex items-center gap-2 text-gray-500">
              <DollarSign className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>{contact.budget.toLocaleString('fr-FR')} EUR</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Cree le {formatDate(contact.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Tags section */}
        <div className="px-5 py-3 border-b border-gray-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Tags
            </p>
            <button
              onClick={() => setEditingTags(!editingTags)}
              className="text-[11px] text-gray-400 hover:text-[#823F91] transition-colors"
            >
              {editingTags ? 'Annuler' : 'Modifier'}
            </button>
          </div>

          {editingTags ? (
            <div className="space-y-2">
              <Input
                value={tagsDraft}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagsDraft(e.target.value)}
                placeholder="VIP, champetre, urgent"
                className="h-8 text-sm"
              />
              <Button onClick={handleSaveTags} size="sm" className="h-7 text-xs bg-[#823F91] hover:bg-[#6D3478]">
                <Save className="h-3 w-3 mr-1" /> Enregistrer
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 min-h-[24px]">
              {contact.tags.length > 0 ? contact.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[11px] font-medium">
                  {tag}
                </span>
              )) : (
                <span className="text-[11px] text-gray-300 italic">Aucun tag</span>
              )}
            </div>
          )}
        </div>

        {/* Notes section */}
        <div className="px-5 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <StickyNote className="h-3 w-3" /> Notes
            </p>
            <button
              onClick={() => {
                if (editingNotes) {
                  handleSaveNotes()
                } else {
                  setEditingNotes(true)
                }
              }}
              className="text-[11px] text-gray-400 hover:text-[#823F91] transition-colors"
            >
              {editingNotes ? 'Enregistrer' : 'Modifier'}
            </button>
          </div>

          {editingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={notesDraft}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotesDraft(e.target.value)}
                placeholder="Notes sur ce contact..."
                rows={5}
                className="text-sm resize-none"
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveNotes} size="sm" className="h-7 text-xs bg-[#823F91] hover:bg-[#6D3478]">
                  <Save className="h-3 w-3 mr-1" /> Enregistrer
                </Button>
                <Button onClick={() => { setEditingNotes(false); setNotesDraft(contact.notes || '') }} variant="ghost" size="sm" className="h-7 text-xs">
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div className="min-h-[40px]">
              {contact.notes ? (
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{contact.notes}</p>
              ) : (
                <p className="text-sm text-gray-300 italic">Aucune note</p>
              )}
            </div>
          )}
        </div>

        {/* Nuply link */}
        {contact.request_id && (
          <div className="px-5 py-3 border-t border-gray-50">
            <Button asChild variant="outline" size="sm" className="w-full gap-2 text-xs h-8">
              <Link href="/prestataire/demandes-recues">
                <ExternalLink className="h-3.5 w-3.5" />
                Voir la demande Nuply
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Supprimer ce contact
        </Button>
      </div>
    </div>
  )
}
