'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X, Calendar, MapPin, MessageCircle, ExternalLink,
  StickyNote, Clock, Tag, Activity, Heart, DollarSign,
  Phone, Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RequestNotes } from '../demandes/RequestNotes'
import { RequestTags } from '../demandes/RequestTags'
import type { RequestTag } from '../demandes/RequestTags'
import { CRMStatusBadge } from './CRMStatusBadge'
import { CRMActivityFeed } from './CRMActivityFeed'
import type { CRMContact } from './CRMTypes'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CRMDetailPanelProps {
  contact: CRMContact | null
  onClose: () => void
  onTagsChange: (requestId: string, tags: RequestTag[]) => void
}

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatBudget(min: number, max: number) {
  if (!min && !max) return '-'
  const fmt = (n: number) => n.toLocaleString('fr-FR')
  if (min && max) return `${fmt(min)} - ${fmt(max)} EUR`
  if (min) return `A partir de ${fmt(min)} EUR`
  return `Jusqu'a ${fmt(max)} EUR`
}

export function CRMDetailPanel({ contact, onClose, onTagsChange }: CRMDetailPanelProps) {
  const [tags, setTags] = useState<RequestTag[]>([])

  useEffect(() => {
    if (contact) {
      setTags(contact.tags)
    }
  }, [contact])

  const handleTagsChange = useCallback((newTags: RequestTag[]) => {
    setTags(newTags)
    if (contact) {
      onTagsChange(contact.requestId, newTags)
    }
  }, [contact, onTagsChange])

  if (!contact) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center h-full text-gray-300 p-8">
        <Activity className="h-10 w-10 mb-3" />
        <p className="text-sm text-center">Selectionnez un contact pour voir ses details</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-gray-900 truncate">{contact.coupleName}</h2>
            <CRMStatusBadge status={contact.status} className="mt-1" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick info */}
        <div className="grid grid-cols-1 gap-2 text-xs text-gray-500">
          {contact.weddingDate && (
            <div className="flex items-center gap-2">
              <Heart className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>Mariage le {formatDate(contact.weddingDate)}</span>
            </div>
          )}
          {contact.weddingLocation && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>{contact.weddingLocation}</span>
            </div>
          )}
          {(contact.budgetMin > 0 || contact.budgetMax > 0) && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>{formatBudget(contact.budgetMin, contact.budgetMax)}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span>Contact le {formatDate(contact.createdAt)}</span>
          </div>
        </div>

        {/* Initial message */}
        {contact.initialMessage && (
          <p className="text-[13px] text-gray-600 leading-relaxed mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 line-clamp-4">
            {contact.initialMessage}
          </p>
        )}

        {/* Quick actions */}
        <div className="flex gap-2 mt-3">
          {contact.conversationId && (
            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs h-8 rounded-lg">
              <Link href={`/prestataire/messagerie/${contact.conversationId}`}>
                <MessageCircle className="h-3.5 w-3.5" />
                Message
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs h-8 rounded-lg">
            <Link href="/prestataire/demandes-recues">
              <ExternalLink className="h-3.5 w-3.5" />
              Demande
            </Link>
          </Button>
        </div>
      </div>

      {/* Tags */}
      <div className="px-5 py-3 border-b border-gray-50 flex-shrink-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
          <Tag className="h-3 w-3" /> Labels
        </p>
        <RequestTags
          requestId={contact.requestId}
          tags={tags}
          onChange={handleTagsChange}
        />
      </div>

      {/* Tabs: Notes / Activity */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        <Tabs defaultValue="notes">
          <TabsList className="h-8 p-0.5 bg-gray-100 rounded-lg w-full grid grid-cols-2 mb-4">
            <TabsTrigger
              value="notes"
              className="rounded-md text-[12px] data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5"
            >
              <StickyNote className="h-3.5 w-3.5" />
              Notes
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-md text-[12px] data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5"
            >
              <Clock className="h-3.5 w-3.5" />
              Activite
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes">
            <RequestNotes requestId={contact.requestId} />
          </TabsContent>

          <TabsContent value="activity">
            <CRMActivityFeed requestId={contact.requestId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
