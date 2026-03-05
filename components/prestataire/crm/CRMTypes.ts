export const CRM_STATUSES = ['lead', 'contacted', 'meeting', 'proposal', 'won', 'lost'] as const
export type CRMStatus = (typeof CRM_STATUSES)[number]

export const CRM_SOURCES = ['manual', 'csv_import', 'nuply_request'] as const
export type CRMSource = (typeof CRM_SOURCES)[number]

export interface CRMContact {
  id: string
  provider_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  wedding_date: string | null
  wedding_location: string | null
  budget: number | null
  guest_count: number | null
  status: CRMStatus
  source: CRMSource
  notes: string
  request_id: string | null
  couple_id: string | null
  custom_fields: Record<string, unknown>
  tags: string[]
  created_at: string
  updated_at: string
}

export type CRMView = 'table' | 'kanban'

export const STATUS_CONFIG: Record<CRMStatus, { label: string; color: string; bg: string }> = {
  lead:      { label: 'Prospect',   color: 'text-gray-700',    bg: 'bg-gray-100' },
  contacted: { label: 'Contacte',   color: 'text-blue-700',    bg: 'bg-blue-50' },
  meeting:   { label: 'RDV',        color: 'text-amber-700',   bg: 'bg-amber-50' },
  proposal:  { label: 'Devis',      color: 'text-purple-700',  bg: 'bg-purple-50' },
  won:       { label: 'Gagne',      color: 'text-emerald-700', bg: 'bg-emerald-50' },
  lost:      { label: 'Perdu',      color: 'text-red-700',     bg: 'bg-red-50' },
}

export const SOURCE_LABELS: Record<CRMSource, string> = {
  manual: 'Manuel',
  csv_import: 'Import CSV',
  nuply_request: 'Nuply',
}

export const KANBAN_COLUMNS: { id: CRMStatus; label: string }[] = [
  { id: 'lead',      label: 'Prospects' },
  { id: 'contacted', label: 'Contactes' },
  { id: 'meeting',   label: 'RDV' },
  { id: 'proposal',  label: 'Devis envoye' },
  { id: 'won',       label: 'Gagnes' },
  { id: 'lost',      label: 'Perdus' },
]
