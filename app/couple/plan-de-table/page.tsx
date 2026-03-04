'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Users, LayoutGrid, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageTitle } from '@/components/couple/shared/PageTitle'
import { TableCard } from '@/components/guests/TableCard'
import { TableForm } from '@/components/guests/TableForm'
import type { ReceptionTable, Guest } from '@/types/guest'
import { useUser } from '@/hooks/use-user'

// ─── Types locaux ──────────────────────────────────────────────────────────────

type TableGuest = Pick<Guest,
  'id' | 'first_name' | 'last_name' | 'rsvp_status' |
  'dietary_restrictions' | 'plus_one' | 'plus_one_name' |
  'table_number' | 'side' | 'category'
>

interface TableWithGuests extends ReceptionTable {
  guests: TableGuest[]
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PlanDeTablePage() {
  const { user }                              = useUser()
  const [tables, setTables]                   = useState<TableWithGuests[]>([])
  const [unassigned, setUnassigned]           = useState<TableGuest[]>([])
  const [loading, setLoading]                 = useState(true)
  const [showForm, setShowForm]               = useState(false)
  const [editingTable, setEditingTable]       = useState<ReceptionTable | null>(null)

  // ─── Stats ──────────────────────────────────────────────────────────────────

  const totalSeats     = tables.reduce((s, t) => s + t.capacity, 0)
  const totalAssigned  = tables.reduce((s, t) => s + t.guests.length + t.guests.filter(g => g.plus_one).length, 0)
  const totalGuests    = totalAssigned + unassigned.length

  // ─── Chargement ─────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/guests/tables')
      if (!res.ok) throw new Error()
      const json = await res.json()
      setTables(json.tables ?? [])
      setUnassigned(json.unassigned ?? [])
    } catch {
      toast.error('Impossible de charger le plan de table')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    load()
  }, [user, load])

  // ─── Mutations ──────────────────────────────────────────────────────────────

  function handleTableSaved(saved: ReceptionTable) {
    setTables(prev => {
      const exists = prev.find(t => t.id === saved.id)
      if (exists) {
        return prev.map(t => t.id === saved.id ? { ...saved, guests: t.guests } : t)
      }
      return [...prev, { ...saved, guests: [] }].sort((a, b) => a.table_number - b.table_number)
    })
    setEditingTable(null)
  }

  async function handleDeleteTable(id: string) {
    const table = tables.find(t => t.id === id)
    if (!table) return
    if (!confirm(`Supprimer la table ${table.table_number} ? Les invités seront désassignés.`)) return

    try {
      const res = await fetch(`/api/guests/tables/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      // Remettre les invités de cette table dans "unassigned"
      const freed = table.guests.map(g => ({ ...g, table_number: null }))
      setTables(prev => prev.filter(t => t.id !== id))
      setUnassigned(prev => [...prev, ...freed])
      toast.success('Table supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  async function handleAssign(guestId: string, tableNumber: number) {
    try {
      const res = await fetch(`/api/guests/${guestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_number: tableNumber }),
      })
      if (!res.ok) throw new Error()

      const guest = unassigned.find(g => g.id === guestId)
      if (!guest) return

      setUnassigned(prev => prev.filter(g => g.id !== guestId))
      setTables(prev => prev.map(t =>
        t.table_number === tableNumber
          ? { ...t, guests: [...t.guests, { ...guest, table_number: tableNumber }] }
          : t
      ))
    } catch {
      toast.error('Erreur lors de l\'assignation')
    }
  }

  async function handleUnassign(guestId: string) {
    try {
      const res = await fetch(`/api/guests/${guestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_number: null }),
      })
      if (!res.ok) throw new Error()

      let freed: TableGuest | undefined
      setTables(prev => prev.map(t => {
        const found = t.guests.find(g => g.id === guestId)
        if (found) {
          freed = { ...found, table_number: null }
          return { ...t, guests: t.guests.filter(g => g.id !== guestId) }
        }
        return t
      }))
      if (freed) setUnassigned(prev => [...prev, freed!])
    } catch {
      toast.error('Erreur lors de la désassignation')
    }
  }

  const usedNumbers = tables.map(t => t.table_number)

  // ─── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-6">

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <PageTitle
          title="Plan de table"
          description={
            tables.length > 0
              ? `${tables.length} table${tables.length > 1 ? 's' : ''} · ${totalAssigned}/${totalSeats} places · ${unassigned.length} invité${unassigned.length > 1 ? 's' : ''} sans table`
              : 'Organisez la disposition de vos invités'
          }
        />
        <Button
          onClick={() => { setEditingTable(null); setShowForm(true) }}
          className="bg-[#823F91] hover:bg-[#6D3478] text-white rounded-xl gap-2 flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouvelle table</span>
          <span className="sm:hidden">Table</span>
        </Button>
      </div>

      {/* Statistiques rapides */}
      {!loading && tables.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: 'Tables',          value: tables.length,               color: 'text-[#823F91]', bg: 'bg-[#E8D4EF]/60' },
            { label: 'Places totales',  value: totalSeats,                  color: 'text-blue-600',  bg: 'bg-blue-50' },
            { label: 'Placés',          value: totalAssigned,               color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Sans table',      value: unassigned.length,           color: totalGuests > 0 && unassigned.length > 0 ? 'text-amber-600' : 'text-gray-600', bg: totalGuests > 0 && unassigned.length > 0 ? 'bg-amber-50' : 'bg-gray-50' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-3 flex flex-col gap-0.5`}>
              <span className={`text-xl font-bold ${color}`}>{value}</span>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* État vide */}
      {!loading && tables.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-[#E8D4EF]/60 flex items-center justify-center mb-4">
            <LayoutGrid className="h-7 w-7 text-[#823F91]" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Aucune table créée</h3>
          <p className="text-sm text-gray-500 mb-5">
            Commencez par créer vos tables pour organiser le placement de vos invités.
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#823F91] hover:bg-[#6D3478] text-white rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            Créer la première table
          </Button>
        </motion.div>
      )}

      {/* Grille de tables */}
      {!loading && tables.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((table, i) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <TableCard
                table={table}
                unassigned={unassigned}
                onEdit={(t) => { setEditingTable(t); setShowForm(true) }}
                onDelete={handleDeleteTable}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Invités sans table */}
      {!loading && unassigned.length > 0 && tables.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-2xl bg-amber-50 border border-amber-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-700">
              {unassigned.length} invité{unassigned.length > 1 ? 's' : ''} sans table assignée
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {unassigned.map((g) => (
              <span
                key={g.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full text-[12px] font-medium text-amber-700 border border-amber-200"
              >
                <Users className="h-3 w-3" />
                {g.first_name} {g.last_name}
                {g.plus_one && <span className="opacity-60 text-[10px]">+1</span>}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Dialog création/édition */}
      <TableForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingTable(null) }}
        onSaved={handleTableSaved}
        existingTable={editingTable}
        usedNumbers={usedNumbers}
      />
    </div>
  )
}
