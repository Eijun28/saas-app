'use client'

import dynamic from 'next/dynamic'
import Hero from '@/components/landing/Hero'
import { CulturesMarquee } from '@/components/landing/CulturesMarquee'
import { SmoothScrollProvider } from '@/components/landing/SmoothScrollProvider'
import { ArrowRight } from 'lucide-react'
import { SocialProofCounter } from '@/components/landing/SocialProofCounter'

// Particules : lazy + ssr:false (canvas WebGL, inutile côté serveur)
const LandingParticles = dynamic(
  () => import('@/components/landing/LandingParticles').then(mod => ({ default: mod.LandingParticles })),
  { ssr: false }
)

// Lazy load composants sous la fold pour accélérer le First Contentful Paint
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
const NewsletterSection = dynamic(() => import('@/components/landing/NewsletterSection').then(mod => ({ default: mod.NewsletterSection })), {
  loading: () => <div className="min-h-[200px]" />,
})
const CTA = dynamic(() => import('@/components/landing/CTA'), {
  loading: () => <div className="min-h-[200px]" />,
})

export default function HomePage() {
  return (
    <SmoothScrollProvider>
      {/* Particules de fond — rendu côté client uniquement */}
      <LandingParticles />

      {/* Contenu principal — rendu côté serveur */}
      <div className="min-h-screen overflow-x-hidden bg-background" style={{ position: 'relative', zIndex: 1 }}>
        <div>
          <Hero />
          <CulturesMarquee />
          <SocialProofCounter />
          <HowItWorks />
          <MatchingQuizSection />
          <PrestatairesMarquee />
          <FeaturesGrid />
          <NewsletterSection />
          <CTA
            title="Commencez votre mariage de rêve"
            buttons={[
              {
                href: '/sign-up',
                text: 'Commencer',
                variant: 'default',
                iconRight: <ArrowRight className="ml-2 h-5 w-5" />,
              },
              {
                href: '/tarifs',
                text: 'Voir les tarifs',
                variant: 'outline',
              },
            ]}
          />
        </div>
      </div>
    </SmoothScrollProvider>
  )
}
