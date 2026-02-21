'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, SlidersHorizontal, X, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageTitle }        from '@/components/couple/shared/PageTitle'
import { PaymentStatsBar }  from '@/components/couple-payments/PaymentStatsBar'
import { PaymentList }      from '@/components/couple-payments/PaymentList'
import { PaymentForm }      from '@/components/couple-payments/PaymentForm'
import { PaymentCsvImport } from '@/components/couple-payments/PaymentCsvImport'
import { useUser }          from '@/hooks/use-user'
import type { CouplePayment, PaymentStatus, PaymentCategory } from '@/types/couple-payments'
import { computePaymentStats, CATEGORY_LABELS } from '@/types/couple-payments'

const STATUS_OPTIONS: { value: PaymentStatus | 'all'; label: string }[] = [
  { value: 'all',     label: 'Tous les statuts'  },
  { value: 'pending', label: 'À payer'            },
  { value: 'partial', label: 'Partiellement réglé' },
  { value: 'overdue', label: 'En retard'          },
  { value: 'paid',    label: 'Soldés'             },
]

export default function PaiementsPage() {
  const { user }                              = useUser()
  const [payments, setPayments]               = useState<CouplePayment[]>([])
  const [loading, setLoading]                 = useState(true)
  const [showAddForm, setShowAddForm]         = useState(false)
  const [showCsvImport, setShowCsvImport]     = useState(false)
  const [filterStatus, setFilterStatus]       = useState<PaymentStatus | 'all'>('all')
  const [filterCategory, setFilterCategory]   = useState<PaymentCategory | 'all'>('all')
  const [filtersOpen, setFiltersOpen]         = useState(false)

  // ─── Chargement ─────────────────────────────────────────────────────────────

  const loadPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/couple-payments')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPayments(data.payments ?? [])
    } catch {
      toast.error('Impossible de charger les paiements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    loadPayments()
  }, [user, loadPayments])

  // ─── Mutations ──────────────────────────────────────────────────────────────

  function handlePaymentAdded(payment: CouplePayment) {
    setPayments(prev => [payment, ...prev])
  }

  function handlePaymentUpdated(updated: CouplePayment) {
    setPayments(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  function handlePaymentDeleted(id: string) {
    setPayments(prev => prev.filter(p => p.id !== id))
  }

  // ─── Filtres ────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => payments.filter(p => {
    if (filterStatus !== 'all'   && p.status   !== filterStatus)   return false
    if (filterCategory !== 'all' && p.category !== filterCategory) return false
    return true
  }), [payments, filterStatus, filterCategory])

  const stats = useMemo(() => computePaymentStats(payments), [payments])

  const hasActiveFilter = filterStatus !== 'all' || filterCategory !== 'all'

  function resetFilters() {
    setFilterStatus('all')
    setFilterCategory('all')
  }

  // ─── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-6">

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <PageTitle
          title="Suivi des paiements"
          description={
            payments.length === 0
              ? 'Suivez vos acomptes et soldes prestataires'
              : `${payments.length} paiement${payments.length > 1 ? 's' : ''} enregistré${payments.length > 1 ? 's' : ''}`
          }
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => setShowCsvImport(true)}
            className="rounded-xl gap-2"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importer CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-[#823F91] hover:bg-[#6D3478] text-white rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Ajouter un paiement</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      {!loading && payments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <PaymentStatsBar stats={stats} />
        </motion.div>
      )}

      {/* Filtres */}
      {!loading && payments.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(p => !p)}
            className={`h-9 gap-2 rounded-xl ${filtersOpen ? 'bg-purple-50 border-purple-200 text-[#823F91]' : ''}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtres
            {hasActiveFilter && (
              <span className="bg-[#823F91] text-white text-[10px] rounded-full px-1.5 py-0.5 ml-0.5">
                {(filterStatus !== 'all' ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0)}
              </span>
            )}
          </Button>

          {filtersOpen && (
            <>
              <Select value={filterStatus} onValueChange={v => setFilterStatus(v as PaymentStatus | 'all')}>
                <SelectTrigger className="h-9 w-48 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={v => setFilterCategory(v as PaymentCategory | 'all')}>
                <SelectTrigger className="h-9 w-48 rounded-xl">
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {(Object.entries(CATEGORY_LABELS) as [PaymentCategory, string][]).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9 gap-1.5 text-gray-500 hover:text-gray-700 rounded-xl"
            >
              <X className="h-3.5 w-3.5" />
              Réinitialiser
            </Button>
          )}
        </div>
      )}

      {/* Liste */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-14 bg-gray-50" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-48 bg-gray-100 rounded" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {hasActiveFilter && filtered.length < payments.length && (
              <p className="text-sm text-gray-500 mb-3">
                {filtered.length} résultat{filtered.length > 1 ? 's' : ''} sur {payments.length}
              </p>
            )}
            <PaymentList
              payments={filtered}
              onUpdated={handlePaymentUpdated}
              onDeleted={handlePaymentDeleted}
            />
          </>
        )}
      </motion.div>

      {/* Dialog ajout */}
      <PaymentForm
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSaved={handlePaymentAdded}
      />

      {/* Dialog import CSV */}
      <PaymentCsvImport
        open={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        onImported={(imported) => setPayments(imported)}
      />
    </div>
  )
}
