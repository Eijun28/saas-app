// ─────────────────────────────────────────────────────────────────────────────
// Types – Programme du Jour J
// ─────────────────────────────────────────────────────────────────────────────

export type ProgramCategory =
  | 'ceremonie'
  | 'cocktail'
  | 'repas'
  | 'animation'
  | 'logistique'
  | 'beaute'
  | 'photos'
  | 'autre'

export interface ProgramItem {
  id:          string
  couple_id:   string
  start_time:  string   // "HH:MM:SS" (format Postgres TIME)
  end_time:    string | null
  title:       string
  description: string | null
  location:    string | null
  responsible: string | null
  provider_id: string | null
  category:    ProgramCategory
  is_public:   boolean
  sort_order:  number
  created_at:  string
  updated_at:  string
}

export interface CreateProgramItemInput {
  start_time:  string        // "HH:MM"
  end_time?:   string | null // "HH:MM"
  title:       string
  description?: string | null
  location?:   string | null
  responsible?: string | null
  provider_id?: string | null
  category?:   ProgramCategory
  is_public?:  boolean
  sort_order?: number
}

export interface UpdateProgramItemInput extends Partial<CreateProgramItemInput> {}

// ─── Constantes UI ───────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<ProgramCategory, string> = {
  ceremonie:  'Cérémonie',
  cocktail:   'Cocktail',
  repas:      'Repas',
  animation:  'Animation',
  logistique: 'Logistique',
  beaute:     'Beauté & Préparatifs',
  photos:     'Photos & Vidéo',
  autre:      'Autre',
}

export const CATEGORY_COLORS: Record<ProgramCategory, { bg: string; text: string; border: string; dot: string }> = {
  ceremonie:  { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200', dot: 'bg-purple-400'  },
  cocktail:   { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200',   dot: 'bg-pink-400'    },
  repas:      { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200', dot: 'bg-orange-400'  },
  animation:  { bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200', dot: 'bg-yellow-400'  },
  logistique: { bg: 'bg-gray-50',    text: 'text-gray-600',    border: 'border-gray-200',   dot: 'bg-gray-400'    },
  beaute:     { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',   dot: 'bg-rose-400'    },
  photos:     { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',   dot: 'bg-blue-400'    },
  autre:      { bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',  dot: 'bg-slate-400'   },
}

/** Formate "HH:MM:SS" ou "HH:MM" en "HH:MM" */
export function formatTime(time: string | null | undefined): string {
  if (!time) return ''
  return time.slice(0, 5)
}

/** Calcule la durée entre deux temps "HH:MM" et retourne ex: "1h30" */
export function getDuration(start: string, end: string | null | undefined): string | null {
  if (!end) return null
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const totalMinutes = (eh * 60 + em) - (sh * 60 + sm)
  if (totalMinutes <= 0) return null
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

/** Trie les items par start_time puis sort_order */
export function sortProgramItems(items: ProgramItem[]): ProgramItem[] {
  return [...items].sort((a, b) => {
    const timeCmp = a.start_time.localeCompare(b.start_time)
    if (timeCmp !== 0) return timeCmp
    return a.sort_order - b.sort_order
  })
}
