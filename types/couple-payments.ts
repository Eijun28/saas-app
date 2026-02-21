// ─────────────────────────────────────────────────────────────────────────────
// Types – Suivi des paiements (côté couple)
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentStatus   = 'pending' | 'partial' | 'paid' | 'overdue'
export type PaymentMethod   = 'virement' | 'cheque' | 'carte' | 'especes' | 'autre'
export type PaymentCategory =
  | 'lieu' | 'traiteur' | 'photo' | 'video' | 'musique'
  | 'fleurs' | 'decoration' | 'robe' | 'costume'
  | 'beaute' | 'transport' | 'faire_part' | 'autre'

export interface CouplePayment {
  id:            string
  couple_id:     string
  provider_name: string
  provider_id:   string | null
  label:         string
  category:      PaymentCategory
  amount_total:  number
  amount_paid:   number
  status:        PaymentStatus
  due_date:      string | null   // "YYYY-MM-DD"
  paid_date:     string | null   // "YYYY-MM-DD"
  method:        PaymentMethod
  reference:     string | null
  notes:         string | null
  created_at:    string
  updated_at:    string
}

export interface CreatePaymentInput {
  provider_name: string
  provider_id?:  string | null
  label:         string
  category?:     PaymentCategory
  amount_total:  number
  amount_paid?:  number
  due_date?:     string | null
  paid_date?:    string | null
  method?:       PaymentMethod
  reference?:    string | null
  notes?:        string | null
}

export interface UpdatePaymentInput extends Partial<CreatePaymentInput> {}

// ─── Constantes UI ───────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<PaymentStatus, {
  label: string; bg: string; text: string; border: string; dot: string; icon: string
}> = {
  pending:  { label: 'À payer',      bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200',   dot: 'bg-gray-400',   icon: '○' },
  partial:  { label: 'Partiel',      bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400',   icon: '◑' },
  paid:     { label: 'Payé',         bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500',  icon: '●' },
  overdue:  { label: 'En retard',    bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500',    icon: '!' },
}

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  virement: 'Virement',
  cheque:   'Chèque',
  carte:    'Carte bancaire',
  especes:  'Espèces',
  autre:    'Autre',
}

export const CATEGORY_LABELS: Record<PaymentCategory, string> = {
  lieu:       'Lieu / Salle',
  traiteur:   'Traiteur',
  photo:      'Photographe',
  video:      'Vidéaste',
  musique:    'Musique / DJ',
  fleurs:     'Fleurs',
  decoration: 'Décoration',
  robe:       'Robe / Tenue',
  costume:    'Costume',
  beaute:     'Beauté',
  transport:  'Transport',
  faire_part: 'Faire-part',
  autre:      'Autre',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Calcule le reste à payer */
export function remaining(p: CouplePayment): number {
  return Math.max(0, p.amount_total - p.amount_paid)
}

/** Retourne le statut calculé côté client (pour l'affichage optimiste) */
export function computeStatus(p: {
  amount_total: number
  amount_paid:  number
  due_date:     string | null
}): PaymentStatus {
  if (p.amount_paid >= p.amount_total)       return 'paid'
  if (p.amount_paid > 0)                     return 'partial'
  if (p.due_date && p.due_date < new Date().toISOString().slice(0, 10)) return 'overdue'
  return 'pending'
}

/** Formate un montant en euros */
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(amount)
}

/** Formate une date ISO en français */
export function formatDate(date: string | null | undefined): string {
  if (!date) return ''
  return new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

/** Agrège les KPIs à partir de la liste des paiements */
export interface PaymentStats {
  totalCommitted: number   // Σ amount_total
  totalPaid:      number   // Σ amount_paid
  totalRemaining: number   // Σ remaining
  overdueCount:   number   // nb de paiements en retard
  overdueAmount:  number   // Σ amount_total des paiements en retard
  paidCount:      number
  pendingCount:   number
}

export function computePaymentStats(payments: CouplePayment[]): PaymentStats {
  return payments.reduce<PaymentStats>(
    (acc, p) => {
      acc.totalCommitted += p.amount_total
      acc.totalPaid      += p.amount_paid
      acc.totalRemaining += remaining(p)
      if (p.status === 'overdue') { acc.overdueCount++; acc.overdueAmount += remaining(p) }
      if (p.status === 'paid')   acc.paidCount++
      if (p.status === 'pending') acc.pendingCount++
      return acc
    },
    { totalCommitted: 0, totalPaid: 0, totalRemaining: 0, overdueCount: 0, overdueAmount: 0, paidCount: 0, pendingCount: 0 }
  )
}
