'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AvailabilityIndicatorProps {
  providerId: string
  weddingDate: string // "YYYY-MM-DD"
}

type AvailStatus = 'loading' | 'available' | 'unavailable'

export function AvailabilityIndicator({ providerId, weddingDate }: AvailabilityIndicatorProps) {
  const [status, setStatus] = useState<AvailStatus>('loading')

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const res = await fetch(
          `/api/provider-availability/public/${providerId}?from=${weddingDate}&to=${weddingDate}`
        )
        if (!res.ok) { if (!cancelled) setStatus('available'); return }
        const data = await res.json()
        // If any slot covers the wedding date → unavailable
        const blocked = (data.slots ?? []).some((s: { status: string }) =>
          s.status === 'unavailable' || s.status === 'tentative'
        )
        if (!cancelled) setStatus(blocked ? 'unavailable' : 'available')
      } catch {
        if (!cancelled) setStatus('available')
      }
    }

    check()
    return () => { cancelled = true }
  }, [providerId, weddingDate])

  if (status === 'loading') {
    return (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 gap-1 border-gray-200 text-gray-400">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        Vérification…
      </Badge>
    )
  }

  if (status === 'available') {
    return (
      <Badge className="text-[10px] px-1.5 py-0.5 gap-1 bg-green-50 text-green-700 border border-green-200 hover:bg-green-50">
        <CheckCircle className="h-2.5 w-2.5" />
        Disponible ✓
      </Badge>
    )
  }

  return (
    <Badge className="text-[10px] px-1.5 py-0.5 gap-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-50">
      <XCircle className="h-2.5 w-2.5" />
      Indisponible ✗
    </Badge>
  )
}
