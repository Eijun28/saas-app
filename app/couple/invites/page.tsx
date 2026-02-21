'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { UserPlus, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageTitle } from '@/components/couple/shared/PageTitle'
import { GuestStatsCards } from '@/components/guests/GuestStatsCards'
import { GuestTable } from '@/components/guests/GuestTable'
import { GuestForm } from '@/components/guests/GuestForm'
import { useUser } from '@/hooks/use-user'
import type { Guest, GuestStats, GuestSide, GuestCategory, RsvpStatus } from '@/types/guest'
import { SIDE_LABELS, CATEGORY_LABELS, RSVP_LABELS } from '@/types/guest'

// ─── Filtres ──────────────────────────────────────────────────────────────────

interface Filters {
  search:      string
  side:        GuestSide | 'all'
  category:    GuestCategory | 'all'
  rsvp_status: RsvpStatus | 'all'
}

const DEFAULT_FILTERS: Filters = {
  search:      '',
  side:        'all',
  category:    'all',
  rsvp_status: 'all',
}

const EMPTY_STATS: GuestStats = {
  total: 0, confirmed: 0, declined: 0, pending: 0, maybe: 0,
  total_with_plus_ones: 0,
  by_side:     { partner_1: 0, partner_2: 0, commun: 0 },
  by_category: { famille: 0, ami: 0, collegue: 0, autre: 0 },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvitesPage() {
  const { user }                                = useUser()
  const [guests, setGuests]                     = useState<Guest[]>([])
  const [stats, setStats]                       = useState<GuestStats>(EMPTY_STATS)
  const [loading, setLoading]                   = useState(true)
  const [showAddForm, setShowAddForm]           = useState(false)
  const [filters, setFilters]                   = useState<Filters>(DEFAULT_FILTERS)
  const [filtersOpen, setFiltersOpen]           = useState(false)

  // ─── Chargement des données ─────────────────────────────────────────────────

  const loadGuests = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.search)                       params.set('search',      filters.search)
      if (filters.side !== 'all')               params.set('side',        filters.side)
      if (filters.category !== 'all')           params.set('category',    filters.category)
      if (filters.rsvp_status !== 'all')        params.set('rsvp_status', filters.rsvp_status)

      const [guestsRes, statsRes] = await Promise.all([
        fetch(`/api/guests?${params.toString()}`),
        fetch('/api/guests/stats'),
      ])

      if (!guestsRes.ok || !statsRes.ok) throw new Error('Erreur lors du chargement')

      const [guestsData, statsData] = await Promise.all([
        guestsRes.json(),
        statsRes.json(),
      ])

      setGuests(guestsData.guests ?? [])
      setStats(statsData.stats ?? EMPTY_STATS)
    } catch {
      toast.error('Impossible de charger la liste des invités')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    loadGuests()
  }, [user, loadGuests])

  // ─── Handlers mutations ─────────────────────────────────────────────────────

  function handleGuestAdded(guest: Guest) {
    setGuests(prev => [guest, ...prev])
    // Recharger les stats
    fetch('/api/guests/stats')
      .then(r => r.json())
      .then(d => setStats(d.stats ?? EMPTY_STATS))
      .catch(() => {})
  }

  function handleGuestUpdated(updated: Guest) {
    setGuests(prev => prev.map(g => g.id === updated.id ? updated : g))
    fetch('/api/guests/stats')
      .then(r => r.json())
      .then(d => setStats(d.stats ?? EMPTY_STATS))
      .catch(() => {})
  }

  function handleGuestDeleted(id: string) {
    setGuests(prev => prev.filter(g => g.id !== id))
    fetch('/api/guests/stats')
      .then(r => r.json())
      .then(d => setStats(d.stats ?? EMPTY_STATS))
      .catch(() => {})
  }

  // ─── Reset filtres ──────────────────────────────────────────────────────────

  const hasActiveFilters =
    filters.search !== '' ||
    filters.side !== 'all' ||
    filters.category !== 'all' ||
    filters.rsvp_status !== 'all'

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
  }

  // ─── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-6">

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <PageTitle
          title="Gestion des invités"
          description={`${stats.total} invité${stats.total > 1 ? 's' : ''} · ${stats.confirmed} confirmé${stats.confirmed > 1 ? 's' : ''} · ${stats.pending} en attente`}
        />
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-[#823F91] hover:bg-[#6D3478] text-white rounded-xl gap-2 flex-shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter un invité</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </div>

      {/* Statistiques */}
      {!loading && <GuestStatsCards stats={stats} />}

      {/* Barre de filtres */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          {/* Recherche */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
              placeholder="Rechercher un invité..."
              className="pl-9 h-10 rounded-xl border-gray-200"
            />
          </div>

          {/* Toggle filtres avancés */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFiltersOpen(p => !p)}
            className={`h-10 w-10 rounded-xl flex-shrink-0 ${filtersOpen ? 'bg-purple-50 border-purple-200 text-[#823F91]' : ''}`}
            aria-label="Filtres avancés"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>

          {/* Réinitialiser */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-10 gap-1.5 text-gray-500 hover:text-gray-700 rounded-xl"
            >
              <X className="h-3.5 w-3.5" />
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Filtres avancés */}
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {/* Filtre côté */}
            <Select
              value={filters.side}
              onValueChange={v => setFilters(p => ({ ...p, side: v as Filters['side'] }))}
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Tous les côtés" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les côtés</SelectItem>
                {(Object.entries(SIDE_LABELS) as [GuestSide, string][]).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtre catégorie */}
            <Select
              value={filters.category}
              onValueChange={v => setFilters(p => ({ ...p, category: v as Filters['category'] }))}
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {(Object.entries(CATEGORY_LABELS) as [GuestCategory, string][]).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtre RSVP */}
            <Select
              value={filters.rsvp_status}
              onValueChange={v => setFilters(p => ({ ...p, rsvp_status: v as Filters['rsvp_status'] }))}
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts RSVP</SelectItem>
                {(Object.entries(RSVP_LABELS) as [RsvpStatus, string][]).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}
      </motion.div>

      {/* Liste des invités */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Compteur résultats filtrés */}
            {hasActiveFilters && (
              <p className="text-sm text-gray-500 mb-3">
                {guests.length} résultat{guests.length > 1 ? 's' : ''} trouvé{guests.length > 1 ? 's' : ''}
              </p>
            )}
            <GuestTable
              guests={guests}
              onAdded={handleGuestAdded}
              onUpdated={handleGuestUpdated}
              onDeleted={handleGuestDeleted}
            />
          </>
        )}
      </motion.div>

      {/* Dialog ajout invité */}
      <GuestForm
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSaved={handleGuestAdded}
      />
    </div>
  )
}
