'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search, MessageCircle, Clock, ExternalLink,
  Users, CheckCircle2, XCircle, HelpCircle, Heart,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { PageTitle } from '@/components/prestataire/shared/PageTitle'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────────────

type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

// Raw Supabase response shapes
interface RawRequest {
  id: string
  couple_id: string
  status: string
  initial_message: string | null
  created_at: string
  responded_at: string | null
}
interface RawCouple {
  user_id: string
  partner_1_name: string | null
  partner_2_name: string | null
  wedding_date: string | null
}
interface RawConversation { id: string; request_id: string; created_at: string }
interface RawTag { id: string; request_id: string; tag: string; color: string }
interface RawMessage { conversation_id: string; created_at: string }
interface RawConvId { id: string }

interface ContactTag {
  id: string
  tag: string
  color: string
}

interface Contact {
  requestId: string
  coupleId: string
  coupleName: string
  weddingDate: string | null
  status: RequestStatus
  createdAt: string
  respondedAt: string | null
  initialMessage: string
  conversationId: string | null
  tags: ContactTag[]
  lastMessageAt: string | null
}

// ─── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<RequestStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pending: { label: 'En attente', icon: HelpCircle, className: 'bg-amber-50 text-amber-600 border-amber-200' },
  accepted: { label: 'Accepté', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  rejected: { label: 'Refusé', icon: XCircle, className: 'bg-gray-100 text-gray-500 border-gray-200' },
  cancelled: { label: 'Annulé', icon: XCircle, className: 'bg-gray-100 text-gray-400 border-gray-200' },
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`
  if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`
  return `Il y a ${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? 's' : ''}`
}

// ─── KPI card ───────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, colorClass }: { label: string; value: number; icon: typeof Users; colorClass: string }) {
  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', colorClass)}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0B0E12]">{value}</p>
            <p className="text-xs text-[#6B7280]">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Contact row ────────────────────────────────────────────────────────────────

function ContactRow({ contact }: { contact: Contact }) {
  const status = STATUS_CONFIG[contact.status]
  const StatusIcon = status.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-white border rounded-2xl hover:border-[#D4ADE0] hover:shadow-sm transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Couple info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-[#0B0E12] truncate">{contact.coupleName}</span>
            <Badge
              variant="outline"
              className={cn('text-[11px] gap-1 py-0 px-2', status.className)}
            >
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelative(contact.createdAt)}
            </span>
            {contact.weddingDate && (
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                Mariage {formatDate(contact.weddingDate)}
              </span>
            )}
            {contact.lastMessageAt && (
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                Dernier message {formatRelative(contact.lastMessageAt)}
              </span>
            )}
          </div>

          {contact.initialMessage && (
            <p className="text-sm text-[#374151] mt-1.5 line-clamp-1 italic">
              &ldquo;{contact.initialMessage}&rdquo;
            </p>
          )}

          {contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {contact.tags.map(tag => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {contact.conversationId && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/prestataire/messagerie/${contact.conversationId}`}>
                <MessageCircle className="h-3.5 w-3.5" />
                Message
              </Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-[#6B7280]">
            <Link href={`/prestataire/demandes-recues`}>
              <ExternalLink className="h-3.5 w-3.5" />
              Demande
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const { user } = useUser()
  const supabase = createClient()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all')

  // ─── Load ────────────────────────────────────────────────────────────────────

  const fetchContacts = useCallback(async () => {
    if (!user) return
    setIsLoading(true)

    try {
      // 1. Fetch all requests for this provider
      const { data: requests, error: reqError } = await supabase
        .from('requests')
        .select('id, couple_id, status, initial_message, created_at, responded_at')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })

      if (reqError) { toast.error('Erreur chargement des contacts'); return }
      if (!requests?.length) { setContacts([]); setIsLoading(false); return }

      const typedRequests = requests as RawRequest[]
      const requestIds = typedRequests.map(r => r.id)
      const coupleUserIds = [...new Set(typedRequests.map(r => r.couple_id))]

      // 2-5. Batch queries in parallel
      const [couplesRes, conversationsRes, tagsRes, lastMsgsRes] = await Promise.all([
        // Couple names + wedding date
        supabase
          .from('couples')
          .select('user_id, partner_1_name, partner_2_name, wedding_date')
          .in('user_id', coupleUserIds),

        // Conversations (accepted requests only)
        supabase
          .from('conversations')
          .select('id, request_id, created_at')
          .in('request_id', requestIds),

        // Tags
        supabase
          .from('request_tags')
          .select('id, request_id, tag, color')
          .eq('provider_id', user.id)
          .in('request_id', requestIds),

        // Last message per conversation (fetch recent, dedup in JS)
        supabase
          .from('messages')
          .select('conversation_id, created_at')
          .in('conversation_id',
            ((await supabase
              .from('conversations')
              .select('id')
              .in('request_id', requestIds)
            ).data as RawConvId[] | null)?.map(c => c.id) ?? []
          )
          .order('created_at', { ascending: false })
          .limit(requestIds.length * 5),
      ])

      // Build lookup maps
      const couples = (couplesRes.data ?? []) as RawCouple[]
      const conversations = (conversationsRes.data ?? []) as RawConversation[]
      const tags = (tagsRes.data ?? []) as RawTag[]
      const lastMsgs = (lastMsgsRes.data ?? []) as RawMessage[]

      const couplesMap = new Map(couples.map(c => [c.user_id, c]))
      const convByRequest = new Map(conversations.map(c => [c.request_id, c]))

      const tagsMap = new Map<string, ContactTag[]>()
      for (const t of tags) {
        if (!tagsMap.has(t.request_id)) tagsMap.set(t.request_id, [])
        tagsMap.get(t.request_id)!.push({ id: t.id, tag: t.tag, color: t.color })
      }

      const lastMsgMap = new Map<string, string>()
      for (const m of lastMsgs) {
        if (!lastMsgMap.has(m.conversation_id)) lastMsgMap.set(m.conversation_id, m.created_at)
      }

      const result: Contact[] = typedRequests.map(req => {
        const couple = couplesMap.get(req.couple_id)
        const n1 = couple?.partner_1_name?.trim() ?? ''
        const n2 = couple?.partner_2_name?.trim() ?? ''
        const conv = convByRequest.get(req.id)

        return {
          requestId: req.id,
          coupleId: req.couple_id,
          coupleName: n1 && n2 ? `${n1} & ${n2}` : n1 || n2 || 'Couple',
          weddingDate: couple?.wedding_date ?? null,
          status: req.status as RequestStatus,
          createdAt: req.created_at,
          respondedAt: req.responded_at,
          initialMessage: req.initial_message ?? '',
          conversationId: conv?.id ?? null,
          tags: tagsMap.get(req.id) ?? [],
          lastMessageAt: conv ? (lastMsgMap.get(conv.id) ?? null) : null,
        }
      })

      setContacts(result)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  // ─── Filtering ────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let result = contacts
    if (statusFilter !== 'all') result = result.filter(c => c.status === statusFilter)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      result = result.filter(c =>
        c.coupleName.toLowerCase().includes(q) ||
        c.initialMessage.toLowerCase().includes(q) ||
        c.tags.some(t => t.tag.toLowerCase().includes(q))
      )
    }
    return result
  }, [contacts, statusFilter, searchTerm])

  // ─── KPIs ────────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => ({
    total: contacts.length,
    accepted: contacts.filter(c => c.status === 'accepted').length,
    pending: contacts.filter(c => c.status === 'pending').length,
    rejected: contacts.filter(c => c.status === 'rejected' || c.status === 'cancelled').length,
  }), [contacts])

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="w-full space-y-5 animate-pulse">
        <div className="h-7 w-52 bg-gray-100 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white rounded-2xl border" />)}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl border" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      <PageTitle
        title="Contacts"
        description="Tous les couples qui ont pris contact avec vous"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total contacts" value={kpis.total} icon={Users} colorClass="bg-[#823F91]/10 text-[#823F91]" />
        <KpiCard label="Acceptés" value={kpis.accepted} icon={CheckCircle2} colorClass="bg-emerald-50 text-emerald-600" />
        <KpiCard label="En attente" value={kpis.pending} icon={HelpCircle} colorClass="bg-amber-50 text-amber-600" />
        <KpiCard label="Refusés / Annulés" value={kpis.rejected} icon={XCircle} colorClass="bg-gray-100 text-gray-500" />
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun contact pour l'instant"
          description="Quand des couples vous enverront une demande, ils apparaîtront ici avec leur statut et l'historique des échanges."
        />
      ) : (
        <>
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher un couple, un message, un tag…"
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={v => setStatusFilter(v as RequestStatus | 'all')}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="accepted">Acceptés</SelectItem>
                <SelectItem value="rejected">Refusés</SelectItem>
                <SelectItem value="cancelled">Annulés</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-[#6B7280] py-8">
              Aucun contact ne correspond à votre recherche.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map(contact => (
                <ContactRow key={contact.requestId} contact={contact} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
