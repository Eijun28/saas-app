'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageTitle } from '@/components/prestataire/shared/PageTitle'
import { AvailabilityMiniCalendar } from '@/components/provider-availability/AvailabilityMiniCalendar'
import { SlotList }                 from '@/components/provider-availability/SlotList'
import { SlotForm }                 from '@/components/provider-availability/SlotForm'
import { useUser }                  from '@/hooks/use-user'
import type { AvailabilitySlot }    from '@/types/provider-availability'
import { buildDateMap }             from '@/types/provider-availability'

export default function DisponibilitesPage() {
  const { user }                          = useUser()
  const [slots, setSlots]                 = useState<AvailabilitySlot[]>([])
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>()

  // ─── Chargement ─────────────────────────────────────────────────────────────

  const loadSlots = useCallback(async () => {
    try {
      const res = await fetch('/api/provider-availability')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSlots(data.slots ?? [])
    } catch {
      toast.error('Impossible de charger les disponibilités')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    loadSlots()
  }, [user, loadSlots])

  // ─── Date map pour le calendrier ─────────────────────────────────────────────

  const dateMap = useMemo(() => buildDateMap(slots), [slots])

  // ─── Mutations ──────────────────────────────────────────────────────────────

  function handleSlotAdded(slot: AvailabilitySlot) {
    setSlots(prev => [...prev, slot].sort((a, b) => a.start_date.localeCompare(b.start_date)))
  }

  function handleSlotUpdated(updated: AvailabilitySlot) {
    setSlots(prev =>
      [...prev.map(s => s.id === updated.id ? updated : s)]
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
    )
  }

  function handleSlotDeleted(id: string) {
    setSlots(prev => prev.filter(s => s.id !== id))
  }

  function handleDayClick(date: string) {
    setPrefilledDate(date)
    setShowForm(true)
  }

  // ─── Statistiques rapides ────────────────────────────────────────────────────

  const publicCount  = slots.filter(s => s.is_public).length
  const privateCount = slots.filter(s => !s.is_public).length

  // ─── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-6">

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <PageTitle
          title="Mes disponibilités"
          description={
            slots.length === 0
              ? 'Bloquez les dates où vous n\'êtes pas disponible'
              : `${slots.length} période${slots.length > 1 ? 's' : ''} bloquée${slots.length > 1 ? 's' : ''} · ${publicCount} publique${publicCount > 1 ? 's' : ''}${privateCount > 0 ? ` · ${privateCount} privée${privateCount > 1 ? 's' : ''}` : ''}`
          }
        />
        <Button
          onClick={() => { setPrefilledDate(undefined); setShowForm(true) }}
          className="bg-[#823F91] hover:bg-[#6D3478] text-white rounded-xl gap-2 flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Bloquer une période</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </div>

      {/* Bandeau info */}
      <div className="flex items-start gap-3 rounded-xl bg-purple-50 border border-purple-100 p-4">
        <Info className="h-4 w-4 text-[#823F91] mt-0.5 flex-shrink-0" />
        <p className="text-[13px] text-[#823F91]">
          Par défaut vous êtes considéré·e <strong>disponible</strong> sur toute l'année.
          Bloquez uniquement les dates où vous ne l'êtes pas (mariages déjà réservés, congés…).
          Les couples voient vos périodes marquées comme publiques.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Calendrier */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Aperçu du calendrier</h2>
          {loading ? (
            <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <AvailabilityMiniCalendar
              dateMap={dateMap}
              onDayClick={handleDayClick}
              interactive
              monthCount={1}
            />
          )}
          <p className="text-[11px] text-gray-400 mt-3 text-center">
            Cliquez sur une date pour bloquer rapidement ce jour
          </p>
        </div>

        {/* Liste des slots */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Périodes bloquées</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-xl bg-gray-50 animate-pulse" />
              ))}
            </div>
          ) : (
            <SlotList
              slots={slots}
              onUpdated={handleSlotUpdated}
              onDeleted={handleSlotDeleted}
            />
          )}
        </div>
      </motion.div>

      {/* Dialog ajout */}
      <SlotForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={slot => { handleSlotAdded(slot); setShowForm(false) }}
        defaultDate={prefilledDate}
      />
    </div>
  )
}
