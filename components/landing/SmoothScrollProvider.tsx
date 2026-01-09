'use client'

import { useEffect, useState } from 'react'
import { initSmoothScroll } from '@/lib/scroll'

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (prefersReducedMotion) {
      return // Skip smooth scroll initialization
    }

    const lenis = initSmoothScroll()
    
    return () => {
      if (lenis) {
        lenis.destroy()
      }
    }
  }, [isMounted])

  return <>{children}</>
}

