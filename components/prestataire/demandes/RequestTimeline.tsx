'use client'

import { useEffect, useState } from 'react'
import { Mail, CheckCircle2, XCircle, MessageSquare, FileText, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Demande } from '@/lib/types/prestataire'
import { createClient } from '@/lib/supabase/client'

interface TimelineEvent {
  id: string
  type: 'request' | 'accepted' | 'rejected' | 'message' | 'devis' | 'cancelled'
  label: string
  date: string
  detail?: string
}

const EVENT_CONFIG = {
  request:   { icon: Mail,         color: 'bg-[#823F91]',   label: 'Demande reçue' },
  accepted:  { icon: CheckCircle2, color: 'bg-green-500',   label: 'Demande acceptée' },
  rejected:  { icon: XCircle,      color: 'bg-red-400',     label: 'Demande refusée' },
  cancelled: { icon: XCircle,      color: 'bg-gray-400',    label: 'Demande annulée' },
  message:   { icon: MessageSquare,color: 'bg-blue-400',    label: 'Message envoyé' },
  devis:     { icon: FileText,     color: 'bg-amber-500',   label: 'Devis envoyé' },
}

interface RequestTimelineProps {
  demande: Demande
  requestId: string
}

export function RequestTimeline({ demande, requestId }: RequestTimelineProps) {
  const [events, setEvents]   = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase  = createClient()
      const timeline: TimelineEvent[] = []

      // 1. Demande reçue (toujours présente)
      timeline.push({
        id: 'req',
        type: 'request',
        label: 'Demande reçue',
        date: demande.created_at,
        detail: demande.couple_nom,
      })

      // 2. Statut accepté / refusé / annulé
      if (demande.statut === 'en_cours' || demande.statut === 'terminee') {
        timeline.push({
          id: 'status',
          type: demande.statut === 'en_cours' ? 'accepted' : 'rejected',
          label: demande.statut === 'en_cours' ? 'Demande acceptée' : 'Demande clôturée',
          date: demande.created_at, // approximatif si pas de responded_at
        })
      }

      // 3. Devis envoyés
      const { data: devisData } = await supabase
        .from('devis')
        .select('id, amount, created_at, title')
        .eq('prestataire_id', (await supabase.auth.getUser()).data.user?.id ?? '')
        .order('created_at', { ascending: true })

      devisData?.forEach((d: { id: string; amount: number; created_at: string; title: string | null }) => {
        timeline.push({
          id: `devis-${d.id}`,
          type: 'devis',
          label: 'Devis envoyé',
          date: d.created_at,
          detail: d.title ? `${d.title} · ${Number(d.amount).toLocaleString('fr-FR')} €` : `${Number(d.amount).toLocaleString('fr-FR')} €`,
        })
      })

      // 4. Messages dans la conversation liée
      const { data: convData } = await supabase
        .from('conversations')
        .select('id')
        .eq('request_id', requestId)
        .maybeSingle()

      if (convData?.id) {
        const { data: msgs } = await supabase
          .from('messages')
          .select('id, content, created_at, sender_id')
          .eq('conversation_id', convData.id)
          .order('created_at', { ascending: true })
          .limit(20)

        msgs?.forEach((m: { id: string; content: string; created_at: string; sender_id: string }) => {
          timeline.push({
            id: `msg-${m.id}`,
            type: 'message',
            label: 'Message',
            date: m.created_at,
            detail: m.content.slice(0, 60) + (m.content.length > 60 ? '…' : ''),
          })
        })
      }

      // Trier par date croissante
      timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setEvents(timeline)
      setLoading(false)
    }
    load()
  }, [demande, requestId])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
            <div className="flex-1 h-10 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative space-y-0">
      {events.map((event: TimelineEvent, i: number) => {
        const config = EVENT_CONFIG[event.type]
        const Icon = config.icon
        const isLast = i === events.length - 1

        return (
          <div key={event.id} className="flex gap-3">
            {/* Ligne verticale + icône */}
            <div className="flex flex-col items-center">
              <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0', config.color)}>
                <Icon className="h-3 w-3 text-white" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-gray-100 my-0.5 min-h-[16px]" />}
            </div>

            {/* Contenu */}
            <div className={cn('pb-3 min-w-0 flex-1', isLast && 'pb-0')}>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[13px] font-medium text-gray-900">{event.label}</span>
                <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDate(event.date)}
                </span>
              </div>
              {event.detail && (
                <p className="text-[12px] text-gray-500 mt-0.5 truncate">{event.detail}</p>
              )}
            </div>
          </div>
        )
      })}

      {events.length === 0 && (
        <p className="text-[12px] text-gray-300 text-center py-4">Aucun événement</p>
      )}
    </div>
  )
}
