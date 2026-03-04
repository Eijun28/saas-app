'use client'

import { useState } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Calendar, MapPin, StickyNote, Clock, Tag } from 'lucide-react'
import { RequestNotes }    from './RequestNotes'
import { RequestTimeline } from './RequestTimeline'
import { RequestTags }     from './RequestTags'
import type { RequestTag } from './RequestTags'
import type { Demande }    from '@/lib/types/prestataire'

interface RequestDetailSheetProps {
  demande:   Demande | null
  open:      boolean
  onClose:   () => void
  tags:      RequestTag[]
  onTagsChange: (tags: RequestTag[]) => void
}

export function RequestDetailSheet({
  demande, open, onClose, tags, onTagsChange,
}: RequestDetailSheetProps) {
  if (!demande) return null

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  return (
    <Sheet open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto flex flex-col gap-0 p-0"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-gray-100">
          <SheetTitle className="text-base font-bold text-gray-900">
            {demande.couple_nom}
          </SheetTitle>
          <div className="flex flex-wrap gap-3 text-[12px] text-gray-500">
            {demande.date_evenement && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(demande.date_evenement)}
              </span>
            )}
            {demande.lieu && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {demande.lieu}
              </span>
            )}
          </div>

          {/* Message initial */}
          {demande.message && (
            <p className="text-[13px] text-gray-600 leading-relaxed mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
              {demande.message}
            </p>
          )}
        </SheetHeader>

        {/* Tags */}
        <div className="px-5 py-3 border-b border-gray-50">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
            <Tag className="h-3 w-3" /> Labels
          </p>
          <RequestTags
            requestId={demande.id}
            tags={tags}
            onChange={onTagsChange}
          />
        </div>

        {/* Tabs : Notes / Timeline */}
        <div className="flex-1 px-5 py-3">
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
                value="timeline"
                className="rounded-md text-[12px] data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5"
              >
                <Clock className="h-3.5 w-3.5" />
                Historique
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes">
              <RequestNotes requestId={demande.id} />
            </TabsContent>

            <TabsContent value="timeline">
              <RequestTimeline demande={demande} requestId={demande.id} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
