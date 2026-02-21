'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AlertTriangle, X, ArrowRight } from 'lucide-react'
import type { CouplePayment } from '@/types/couple-payments'

export function OverdueBanner() {
  const router = useRouter()
  const pathname = usePathname()
  const [overdueCount, setOverdueCount] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Sync overdue then fetch count
    async function syncAndCheck() {
      try {
        await fetch('/api/couple-payments/sync-overdue', { method: 'POST' })
        const res = await fetch('/api/couple-payments')
        if (!res.ok) return
        const data = await res.json()
        const count = (data.payments ?? []).filter((p: CouplePayment) => p.status === 'overdue').length
        setOverdueCount(count)
      } catch {
        // silent
      }
    }
    syncAndCheck()
  }, [pathname]) // Re-check on navigation

  if (overdueCount === 0 || dismissed) return null

  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-2.5">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium truncate">
            {overdueCount} paiement{overdueCount > 1 ? 's' : ''} en retard
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => router.push('/couple/paiements?filter=overdue')}
            className="flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 underline underline-offset-2"
          >
            Voir
            <ArrowRight className="h-3 w-3" />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-red-400 hover:text-red-600 rounded"
            aria-label="Fermer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
