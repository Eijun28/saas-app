// ─────────────────────────────────────────────────────────────────────────────
// Types – Gestion des invités
// ─────────────────────────────────────────────────────────────────────────────

export type RsvpStatus = 'pending' | 'confirmed' | 'declined' | 'maybe'
export type GuestSide = 'partner_1' | 'partner_2' | 'commun'
export type GuestCategory = 'famille' | 'ami' | 'collegue' | 'autre'

export interface Guest {
  id: string
  couple_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  side: GuestSide
  category: GuestCategory
  rsvp_status: RsvpStatus
  rsvp_responded_at: string | null
  dietary_restrictions: string[] | null
  plus_one: boolean
  plus_one_name: string | null
  table_number: number | null
  notes: string | null
  invitation_sent_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateGuestInput {
  first_name: string
  last_name?: string
  email?: string | null
  phone?: string | null
  side?: GuestSide
  category?: GuestCategory
  dietary_restrictions?: string[]
  plus_one?: boolean
  plus_one_name?: string | null
  table_number?: number | null
  notes?: string | null
}

export interface UpdateGuestInput extends Partial<CreateGuestInput> {
  rsvp_status?: RsvpStatus
  rsvp_responded_at?: string | null
  invitation_sent_at?: string | null
}

export interface GuestStats {
  total: number
  confirmed: number
  declined: number
  pending: number
  maybe: number
  /** Total en comptant les +1 confirmés */
  total_with_plus_ones: number
  by_side: {
    partner_1: number
    partner_2: number
    commun: number
  }
  by_category: {
    famille: number
    ami: number
    collegue: number
    autre: number
  }
}

export interface ReceptionTable {
  id: string
  couple_id: string
  table_number: number
  table_name: string | null
  capacity: number
  shape: 'round' | 'rectangular' | 'oval'
  notes: string | null
  created_at: string
}

// ─── Constantes UI ───────────────────────────────────────────────────────────

export const DIETARY_OPTIONS = [
  'Végétarien',
  'Végétalien',
  'Sans gluten',
  'Sans lactose',
  'Halal',
  'Casher',
  'Sans porc',
  'Sans fruits de mer',
  'Sans noix',
  'Diabétique',
] as const

export const RSVP_LABELS: Record<RsvpStatus, string> = {
  pending:   'En attente',
  confirmed: 'Confirmé',
  declined:  'Décliné',
  maybe:     'Peut-être',
}

export const RSVP_COLORS: Record<RsvpStatus, string> = {
  pending:   'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  declined:  'bg-red-100 text-red-700 border-red-200',
  maybe:     'bg-blue-100 text-blue-700 border-blue-200',
}

export const SIDE_LABELS: Record<GuestSide, string> = {
  partner_1: 'Côté partenaire 1',
  partner_2: 'Côté partenaire 2',
  commun:    'Les deux côtés',
}

export const CATEGORY_LABELS: Record<GuestCategory, string> = {
  famille: 'Famille',
  ami:     'Ami(e)',
  collegue: 'Collègue',
  autre:   'Autre',
}
