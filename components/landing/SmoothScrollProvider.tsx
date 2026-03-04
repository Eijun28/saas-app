'use client'

import { useEffect } from 'react'
import { initSmoothScroll, destroySmoothScroll } from '@/lib/scroll'

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = initSmoothScroll()
    return () => destroySmoothScroll(lenis)
  }, [])

  return <>{children}</>
}

