'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, AlertCircle, ChevronRight, Clock } from 'lucide-react'
import { formatEuro, formatDate } from '@/types/couple-payments'
import type { CouplePayment } from '@/types/couple-payments'
import { STATUS_CONFIG } from '@/types/couple-payments'

interface UpcomingPaymentsWidgetProps {
  coupleId?: string
}

export function UpcomingPaymentsWidget({ coupleId }: UpcomingPaymentsWidgetProps) {
  const router = useRouter()
  const [payments, setPayments] = useState<CouplePayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!coupleId) return
    async function load() {
      try {
        const res = await fetch('/api/couple-payments')
        if (!res.ok) return
        const data = await res.json()
        const today = new Date().toISOString().slice(0, 10)
        const upcoming = (data.payments ?? [])
          .filter((p: CouplePayment) => p.status !== 'paid' && (p.due_date ? p.due_date >= today || p.status === 'overdue' : true))
          .sort((a: CouplePayment, b: CouplePayment) => {
            if (!a.due_date && !b.due_date) return 0
            if (!a.due_date) return 1
            if (!b.due_date) return -1
            return a.due_date.localeCompare(b.due_date)
          })
          .slice(0, 3)
        setPayments(upcoming)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [coupleId])

  const overdueCount = payments.filter(p => p.status === 'overdue').length

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] p-4 sm:p-5 cursor-pointer hover:border-[#823F91]/20 hover:shadow-md transition-all"
      onClick={() => router.push('/couple/paiements')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#823F91]/8 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-[#823F91]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Prochaines échéances</h3>
            {overdueCount > 0 && (
              <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {overdueCount} en retard
              </p>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300" />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 rounded-xl bg-gray-50 animate-pulse" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-4">
          <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-400">Aucune échéance à venir</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map(p => {
            const cfg = STATUS_CONFIG[p.status]
            const isOverdue = p.status === 'overdue'
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl ${isOverdue ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{p.provider_name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{p.label}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatEuro(p.amount_total - p.amount_paid)}
                  </p>
                  {p.due_date && (
                    <p className={`text-[10px] ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                      {formatDate(p.due_date)}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
