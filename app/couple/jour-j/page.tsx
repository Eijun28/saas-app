'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, SlidersHorizontal, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageTitle } from '@/components/couple/shared/PageTitle'
import { ProgramTimeline } from '@/components/wedding-day-program/ProgramTimeline'
import { ProgramForm } from '@/components/wedding-day-program/ProgramForm'
import { useUser } from '@/hooks/use-user'
import type { ProgramItem, ProgramCategory } from '@/types/wedding-day-program'
import {
  CATEGORY_LABELS,
  sortProgramItems,
  formatTime,
} from '@/types/wedding-day-program'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JourJPage() {
  const { user }                            = useUser()
  const [items, setItems]                   = useState<ProgramItem[]>([])
  const [loading, setLoading]               = useState(true)
  const [showAddForm, setShowAddForm]       = useState(false)
  const [filterCategory, setFilterCategory] = useState<ProgramCategory | 'all'>('all')
  const [filtersOpen, setFiltersOpen]       = useState(false)

  // ─── Chargement ─────────────────────────────────────────────────────────────

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch('/api/wedding-day-program')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems(sortProgramItems(data.items ?? []))
    } catch {
      toast.error('Impossible de charger le programme')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    loadItems()
  }, [user, loadItems])

  // ─── Mutations ──────────────────────────────────────────────────────────────

  function handleItemAdded(item: ProgramItem) {
    setItems(prev => sortProgramItems([...prev, item]))
  }

  function handleItemUpdated(updated: ProgramItem) {
    setItems(prev => sortProgramItems(prev.map(i => i.id === updated.id ? updated : i)))
  }

  function handleItemDeleted(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  // ─── Filtres ────────────────────────────────────────────────────────────────

  const filtered = filterCategory === 'all'
    ? items
    : items.filter(i => i.category === filterCategory)

  const hasActiveFilter = filterCategory !== 'all'

  // ─── Export texte basique ───────────────────────────────────────────────────

  function handleExport() {
    if (items.length === 0) { toast.error('Aucun créneau à exporter'); return }
    const lines = [
      'PROGRAMME DU JOUR J',
      '═══════════════════',
      '',
      ...items.map(item => {
        const time = formatTime(item.start_time) + (item.end_time ? ` → ${formatTime(item.end_time)}` : '')
        const parts = [`${time}  ${item.title}`]
        if (item.location)    parts.push(`  📍 ${item.location}`)
        if (item.responsible) parts.push(`  👤 ${item.responsible}`)
        if (item.description) parts.push(`  ${item.description}`)
        return parts.join('\n')
      }),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'programme-jour-j.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Programme exporté')
  }

  // ─── Stats rapides ──────────────────────────────────────────────────────────

  const firstItem = items[0]
  const lastItem  = items[items.length - 1]

  return (
    <div className="w-full space-y-6">

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <PageTitle
          title="Programme du Jour J"
          description={
            items.length === 0
              ? 'Planifiez votre journée heure par heure'
              : `${items.length} créneau${items.length > 1 ? 'x' : ''} · ${firstItem ? formatTime(firstItem.start_time) : ''} → ${lastItem ? formatTime(lastItem.end_time ?? lastItem.start_time) : ''}`
          }
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={handleExport}
            className="h-10 w-10 rounded-xl"
            title="Exporter le programme"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-[#823F91] hover:bg-[#6D3478] text-white rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Ajouter un créneau</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </div>
      </div>

      {/* Filtres */}
      {!loading && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(p => !p)}
            className={`h-9 gap-2 rounded-xl ${filtersOpen ? 'bg-purple-50 border-purple-200 text-[#823F91]' : ''}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtrer par catégorie
          </Button>

          {filtersOpen && (
            <Select
              value={filterCategory}
              onValueChange={v => setFilterCategory(v as ProgramCategory | 'all')}
            >
              <SelectTrigger className="h-9 w-52 rounded-xl">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {(Object.entries(CATEGORY_LABELS) as [ProgramCategory, string][]).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterCategory('all')}
              className="h-9 gap-1.5 text-gray-500 hover:text-gray-700 rounded-xl"
            >
              <X className="h-3.5 w-3.5" />
              Réinitialiser
            </Button>
          )}
        </motion.div>
      )}

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="hidden sm:block h-10 w-20 bg-gray-100 rounded-lg animate-pulse flex-shrink-0" />
                <div className="hidden sm:block h-3 w-3 rounded-full bg-gray-100 animate-pulse mt-3.5 flex-shrink-0" />
                <div
                  className="flex-1 rounded-2xl border border-gray-100 animate-pulse"
                  style={{ height: `${60 + i * 12}px` }}
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            {hasActiveFilter && (
              <p className="text-sm text-gray-500 mb-3">
                {filtered.length} créneau{filtered.length > 1 ? 'x' : ''} · {CATEGORY_LABELS[filterCategory as ProgramCategory]}
              </p>
            )}
            <ProgramTimeline
              items={filtered}
              onUpdated={handleItemUpdated}
              onDeleted={handleItemDeleted}
            />
          </>
        )}
      </motion.div>

      {/* Dialog ajout */}
      <ProgramForm
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSaved={handleItemAdded}
      />
    </div>
  )
}
