export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'

export interface CRMContact {
  requestId: string
  coupleId: string
  coupleName: string
  weddingDate: string | null
  weddingLocation: string | null
  budgetMin: number
  budgetMax: number
  status: RequestStatus
  createdAt: string
  respondedAt: string | null
  initialMessage: string
  conversationId: string | null
  tags: CRMTag[]
  lastMessageAt: string | null
  notesCount: number
}

export interface CRMTag {
  id: string
  tag: string
  color: string
}

export interface CRMActivity {
  id: string
  type: string
  description: string
  metadata: Record<string, unknown>
  createdAt: string
}

export type CRMView = 'table' | 'kanban'
export type SortField = 'coupleName' | 'createdAt' | 'weddingDate' | 'status' | 'lastMessageAt'
export type SortDirection = 'asc' | 'desc'

export const STATUS_CONFIG: Record<RequestStatus, { label: string; dotColor: string }> = {
  pending:   { label: 'En attente',  dotColor: 'bg-amber-400' },
  accepted:  { label: 'Accepte',     dotColor: 'bg-emerald-400' },
  rejected:  { label: 'Refuse',      dotColor: 'bg-red-400' },
  cancelled: { label: 'Annule',      dotColor: 'bg-gray-400' },
  completed: { label: 'Termine',     dotColor: 'bg-blue-400' },
}

export const KANBAN_COLUMNS = [
  { id: 'pending'   as const, label: 'En attente',  dotColor: 'bg-amber-400' },
  { id: 'accepted'  as const, label: 'En cours',    dotColor: 'bg-emerald-400' },
  { id: 'completed' as const, label: 'Termines',    dotColor: 'bg-blue-400' },
  { id: 'rejected'  as const, label: 'Refuses',     dotColor: 'bg-red-400' },
]
