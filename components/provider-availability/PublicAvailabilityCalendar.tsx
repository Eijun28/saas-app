'use client'

import { useState, useEffect, useMemo } from 'react'
import { Loader2, CalendarCheck2 } from 'lucide-react'
import { AvailabilityMiniCalendar } from './AvailabilityMiniCalendar'
import type { PublicAvailabilitySlot } from '@/types/provider-availability'
import { buildDateMap } from '@/types/provider-availability'

interface PublicAvailabilityCalendarProps {
  /** UUID du prestataire */
  providerId: string
  /** Afficher 1 ou 2 mois */
  monthCount?: 1 | 2
}

/**
 * Composant consommable depuis n'importe quelle page (profil public, couple/matching…).
 * Charge automatiquement les disponibilités publiques du prestataire.
 */
export function PublicAvailabilityCalendar({
  providerId,
  monthCount = 2,
}: PublicAvailabilityCalendarProps) {
  const [slots, setSlots]   = useState<PublicAvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!providerId) return
    setLoading(true)
    fetch(`/api/provider-availability/public/${providerId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setSlots(d.slots ?? [])
      })
      .catch(e => setError(e.message ?? 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [providerId])

  const dateMap = useMemo(() => buildDateMap(slots), [slots])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Chargement des disponibilités…</span>
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-red-500 text-center py-6">{error}</p>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <CalendarCheck2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-700">Disponible</p>
        <p className="text-xs text-gray-400 mt-1">
          Ce prestataire n'a pas de dates bloquées dans les 12 prochains mois
        </p>
      </div>
    )
  }

  return (
    <AvailabilityMiniCalendar
      dateMap={dateMap}
      monthCount={monthCount}
      interactive={false}
    />
  )
}
