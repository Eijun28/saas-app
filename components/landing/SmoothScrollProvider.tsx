'use client'

import { useEffect } from 'react'
import { initSmoothScroll } from '@/lib/scroll'

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (prefersReducedMotion) {
      return // Skip smooth scroll initialization
    }

    const lenis = initSmoothScroll()
    
    return () => {
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}

