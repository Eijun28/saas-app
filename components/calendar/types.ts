export type ViewMode = 'month' | 'week' | 'day' | 'agenda'

export interface CalendarEvent {
  id: string
  title: string
  date: string // Format YYYY-MM-DD
  time?: string // Format HH:MM (optionnel)
  description?: string
  status?: 'confirmed' | 'pending' | 'cancelled'
  [key: string]: any // Pour permettre d'autres propriétés spécifiques
}

export interface CalendarDashboardProps {
  events: CalendarEvent[]
  onEventCreate?: (event: Omit<CalendarEvent, 'id'>) => Promise<void>
  onEventUpdate?: (event: CalendarEvent) => Promise<void>
  onEventDelete?: (eventId: string) => Promise<void>
  onEventClick?: (event: CalendarEvent) => void
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  enableDragDrop?: boolean
  enableMinimap?: boolean
  showSidebar?: boolean
  showTime?: boolean
  eventColor?: (event: CalendarEvent) => string
  loading?: boolean
  highlightDates?: Date[]
  className?: string
}
