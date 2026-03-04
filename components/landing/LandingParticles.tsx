'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from '@/components/ui/sparkles'

export function LandingParticles() {
  const [particleCount, setParticleCount] = useState<number | null>(null)

  useEffect(() => {
    // Désactiver sur mobile/tablette : animation canvas continue trop coûteuse en CPU
    const isTouchDevice = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches
    if (isTouchDevice) return

    setParticleCount(window.innerWidth < 1024 ? 12 : 25)
  }, [])

  if (particleCount === null) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      style={{ width: '100vw', height: '100vh' }}
    >
      <Sparkles
        particleCount={particleCount}
        particleColors={['#823F91', '#c081e3', '#823F91']}
        speed={0.15}
      />
    </div>
  )
}
