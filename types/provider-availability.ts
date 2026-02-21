// ─────────────────────────────────────────────────────────────────────────────
// Types – Disponibilités prestataire
// ─────────────────────────────────────────────────────────────────────────────

export type AvailabilityStatus = 'unavailable' | 'tentative'

export interface AvailabilitySlot {
  id:          string
  provider_id: string
  start_date:  string   // "YYYY-MM-DD"
  end_date:    string   // "YYYY-MM-DD"
  status:      AvailabilityStatus
  note:        string | null
  is_public:   boolean
  created_at:  string
  updated_at:  string
}

/** Version publique — sans is_public, created_at, updated_at */
export interface PublicAvailabilitySlot {
  id:          string
  provider_id: string
  start_date:  string
  end_date:    string
  status:      AvailabilityStatus
  note:        string | null
}

export interface CreateAvailabilityInput {
  start_date: string        // "YYYY-MM-DD"
  end_date:   string        // "YYYY-MM-DD"
  status?:    AvailabilityStatus
  note?:      string | null
  is_public?: boolean
}

export interface UpdateAvailabilityInput extends Partial<CreateAvailabilityInput> {}

// ─── Constantes UI ───────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  AvailabilityStatus,
  { label: string; color: string; bg: string; text: string; border: string; calBg: string; calText: string }
> = {
  unavailable: {
    label:   'Indisponible',
    color:   '#ef4444',
    bg:      'bg-red-50',
    text:    'text-red-700',
    border:  'border-red-200',
    calBg:   'bg-red-100',
    calText: 'text-red-600',
  },
  tentative: {
    label:   'Option posée',
    color:   '#f97316',
    bg:      'bg-orange-50',
    text:    'text-orange-700',
    border:  'border-orange-200',
    calBg:   'bg-orange-100',
    calText: 'text-orange-600',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Retourne l'ensemble des dates "YYYY-MM-DD" couvertes par un slot */
export function expandSlotDates(slot: { start_date: string; end_date: string }): Set<string> {
  const dates = new Set<string>()
  const cur   = new Date(slot.start_date)
  const end   = new Date(slot.end_date)
  while (cur <= end) {
    dates.add(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

/** Construit une Map date → slot le plus restrictif parmi une liste */
export function buildDateMap(
  slots: (AvailabilitySlot | PublicAvailabilitySlot)[]
): Map<string, AvailabilityStatus> {
  const map = new Map<string, AvailabilityStatus>()
  for (const slot of slots) {
    const dates = expandSlotDates(slot)
    for (const d of dates) {
      // unavailable > tentative
      if (!map.has(d) || slot.status === 'unavailable') {
        map.set(d, slot.status)
      }
    }
  }
  return map
}

/** Formate une plage de dates pour l'affichage */
export function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  if (start === end) return fmt(start)
  return `${fmt(start)} → ${fmt(end)}`
}

/** Calcule le nombre de jours d'une plage */
export function slotDurationDays(start: string, end: string): number {
  const d1 = new Date(start)
  const d2 = new Date(end)
  return Math.round((d2.getTime() - d1.getTime()) / 86_400_000) + 1
}
