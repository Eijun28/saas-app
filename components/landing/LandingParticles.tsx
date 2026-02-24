'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from '@/components/ui/sparkles'

export function LandingParticles() {
  const [particleCount, setParticleCount] = useState(15)

  useEffect(() => {
    setParticleCount(window.innerWidth < 768 ? 15 : 30)
  }, [])

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
