'use client'

import { useState, useEffect } from 'react'
import {
  StickyNote, Tag, ArrowRightLeft, MessageSquare, FileText,
  Phone, Clock, Pencil, Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Demande } from '@/lib/types/prestataire'

interface TimelineEvent {
  id: string
  type: string
  label: string
  date: string
  detail?: string
}

const ICON_MAP: Record<string, typeof Activity> = {
  note_added: StickyNote,
  tag_added: Tag,
  tag_removed: Tag,
  status_changed: ArrowRightLeft,
  message_sent: MessageSquare,
  devis_sent: FileText,
  call_logged: Phone,
  follow_up_set: Clock,
  custom: Pencil,
  request: Activity,
  accepted: ArrowRightLeft,
  rejected: ArrowRightLeft,
  message: MessageSquare,
  devis: FileText,
}

interface CRMActivityFeedProps {
  requestId: string
}

export function CRMActivityFeed({ requestId }: CRMActivityFeedProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const timeline: TimelineEvent[] = []

      // Fetch request details
      const { data: req } = await supabase
        .from('requests')
        .select('id, couple_id, status, initial_message, created_at, responded_at')
        .eq('id', requestId)
        .single()

      if (req) {
        timeline.push({
          id: 'req-created',
          type: 'request',
          label: 'Demande recue',
          date: req.created_at,
        })

        if (req.status === 'accepted' && req.responded_at) {
          timeline.push({
            id: 'req-accepted',
            type: 'accepted',
            label: 'Demande acceptee',
            date: req.responded_at,
          })
        }
        if (req.status === 'rejected' && req.responded_at) {
          timeline.push({
            id: 'req-rejected',
            type: 'rejected',
            label: 'Demande refusee',
            date: req.responded_at,
          })
        }
      }

      // Fetch activities from contact_activities table
      try {
        const { data: activities } = await supabase
          .from('contact_activities')
          .select('id, type, description, created_at')
          .eq('request_id', requestId)
          .order('created_at', { ascending: true })

        activities?.forEach((a: { id: string; type: string; description: string; created_at: string }) => {
          timeline.push({
            id: `act-${a.id}`,
            type: a.type,
            label: a.description,
            date: a.created_at,
          })
        })
      } catch {
        // Table might not exist yet
      }

      // Fetch conversation messages
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('request_id', requestId)
        .maybeSingle()

      if (conv?.id) {
        const { data: msgs } = await supabase
          .from('messages')
          .select('id, content, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true })
          .limit(15)

        msgs?.forEach((m: { id: string; content: string; created_at: string }) => {
          timeline.push({
            id: `msg-${m.id}`,
            type: 'message',
            label: 'Message',
            date: m.created_at,
            detail: m.content.slice(0, 80) + (m.content.length > 80 ? '...' : ''),
          })
        })
      }

      timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setEvents(timeline)
      setLoading(false)
    }
    load()
  }, [requestId])

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
            <div className="flex-1 h-8 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-gray-300">
        <Activity className="h-8 w-8 mb-2" />
        <p className="text-[12px]">Aucune activite</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {events.map((event, i) => {
        const Icon = ICON_MAP[event.type] || Activity
        const isLast = i === events.length - 1

        return (
          <div key={event.id} className="flex gap-2.5">
            <div className="flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon className="h-2.5 w-2.5 text-gray-500" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-gray-100 my-0.5 min-h-[12px]" />}
            </div>
            <div className={cn('pb-3 min-w-0 flex-1', isLast && 'pb-0')}>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[12px] font-medium text-gray-700">{event.label}</span>
                <span className="text-[10px] text-gray-400">{formatTime(event.date)}</span>
              </div>
              {event.detail && (
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">{event.detail}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
