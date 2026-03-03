'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Users, Download, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RsvpBadge } from './RsvpBadge'
import type { Guest } from '@/types/guest'

interface GuestSeatingPlanProps {
  guests: Guest[]
  onUpdated: (guest: Guest) => void
}

const MAX_TABLES = 20

export function GuestSeatingPlan({ guests, onUpdated }: GuestSeatingPlanProps) {
  const existingMax = Math.max(0, ...guests.map(g => g.table_number ?? 0))
  const [tableCount, setTableCount] = useState(Math.max(existingMax, 3))
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const unassigned = guests.filter(g => !g.table_number)
  const tables = Array.from({ length: tableCount }, (_, i) => i + 1).map(n => ({
    number: n,
    guests: guests.filter(g => g.table_number === n),
  }))

  async function assignTable(guest: Guest, tableNumber: number | null) {
    if (updatingId === guest.id) return
    setUpdatingId(guest.id)
    try {
      const res = await fetch(`/api/guests/${guest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_number: tableNumber }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      onUpdated(data.guest)
    } catch {
      toast.error('Impossible de mettre à jour la table')
    } finally {
      setUpdatingId(null)
    }
  }

  function exportPDF() {
    const assignedTables = tables.filter(t => t.guests.length > 0)
    const totalAssigned = guests.filter(g => g.table_number).length

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Plan de table</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; padding: 24px; }
  h1 { font-size: 22px; color: #6D3478; margin-bottom: 4px; }
  .subtitle { font-size: 12px; color: #666; margin-bottom: 20px; }
  .tables { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .table-card { border: 1px solid #E8D4EF; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
  .table-header { background: #F5F0F7; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; }
  .table-name { font-size: 13px; font-weight: 700; color: #6D3478; }
  .table-count { font-size: 11px; color: #823F91; }
  .table-body { padding: 8px 12px; }
  .guest-row { padding: 4px 0; border-bottom: 1px solid #f5f0f7; font-size: 11px; color: #374151; }
  .guest-row:last-child { border-bottom: none; }
  .plus-one { color: #9ca3af; font-size: 10px; }
  .unassigned { margin-top: 20px; border: 1px solid #FCD34D; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
  .unassigned-header { background: #FFFBEB; padding: 8px 12px; }
  .unassigned-title { font-size: 13px; font-weight: 700; color: #92400E; }
  .unassigned-list { padding: 8px 12px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px 16px; }
  @media print { @page { margin: 1cm; } body { padding: 0; } }
</style>
</head>
<body>
<h1>Plan de table</h1>
<p class="subtitle">${totalAssigned} invité${totalAssigned > 1 ? 's' : ''} placé${totalAssigned > 1 ? 's' : ''} · ${unassigned.length} sans table · ${assignedTables.length} table${assignedTables.length > 1 ? 's' : ''}</p>
<div class="tables">
${assignedTables.map(t => `<div class="table-card">
  <div class="table-header">
    <span class="table-name">Table ${t.number}</span>
    <span class="table-count">${t.guests.length} pers.</span>
  </div>
  <div class="table-body">
    ${t.guests.map(g => `<div class="guest-row">${g.first_name} ${g.last_name || ''}${g.plus_one ? `<span class="plus-one"> (+1${g.plus_one_name ? ' · ' + g.plus_one_name : ''})</span>` : ''}</div>`).join('')}
  </div>
</div>`).join('')}
</div>
${unassigned.length > 0 ? `<div class="unassigned">
  <div class="unassigned-header"><span class="unassigned-title">Sans table assignée (${unassigned.length})</span></div>
  <div class="unassigned-list">
    ${unassigned.map(g => `<div class="guest-row">${g.first_name} ${g.last_name || ''}</div>`).join('')}
  </div>
</div>` : ''}
</body>
</html>`

    const w = window.open('', '_blank')
    if (!w) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression. Vérifiez les popups.")
      return
    }
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print() }, 400)
  }

  return (
    <div className="space-y-6">

      {/* Contrôles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">Nombre de tables :</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTableCount(n => Math.max(1, n - 1))}
              className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-bold text-[#823F91]">{tableCount}</span>
            <button
              onClick={() => setTableCount(n => Math.min(MAX_TABLES, n + 1))}
              className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-xs text-gray-400">
            {guests.filter(g => g.table_number).length}/{guests.length} placé{guests.filter(g => g.table_number).length > 1 ? 's' : ''}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportPDF}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Exporter PDF
        </Button>
      </div>

      {/* Invités sans table */}
      {unassigned.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            {unassigned.length} invité{unassigned.length > 1 ? 's' : ''} sans table
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {unassigned.map(guest => (
              <div
                key={guest.id}
                className="flex items-center justify-between gap-3 bg-white rounded-lg px-3 py-2.5 border border-amber-100 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {guest.first_name} {guest.last_name}
                    {guest.plus_one && <span className="text-xs text-gray-400 ml-1">+1</span>}
                  </p>
                  <RsvpBadge status={guest.rsvp_status} className="mt-1 scale-90 origin-left" />
                </div>
                <Select
                  value=""
                  onValueChange={v => assignTable(guest, parseInt(v))}
                  disabled={updatingId === guest.id}
                >
                  <SelectTrigger className="h-8 w-28 text-xs border-gray-200 flex-shrink-0">
                    <SelectValue placeholder="Table..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: tableCount }, (_, i) => i + 1).map(n => (
                      <SelectItem key={n} value={String(n)} className="text-xs">
                        Table {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grille des tables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map(table => (
          <motion.div
            key={table.number}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: table.number * 0.02 }}
            className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
          >
            {/* En-tête table */}
            <div className="px-4 py-2.5 bg-[#F5F0F7] border-b border-[#E8D4EF] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#6D3478]">Table {table.number}</h3>
              <span className="text-xs text-[#823F91]/70 font-medium">
                {table.guests.length} pers.
              </span>
            </div>

            {/* Liste des invités */}
            <div className="p-3 min-h-[72px]">
              {table.guests.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4 italic">Table vide</p>
              ) : (
                <div className="space-y-1">
                  {table.guests.map(guest => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between gap-2 py-1 px-1 rounded-md hover:bg-gray-50 group transition-colors"
                    >
                      <p className="text-xs font-medium text-gray-900 truncate flex-1">
                        {guest.first_name} {guest.last_name}
                        {guest.plus_one && <span className="text-gray-400 font-normal"> +1</span>}
                      </p>
                      {/* Changer de table au survol */}
                      <Select
                        value={String(table.number)}
                        onValueChange={v => assignTable(guest, v === '0' ? null : parseInt(v))}
                        disabled={updatingId === guest.id}
                      >
                        <SelectTrigger className="h-6 w-20 text-[10px] border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0" className="text-xs text-amber-600">Retirer</SelectItem>
                          {Array.from({ length: tableCount }, (_, i) => i + 1).map(n => (
                            <SelectItem key={n} value={String(n)} className="text-xs">
                              Table {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
