'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, RefreshCw, LayoutGrid, List } from 'lucide-react'
import { LoadingSpinner } from '@/components/prestataire/shared/LoadingSpinner'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import { DemandeCard } from '@/components/prestataire/demandes/DemandeCard'
import { KanbanView } from '@/components/prestataire/demandes/KanbanView'
import { RequestFilters, DEFAULT_FILTERS } from '@/components/prestataire/demandes/RequestFilters'
import { RequestDetailSheet } from '@/components/prestataire/demandes/RequestDetailSheet'
import { PageTitle } from '@/components/prestataire/shared/PageTitle'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Demande, UIState } from '@/lib/types/prestataire'
import type { RequestTag } from '@/components/prestataire/demandes/RequestTags'
import { createMissingConversations } from '@/lib/supabase/fix-conversations'
import { extractSupabaseError } from '@/lib/utils'
import { getCouplesByUserIds } from '@/lib/supabase/queries/couples.queries'
import type { DemandeFilters } from '@/components/prestataire/demandes/RequestFilters'
import { cn } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RequestWithCouple {
  id: string
  couple_id: string
  provider_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
  initial_message: string
  created_at: string
  couple?: { partner_1_name?: string; partner_2_name?: string; wedding_date?: string } | null
  budget_min?: number
  budget_max?: number
  city?: string
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DemandesRecuesPage() {
  const { user } = useUser()

  const [demandes, setDemandes] = useState<{ nouvelles: Demande[]; en_cours: Demande[]; terminees: Demande[] }>({
    nouvelles: [], en_cours: [], terminees: [],
  })
  const [conversationIdsMap, setConversationIdsMap] = useState<Map<string, string>>(new Map())
  // tagsMap : requestId → tags[]
  const [tagsMap, setTagsMap]       = useState<Map<string, RequestTag[]>>(new Map())
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters]       = useState<DemandeFilters>(DEFAULT_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode]     = useState<'list' | 'kanban'>('list')
  const [uiState, setUiState]       = useState<UIState>({ loading: 'idle', error: null })
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)
  const [sheetOpen, setSheetOpen]   = useState(false)
  const [isFixingConversations, setIsFixingConversations] = useState(false)

  // ─── Formatage ───────────────────────────────────────────────────────────────

  const formatAndGroup = (data: RequestWithCouple[]) => {
    const nouvelles: Demande[] = []
    const en_cours:  Demande[] = []
    const terminees: Demande[] = []

    data.forEach(req => {
      const n1 = req.couple?.partner_1_name?.trim() || ''
      const n2 = req.couple?.partner_2_name?.trim() || ''
      const coupleNom = n1 && n2 ? `${n1} & ${n2}` : n1 || n2 || 'Couple'

      const d: Demande = {
        id: req.id,
        couple_id: req.couple_id,
        couple_nom: coupleNom,
        date_evenement: req.couple?.wedding_date || '',
        budget_min: req.budget_min ?? 0,
        budget_max: req.budget_max ?? 0,
        lieu: req.city ?? '',
        statut: req.status === 'pending' ? 'nouvelle'
          : req.status === 'accepted' ? 'en_cours'
          : req.status === 'completed' ? 'terminee'
          : req.status === 'rejected' ? 'refusee'
          : 'annulee',
        message: req.initial_message,
        created_at: req.created_at,
      }

      if (d.statut === 'nouvelle') nouvelles.push(d)
      else if (d.statut === 'en_cours') en_cours.push(d)
      else terminees.push(d)
    })

    return { nouvelles, en_cours, terminees }
  }

  // ─── Chargement ──────────────────────────────────────────────────────────────

  const fetchDemandes = useCallback(async () => {
    if (!user?.id) return
    setUiState({ loading: 'loading', error: null })
    const supabase = createClient()

    const { data: requestsData, error } = await supabase
      .from('requests')
      .select('id, couple_id, provider_id, status, initial_message, created_at')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      const msg = extractSupabaseError(error).message || 'Erreur inconnue'
      toast.error(`Erreur: ${msg}`)
      setUiState({ loading: 'error', error: msg })
      return
    }

    if (!requestsData?.length) {
      setDemandes({ nouvelles: [], en_cours: [], terminees: [] })
      setUiState({ loading: 'success', error: null })
      return
    }

    // Couples
    const coupleIds = Array.from(new Set<string>(requestsData.map((r: any) => r.couple_id as string)))
    const couplesMap = await getCouplesByUserIds(coupleIds, ['user_id', 'partner_1_name', 'partner_2_name', 'wedding_date', 'budget_min', 'budget_max', 'city'])

    const data: RequestWithCouple[] = requestsData.map((r: any) => {
      const c = couplesMap.get(r.couple_id)
      return {
        id: r.id, couple_id: r.couple_id, provider_id: r.provider_id,
        status: r.status, initial_message: r.initial_message || '',
        created_at: r.created_at,
        couple: c ? { partner_1_name: c.partner_1_name ?? undefined, partner_2_name: c.partner_2_name ?? undefined, wedding_date: c.wedding_date ?? undefined } : null,
        budget_min: (c as any)?.budget_min ?? 0,
        budget_max: (c as any)?.budget_max ?? 0,
        city: (c as any)?.city ?? '',
      }
    })

    // Conversations
    const acceptedIds = requestsData.filter((r: any) => r.status === 'accepted').map((r: any) => r.id)
    const convMap = new Map<string, string>()
    if (acceptedIds.length) {
      const { data: convs } = await supabase
        .from('conversations').select('id, request_id').in('request_id', acceptedIds)
      convs?.forEach((c: any) => convMap.set(c.request_id, c.id))
    }

    // Tags — charger tous les tags de ce prestataire en 1 requête
    const { data: allTags } = await supabase
      .from('request_tags')
      .select('id, request_id, tag, color, created_at')
      .eq('provider_id', user.id)

    const newTagsMap = new Map<string, RequestTag[]>()
    allTags?.forEach((t: any) => {
      if (!newTagsMap.has(t.request_id)) newTagsMap.set(t.request_id, [])
      newTagsMap.get(t.request_id)!.push({ id: t.id, tag: t.tag, color: t.color })
    })

    setConversationIdsMap(convMap)
    setTagsMap(newTagsMap)
    setDemandes(formatAndGroup(data))
    setUiState({ loading: 'success', error: null })
  }, [user?.id])

  useEffect(() => { fetchDemandes() }, [fetchDemandes])

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleAccept = async (requestId: string) => {
    if (!user?.id) return
    const supabase = createClient()
    const { data: req, error: fe } = await supabase
      .from('requests').select('id, couple_id, provider_id').eq('id', requestId).eq('provider_id', user.id).single()
    if (fe || !req) { toast.error('Demande introuvable'); return }

    const { error } = await supabase.from('requests').update({ status: 'accepted' }).eq('id', requestId).eq('provider_id', user.id)
    if (error) { toast.error('Erreur lors de l\'acceptation'); return }

    fetch(`/api/prestataire/requests/${requestId}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'accepted' }),
    }).catch(() => {})

    const { data: existingConv } = await supabase.from('conversations').select('id').eq('request_id', requestId).maybeSingle()
    if (!existingConv) {
      await supabase.from('conversations').insert({ request_id: requestId, couple_id: req.couple_id, provider_id: req.provider_id })
    }
    toast.success('Demande acceptée')
    fetchDemandes()
  }

  const handleReject = async (requestId: string) => {
    if (!user?.id) return
    const supabase = createClient()
    const { data: req } = await supabase.from('requests').select('couple_id, provider_id').eq('id', requestId).single()
    const { error } = await supabase.from('requests').update({ status: 'rejected' }).eq('id', requestId).eq('provider_id', user.id)
    if (error) { toast.error('Erreur lors du refus'); return }
    if (req) {
      try {
        const { sendRequestRejectedEmail } = await import('@/lib/email/notifications')
        await sendRequestRejectedEmail(req.couple_id, req.provider_id, requestId)
      } catch {}
    }
    toast.success('Demande refusée')
    fetchDemandes()
  }

  const handleComplete = async (requestId: string) => {
    if (!user?.id) return
    const supabase = createClient()
    const { error } = await supabase
      .from('requests')
      .update({ status: 'completed' })
      .eq('id', requestId)
      .eq('provider_id', user.id)
      .eq('status', 'accepted')
    if (error) { toast.error('Erreur lors de la clôture'); return }
    toast.success('Prestation marquée comme terminée')
    fetchDemandes()
  }

  const handleFixConversations = async () => {
    setIsFixingConversations(true)
    try {
      const result = await createMissingConversations()
      if (result.success) { toast.success(result.message || 'Conversations vérifiées'); fetchDemandes() }
      else toast.error(`Erreur: ${result.error?.message}`)
    } catch { toast.error('Erreur') } finally { setIsFixingConversations(false) }
  }

  const handleCardClick = (demande: Demande) => {
    setSelectedDemande(demande)
    setSheetOpen(true)
  }

  const handleTagsChange = (requestId: string) => (tags: RequestTag[]) => {
    setTagsMap((prev: Map<string, RequestTag[]>) => new Map(prev).set(requestId, tags))
  }

  // ─── Filtrage ────────────────────────────────────────────────────────────────

  const allTagNames = Array.from(new Set(
    (Array.from(tagsMap.values()).flat() as RequestTag[]).map((t: RequestTag) => t.tag)
  ))

  const applyFilters = (list: Demande[]) => {
    return list.filter(d => {
      const q = searchTerm.toLowerCase()
      if (q && !d.couple_nom.toLowerCase().includes(q) && !d.lieu.toLowerCase().includes(q)) return false
      if (filters.tag) {
        const dtags = tagsMap.get(d.id) ?? []
        if (!dtags.some((t: RequestTag) => t.tag === filters.tag)) return false
      }
      if (filters.dateFrom && d.date_evenement && d.date_evenement < filters.dateFrom) return false
      if (filters.dateTo   && d.date_evenement && d.date_evenement > filters.dateTo)   return false
      return true
    })
  }

  const filtered = {
    nouvelles: applyFilters(demandes.nouvelles),
    en_cours:  applyFilters(demandes.en_cours),
    terminees: applyFilters(demandes.terminees),
  }

  const isLoading = uiState.loading === 'loading'
  if (isLoading) return <LoadingSpinner size="lg" text="Chargement des demandes..." />

  // ─── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      <div className="flex items-start justify-between gap-4">
        <PageTitle title="Demandes reçues" description="Gérez toutes vos demandes de prestations" />
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          {/* Toggle list / kanban */}
          <div className="flex items-center p-0.5 bg-gray-100 rounded-lg">
            {([
              { mode: 'list' as const,   icon: List,        label: 'Liste' },
              { mode: 'kanban' as const, icon: LayoutGrid,  label: 'Kanban' },
            ]).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'p-1.5 rounded-md transition-all',
                  viewMode === mode ? 'bg-white shadow-sm text-[#823F91]' : 'text-gray-400 hover:text-gray-600'
                )}
                title={label}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchDemandes}
            disabled={isLoading}
            className="h-8 w-8 rounded-lg"
            title="Rafraîchir"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          placeholder="Rechercher un couple…"
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 bg-white border-gray-200 rounded-xl"
        />
      </div>

      {/* Filtres avancés */}
      <RequestFilters
        filters={filters}
        onChange={setFilters}
        open={filtersOpen}
        onToggle={() => setFiltersOpen((p: boolean) => !p)}
        allTags={allTagNames}
      />

      {/* ── Vue Kanban ── */}
      {viewMode === 'kanban' ? (
        <KanbanView
          nouvelles={filtered.nouvelles}
          en_cours={filtered.en_cours}
          terminees={filtered.terminees}
          tagsMap={tagsMap}
          conversationIdsMap={conversationIdsMap}
          onAccept={handleAccept}
          onReject={handleReject}
          onCardClick={handleCardClick}
        />
      ) : (
        /* ── Vue Liste ── */
        <Tabs defaultValue="nouvelles">
          <TabsList className="w-full h-auto p-1 bg-gray-100/80 rounded-xl grid grid-cols-3 gap-1">
            {([
              { value: 'nouvelles', label: 'Nouvelles', count: filtered.nouvelles.length },
              { value: 'en-cours',  label: 'En cours',  count: filtered.en_cours.length },
              { value: 'terminees', label: 'Terminées', count: filtered.terminees.length },
            ] as const).map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg py-2.5 text-sm font-medium text-gray-600 data-[state=active]:bg-[#823F91] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
              >
                {tab.label}
                {tab.count > 0 && (
                  <Badge className="ml-1.5 bg-[#823F91] data-[state=active]:bg-white data-[state=active]:text-[#823F91] text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px]">
                    {tab.count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Nouvelles */}
          <TabsContent value="nouvelles" className="mt-4">
            {filtered.nouvelles.length === 0
              ? <EmptyState title="Aucune nouvelle demande" description="Les nouvelles demandes apparaîtront ici" />
              : (
                <div className="space-y-3">
                  {filtered.nouvelles.map(d => (
                    <div key={d.id} onClick={() => handleCardClick(d)} className="cursor-pointer">
                      <DemandeCard
                        demande={d}
                        onAccept={handleAccept}
                        onReject={handleReject}
                        tags={tagsMap.get(d.id) ?? []}
                      />
                    </div>
                  ))}
                </div>
              )}
          </TabsContent>

          {/* En cours */}
          <TabsContent value="en-cours" className="mt-4">
            {filtered.en_cours.length === 0
              ? <EmptyState title="Aucune demande en cours" description="Les demandes acceptées apparaîtront ici" />
              : (
                <div className="space-y-3">
                  {filtered.en_cours.map(d => (
                    <div key={d.id} onClick={() => handleCardClick(d)} className="cursor-pointer">
                      <DemandeCard
                        demande={d}
                        onComplete={handleComplete}
                        conversationId={conversationIdsMap.get(d.id) || null}
                        tags={tagsMap.get(d.id) ?? []}
                      />
                    </div>
                  ))}
                </div>
              )}
          </TabsContent>

          {/* Terminées */}
          <TabsContent value="terminees" className="mt-4">
            {filtered.terminees.length === 0
              ? <EmptyState title="Aucune demande terminée" description="L'historique apparaîtra ici" />
              : (
                <div className="space-y-3">
                  {filtered.terminees.map(d => (
                    <div key={d.id} onClick={() => handleCardClick(d)} className="cursor-pointer">
                      <DemandeCard
                        demande={d}
                        conversationId={conversationIdsMap.get(d.id) || null}
                        tags={tagsMap.get(d.id) ?? []}
                      />
                    </div>
                  ))}
                </div>
              )}
          </TabsContent>
        </Tabs>
      )}

      {/* CRM Detail Sheet */}
      <RequestDetailSheet
        demande={selectedDemande}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tags={selectedDemande ? (tagsMap.get(selectedDemande.id) ?? []) : []}
        onTagsChange={selectedDemande ? handleTagsChange(selectedDemande.id) : () => {}}
      />
    </div>
  )
}
