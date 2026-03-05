'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search, Users, CheckCircle2, XCircle, HelpCircle,
  LayoutGrid, List, RefreshCw, ChevronLeft,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { PageTitle } from '@/components/prestataire/shared/PageTitle'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import { CRMTableView } from '@/components/prestataire/crm/CRMTableView'
import { CRMKanbanView } from '@/components/prestataire/crm/CRMKanbanView'
import { CRMDetailPanel } from '@/components/prestataire/crm/CRMDetailPanel'
import type { CRMContact, CRMView, RequestStatus, SortField, SortDirection } from '@/components/prestataire/crm/CRMTypes'
import type { RequestTag } from '@/components/prestataire/demandes/RequestTags'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Raw Supabase types ──────────────────────────────────────────────────────

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
  wedding_location: string | null
  budget_min: number | null
  budget_max: number | null
}
interface RawConversation { id: string; request_id: string }
interface RawTag { id: string; request_id: string; tag: string; color: string }
interface RawMessage { conversation_id: string; created_at: string }
interface RawNote { request_id: string }

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, dotColor }: { label: string; value: number; dotColor: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 bg-white border border-gray-100 rounded-xl">
      <span className={cn('h-2.5 w-2.5 rounded-full flex-shrink-0', dotColor)} />
      <div className="min-w-0">
        <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContactsCRMPage() {
  const { user } = useUser()
  const supabase = createClient()

  const [contacts, setContacts] = useState<CRMContact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all')
  const [view, setView] = useState<CRMView>('table')
  const [sort, setSort] = useState<{ field: SortField; direction: SortDirection }>({ field: 'createdAt', direction: 'desc' })
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null)
  const [showDetailMobile, setShowDetailMobile] = useState(false)

  // ─── Load data ──────────────────────────────────────────────────────────────

  const fetchContacts = useCallback(async () => {
    if (!user) return
    setIsLoading(true)

    try {
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

      // Batch fetch in parallel
      const [couplesRes, conversationsRes, tagsRes, notesCountRes] = await Promise.all([
        supabase
          .from('couples')
          .select('user_id, partner_1_name, partner_2_name, wedding_date, wedding_location, budget_min, budget_max')
          .in('user_id', coupleUserIds),
        supabase
          .from('conversations')
          .select('id, request_id')
          .in('request_id', requestIds),
        supabase
          .from('request_tags')
          .select('id, request_id, tag, color')
          .eq('provider_id', user.id)
          .in('request_id', requestIds),
        supabase
          .from('request_notes')
          .select('request_id')
          .in('request_id', requestIds),
      ])

      const couples = (couplesRes.data ?? []) as RawCouple[]
      const conversations = (conversationsRes.data ?? []) as RawConversation[]
      const tags = (tagsRes.data ?? []) as RawTag[]
      const notes = (notesCountRes.data ?? []) as RawNote[]

      // Fetch last messages for conversations
      const convIds = conversations.map(c => c.id)
      let lastMsgs: RawMessage[] = []
      if (convIds.length > 0) {
        const { data: msgsData } = await supabase
          .from('messages')
          .select('conversation_id, created_at')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false })
          .limit(convIds.length * 3)
        lastMsgs = (msgsData ?? []) as RawMessage[]
      }

      // Build lookup maps
      const couplesMap = new Map(couples.map(c => [c.user_id, c]))
      const convByRequest = new Map(conversations.map(c => [c.request_id, c]))

      const tagsMap = new Map<string, { id: string; tag: string; color: string }[]>()
      for (const t of tags) {
        if (!tagsMap.has(t.request_id)) tagsMap.set(t.request_id, [])
        tagsMap.get(t.request_id)!.push({ id: t.id, tag: t.tag, color: t.color })
      }

      const notesCountMap = new Map<string, number>()
      for (const n of notes) {
        notesCountMap.set(n.request_id, (notesCountMap.get(n.request_id) ?? 0) + 1)
      }

      const lastMsgMap = new Map<string, string>()
      for (const m of lastMsgs) {
        if (!lastMsgMap.has(m.conversation_id)) lastMsgMap.set(m.conversation_id, m.created_at)
      }

      const result: CRMContact[] = typedRequests.map(req => {
        const couple = couplesMap.get(req.couple_id)
        const n1 = couple?.partner_1_name?.trim() ?? ''
        const n2 = couple?.partner_2_name?.trim() ?? ''
        const conv = convByRequest.get(req.id)

        return {
          requestId: req.id,
          coupleId: req.couple_id,
          coupleName: n1 && n2 ? `${n1} & ${n2}` : n1 || n2 || 'Couple',
          weddingDate: couple?.wedding_date ?? null,
          weddingLocation: couple?.wedding_location ?? null,
          budgetMin: couple?.budget_min ?? 0,
          budgetMax: couple?.budget_max ?? 0,
          status: req.status as RequestStatus,
          createdAt: req.created_at,
          respondedAt: req.responded_at,
          initialMessage: req.initial_message ?? '',
          conversationId: conv?.id ?? null,
          tags: tagsMap.get(req.id) ?? [],
          lastMessageAt: conv ? (lastMsgMap.get(conv.id) ?? null) : null,
          notesCount: notesCountMap.get(req.id) ?? 0,
        }
      })

      setContacts(result)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  // ─── Filtering & Sorting ────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let result = contacts

    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter)
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      result = result.filter(c =>
        c.coupleName.toLowerCase().includes(q) ||
        c.initialMessage.toLowerCase().includes(q) ||
        c.weddingLocation?.toLowerCase().includes(q) ||
        c.tags.some(t => t.tag.toLowerCase().includes(q))
      )
    }

    // Sort
    result = [...result].sort((a, b) => {
      const dir = sort.direction === 'asc' ? 1 : -1
      switch (sort.field) {
        case 'coupleName':
          return dir * a.coupleName.localeCompare(b.coupleName)
        case 'createdAt':
          return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        case 'weddingDate': {
          const da = a.weddingDate ? new Date(a.weddingDate).getTime() : 0
          const db = b.weddingDate ? new Date(b.weddingDate).getTime() : 0
          return dir * (da - db)
        }
        case 'status':
          return dir * a.status.localeCompare(b.status)
        case 'lastMessageAt': {
          const la = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
          const lb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
          return dir * (la - lb)
        }
        default:
          return 0
      }
    })

    return result
  }, [contacts, statusFilter, searchTerm, sort])

  // ─── KPIs ──────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => ({
    total: contacts.length,
    pending: contacts.filter(c => c.status === 'pending').length,
    accepted: contacts.filter(c => c.status === 'accepted').length,
    completed: contacts.filter(c => c.status === 'completed').length,
    rejected: contacts.filter(c => c.status === 'rejected' || c.status === 'cancelled').length,
  }), [contacts])

  // ─── Sort handler ─────────────────────────────────────────────────────────

  const handleSort = (field: SortField) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  // ─── Contact selection ────────────────────────────────────────────────────

  const handleSelect = (contact: CRMContact) => {
    setSelectedContact(contact)
    setShowDetailMobile(true)
  }

  const handleTagsChange = useCallback((requestId: string, newTags: RequestTag[]) => {
    setContacts(prev =>
      prev.map(c =>
        c.requestId === requestId ? { ...c, tags: newTags } : c
      )
    )
  }, [])

  // ─── Loading state ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="w-full space-y-4 animate-pulse">
        <div className="h-16 bg-gray-100 rounded-2xl" />
        <div className="flex gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 flex-1 bg-white rounded-xl border" />)}
        </div>
        <div className="h-10 bg-white rounded-xl border" />
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-white rounded-lg border" />)}
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4">
      <PageTitle
        title="Contacts CRM"
        description={`${contacts.length} contact${contacts.length > 1 ? 's' : ''} au total`}
        actions={
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchContacts}
            disabled={isLoading}
            className="h-8 w-8 rounded-lg"
            title="Rafraichir"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
          </Button>
        }
      />

      {contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun contact pour l'instant"
          description="Quand des couples vous enverront une demande, ils apparaitront ici dans votre CRM."
        />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <KpiCard label="Total" value={kpis.total} dotColor="bg-gray-400" />
            <KpiCard label="En attente" value={kpis.pending} dotColor="bg-amber-400" />
            <KpiCard label="Acceptes" value={kpis.accepted} dotColor="bg-emerald-400" />
            <KpiCard label="Termines" value={kpis.completed} dotColor="bg-blue-400" />
            <KpiCard label="Refuses" value={kpis.rejected} dotColor="bg-red-400" />
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, message, lieu, tag..."
                className="pl-9 h-9 bg-white border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={v => setStatusFilter(v as RequestStatus | 'all')}
              >
                <SelectTrigger className="w-full sm:w-36 h-9 text-sm rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="accepted">Acceptes</SelectItem>
                  <SelectItem value="completed">Termines</SelectItem>
                  <SelectItem value="rejected">Refuses</SelectItem>
                  <SelectItem value="cancelled">Annules</SelectItem>
                </SelectContent>
              </Select>

              {/* View toggle */}
              <div className="flex items-center p-0.5 bg-gray-100 rounded-lg">
                {([
                  { mode: 'table' as const, icon: List, label: 'Table' },
                  { mode: 'kanban' as const, icon: LayoutGrid, label: 'Kanban' },
                ] as const).map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setView(mode)}
                    className={cn(
                      'p-1.5 rounded-md transition-all',
                      view === mode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
                    )}
                    title={label}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main content area: Table/Kanban + Detail Panel */}
          <div className="flex gap-4">
            {/* Left: Table or Kanban */}
            <div className={cn(
              'flex-1 min-w-0',
              // On mobile, hide the list when detail is showing
              showDetailMobile && selectedContact ? 'hidden lg:block' : ''
            )}>
              {view === 'table' ? (
                <CRMTableView
                  contacts={filtered}
                  selectedId={selectedContact?.requestId ?? null}
                  onSelect={handleSelect}
                  sort={sort}
                  onSort={handleSort}
                />
              ) : (
                <CRMKanbanView
                  contacts={filtered}
                  selectedId={selectedContact?.requestId ?? null}
                  onSelect={handleSelect}
                />
              )}
            </div>

            {/* Right: Detail panel - responsive */}
            {/* Desktop: fixed side panel */}
            <div className={cn(
              'hidden lg:block w-[380px] flex-shrink-0 border border-gray-200 rounded-xl overflow-hidden bg-white',
              !selectedContact && 'flex items-center justify-center'
            )}>
              <CRMDetailPanel
                contact={selectedContact}
                onClose={() => setSelectedContact(null)}
                onTagsChange={handleTagsChange}
              />
            </div>

            {/* Mobile: full-screen overlay */}
            {showDetailMobile && selectedContact && (
              <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                  <button
                    onClick={() => setShowDetailMobile(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-semibold text-gray-900">Retour aux contacts</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <CRMDetailPanel
                    contact={selectedContact}
                    onClose={() => setShowDetailMobile(false)}
                    onTagsChange={handleTagsChange}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
