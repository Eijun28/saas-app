'use client'

import dynamic from 'next/dynamic'
import Hero from '@/components/landing/Hero'
import { CulturesMarquee } from '@/components/landing/CulturesMarquee'
import { SmoothScrollProvider } from '@/components/landing/SmoothScrollProvider'
import { ArrowRight } from 'lucide-react'
import { Sparkles } from '@/components/ui/sparkles'
import { useEffect, useState } from 'react'

// Lazy load below-the-fold components to improve initial load time
const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks').then(mod => ({ default: mod.HowItWorks })), {
  loading: () => <div className="min-h-[400px]" />,
})
const MatchingQuizSection = dynamic(() => import('@/components/landing/MatchingQuizSection'), {
  loading: () => <div className="min-h-[600px]" />,
})
const PrestatairesMarquee = dynamic(() => import('@/components/landing/PrestatairesMarquee').then(mod => ({ default: mod.PrestatairesMarquee })), {
  loading: () => <div className="min-h-[120px]" />,
})
const FeaturesGrid = dynamic(() => import('@/components/landing/FeaturesGrid').then(mod => ({ default: mod.FeaturesGrid })), {
  loading: () => <div className="min-h-[400px]" />,
})
const CTA = dynamic(() => import('@/components/landing/CTA'), {
  loading: () => <div className="min-h-[200px]" />,
})

export default function HomePage() {
  // Reduce particle count on mobile for better performance
  const [particleCount, setParticleCount] = useState(15)

  useEffect(() => {
    const isMobile = window.innerWidth < 768
    setParticleCount(isMobile ? 15 : 30)
  }, [])

  return (
    <SmoothScrollProvider>
      {/* Background de sparkles - léger et animé */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ width: '100vw', height: '100vh' }}>
        <Sparkles
          particleCount={particleCount}
          particleColors={["#823F91","#c081e3","#823F91"]}
          speed={0.15}
        />
      </div>

      {/* Contenu principal */}
      <div className="min-h-screen overflow-x-hidden bg-background" style={{ position: 'relative', zIndex: 1 }}>
        <div>
          <Hero />
          <CulturesMarquee />
          <HowItWorks />
          <MatchingQuizSection />
          <PrestatairesMarquee />
          <FeaturesGrid />
          <CTA
          title="Commencez votre mariage de rêve"
          buttons={[
            {
              href: "/sign-up",
              text: "Commencer",
              variant: "default",
              iconRight: <ArrowRight className="ml-2 h-5 w-5" />,
            },
            {
              href: "/tarifs",
              text: "Voir les tarifs",
              variant: "outline",
            },
          ]}
          />
        </div>
      </div>
    </SmoothScrollProvider>
  )
}
