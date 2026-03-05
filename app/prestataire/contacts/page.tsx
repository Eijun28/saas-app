'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search, Users, Plus, Upload, RefreshCw, LayoutGrid, List,
  ChevronLeft, Download, ArrowDownToLine,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageTitle } from '@/components/prestataire/shared/PageTitle'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import { CRMTableView } from '@/components/prestataire/crm/CRMTableView'
import { CRMKanbanView } from '@/components/prestataire/crm/CRMKanbanView'
import { CRMDetailPanel } from '@/components/prestataire/crm/CRMDetailPanel'
import { AddContactDialog } from '@/components/prestataire/crm/AddContactDialog'
import { CSVImportDialog } from '@/components/prestataire/crm/CSVImportDialog'
import { CRM_STATUSES, STATUS_CONFIG } from '@/components/prestataire/crm/CRMTypes'
import type { CRMContact, CRMView, CRMStatus } from '@/components/prestataire/crm/CRMTypes'
import type { SortField, SortDirection } from '@/components/prestataire/crm/CRMTableView'
import { useUser } from '@/hooks/use-user'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color, bg, onClick, active }: { label: string; value: number; color: string; bg: string; onClick?: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 border rounded-xl text-left transition-all',
        active ? 'border-gray-300 bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-200'
      )}
    >
      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', color, bg)}>{value}</span>
      <span className="text-[11px] text-gray-500 font-medium">{label}</span>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContactsCRMPage() {
  const { user } = useUser()

  const [contacts, setContacts] = useState<CRMContact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<CRMStatus | 'all'>('all')
  const [view, setView] = useState<CRMView>('table')
  const [sort, setSort] = useState<{ field: SortField; direction: SortDirection }>({ field: 'created_at', direction: 'desc' })
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null)
  const [showDetailMobile, setShowDetailMobile] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // ─── Load data ──────────────────────────────────────────────────────────────

  const fetchContacts = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/prestataire/crm-contacts')
      const json = await res.json()
      if (res.ok) {
        setContacts(json.contacts ?? [])
      } else {
        toast.error('Erreur chargement des contacts')
      }
    } catch {
      toast.error('Erreur reseau')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { if (user) fetchContacts() }, [user, fetchContacts])

  // ─── Sync Nuply requests ───────────────────────────────────────────────────

  const handleSyncRequests = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/prestataire/crm-contacts/sync-requests', { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        if (json.imported > 0) {
          toast.success(`${json.imported} demande(s) Nuply importee(s)`)
          fetchContacts()
        } else {
          toast.info('Tous vos contacts Nuply sont deja synchronises')
        }
      } else {
        toast.error(json.error || 'Erreur sync')
      }
    } catch {
      toast.error('Erreur reseau')
    } finally {
      setSyncing(false)
    }
  }

  // ─── CRUD handlers ─────────────────────────────────────────────────────────

  const handleContactAdded = (contact: CRMContact) => {
    setContacts(prev => [contact, ...prev])
  }

  const handleUpdate = useCallback(async (id: string, field: string, value: unknown) => {
    // Optimistic update
    setContacts(prev => prev.map(c => c.id === id ? { ...c, [field]: value, updated_at: new Date().toISOString() } : c))
    setSelectedContact(prev => prev && prev.id === id ? { ...prev, [field]: value, updated_at: new Date().toISOString() } : prev)

    try {
      const res = await fetch('/api/prestataire/crm-contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      })
      if (!res.ok) {
        toast.error('Erreur sauvegarde')
        fetchContacts()
      }
    } catch {
      toast.error('Erreur reseau')
      fetchContacts()
    }
  }, [fetchContacts])

  const handleDelete = useCallback(async (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id))
    setSelectedContact(prev => prev?.id === id ? null : prev)

    try {
      const res = await fetch(`/api/prestataire/crm-contacts?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Contact supprime')
      } else {
        toast.error('Erreur suppression')
        fetchContacts()
      }
    } catch {
      toast.error('Erreur reseau')
      fetchContacts()
    }
  }, [fetchContacts])

  // ─── Filtering & Sorting ────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let result = contacts

    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter)
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      result = result.filter(c =>
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.wedding_location && c.wedding_location.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q)) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    result = [...result].sort((a, b) => {
      const dir = sort.direction === 'asc' ? 1 : -1
      switch (sort.field) {
        case 'name': {
          const na = `${a.first_name} ${a.last_name}`.toLowerCase()
          const nb = `${b.first_name} ${b.last_name}`.toLowerCase()
          return dir * na.localeCompare(nb)
        }
        case 'status':
          return dir * a.status.localeCompare(b.status)
        case 'wedding_date': {
          const da = a.wedding_date ? new Date(a.wedding_date).getTime() : 0
          const db = b.wedding_date ? new Date(b.wedding_date).getTime() : 0
          return dir * (da - db)
        }
        case 'budget':
          return dir * ((a.budget ?? 0) - (b.budget ?? 0))
        case 'source':
          return dir * a.source.localeCompare(b.source)
        case 'created_at':
        default:
          return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      }
    })

    return result
  }, [contacts, statusFilter, searchTerm, sort])

  // ─── KPIs ──────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const counts: Record<string, number> = { all: contacts.length }
    for (const s of CRM_STATUSES) {
      counts[s] = contacts.filter(c => c.status === s).length
    }
    return counts
  }, [contacts])

  // ─── Sort handler ─────────────────────────────────────────────────────────

  const handleSort = (field: SortField) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  // ─── Contact selection ────────────────────────────────────────────────────

  const handleSelect = (contact: CRMContact) => {
    setSelectedContact(contact)
    setShowDetailMobile(true)
  }

  // ─── Export CSV ───────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    const headers = ['prenom', 'nom', 'email', 'telephone', 'date_mariage', 'lieu', 'budget', 'statut', 'source', 'tags', 'notes']
    const rows = contacts.map(c => [
      c.first_name, c.last_name, c.email || '', c.phone || '',
      c.wedding_date || '', c.wedding_location || '', c.budget ? String(c.budget) : '',
      c.status, c.source, c.tags.join('|'), (c.notes || '').replace(/\n/g, ' '),
    ])
    const csv = [headers.join(';'), ...rows.map(r => r.map(v => `"${v}"`).join(';'))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crm-contacts-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export CSV telecharge')
  }

  // ─── Loading state ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="w-full space-y-4 animate-pulse">
        <div className="h-16 bg-gray-100 rounded-2xl" />
        <div className="flex gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-10 flex-1 bg-white rounded-xl border" />)}
        </div>
        <div className="h-10 bg-white rounded-xl border" />
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-white rounded-lg border" />)}
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4">
      <PageTitle
        title="Contacts CRM"
        description={`${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`}
        actions={
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchContacts}
            disabled={isLoading}
            className="h-8 w-8 rounded-lg"
            title="Rafraichir"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
          </Button>
        }
      />

      {/* Action bar */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setShowAddDialog(true)} size="sm" className="h-8 gap-1.5 text-xs bg-[#823F91] hover:bg-[#6D3478]">
          <Plus className="h-3.5 w-3.5" /> Ajouter un contact
        </Button>
        <Button onClick={() => setShowImportDialog(true)} variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <Upload className="h-3.5 w-3.5" /> Importer CSV
        </Button>
        <Button onClick={handleSyncRequests} variant="outline" size="sm" disabled={syncing} className="h-8 gap-1.5 text-xs">
          <ArrowDownToLine className={cn('h-3.5 w-3.5', syncing && 'animate-bounce')} /> Sync Nuply
        </Button>
        {contacts.length > 0 && (
          <Button onClick={handleExportCSV} variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-gray-500 ml-auto">
            <Download className="h-3.5 w-3.5" /> Exporter
          </Button>
        )}
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Votre CRM est vide"
          description="Ajoutez des contacts manuellement, importez un CSV, ou synchronisez vos demandes Nuply."
          action={{ label: 'Ajouter un contact', onClick: () => setShowAddDialog(true) }}
        />
      ) : (
        <>
          {/* KPIs */}
          <div className="flex flex-wrap gap-2">
            <KpiCard
              label="Total" value={kpis.all} color="text-gray-700" bg="bg-gray-100"
              onClick={() => setStatusFilter('all')} active={statusFilter === 'all'}
            />
            {CRM_STATUSES.map(s => (
              <KpiCard
                key={s}
                label={STATUS_CONFIG[s].label}
                value={kpis[s] as number}
                color={STATUS_CONFIG[s].color}
                bg={STATUS_CONFIG[s].bg}
                onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                active={statusFilter === s}
              />
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, email, lieu, tag..."
                className="pl-9 h-9 bg-white border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div className="flex items-center p-0.5 bg-gray-100 rounded-lg">
              {([
                { mode: 'table' as const, icon: List, label: 'Table' },
                { mode: 'kanban' as const, icon: LayoutGrid, label: 'Pipeline' },
              ] as const).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    view === mode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
                  )}
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex gap-4">
            <div className={cn(
              'flex-1 min-w-0',
              showDetailMobile && selectedContact ? 'hidden lg:block' : ''
            )}>
              {view === 'table' ? (
                <CRMTableView
                  contacts={filtered}
                  selectedId={selectedContact?.id ?? null}
                  onSelect={handleSelect}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  sort={sort}
                  onSort={handleSort}
                />
              ) : (
                <CRMKanbanView
                  contacts={filtered}
                  selectedId={selectedContact?.id ?? null}
                  onSelect={handleSelect}
                  onUpdate={handleUpdate}
                />
              )}
            </div>

            {/* Desktop detail panel */}
            <div className={cn(
              'hidden lg:block w-[380px] flex-shrink-0 border border-gray-200 rounded-xl overflow-hidden bg-white max-h-[calc(100vh-220px)] sticky top-4',
              !selectedContact && 'flex items-center justify-center'
            )}>
              <CRMDetailPanel
                contact={selectedContact}
                onClose={() => setSelectedContact(null)}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            </div>

            {/* Mobile detail overlay */}
            {showDetailMobile && selectedContact && (
              <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                  <button
                    onClick={() => setShowDetailMobile(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-semibold text-gray-900">Retour aux contacts</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <CRMDetailPanel
                    contact={selectedContact}
                    onClose={() => setShowDetailMobile(false)}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Dialogs */}
      <AddContactDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdded={handleContactAdded}
      />
      <CSVImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImported={fetchContacts}
      />
    </div>
  )
}
