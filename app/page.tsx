'use client'

// 🚀 DEPLOYMENT MARKER - Commit 2ed59a4 - Date: 2026-01-27
// ✅ Sparkles 60 particules, speed 0.15
// ✅ Toggle HowItWorks w-fit
// ✅ Conversation landing messages courts
// ✅ Section HowItWorks complète
// ✅ Profil couple couleurs corrigées
import Hero from '@/components/landing/Hero'
import { PrestatairesMarquee } from '@/components/landing/PrestatairesMarquee'
import { CulturesMarquee } from '@/components/landing/CulturesMarquee'
import { HowItWorks } from '@/components/landing/HowItWorks'
import MatchingQuizSection from '@/components/landing/MatchingQuizSection'
import MatchingExplainerCards from '@/components/landing/MatchingExplainerCards'
import { FeaturesGrid } from '@/components/landing/FeaturesGrid'
import CTA from '@/components/landing/CTA'
import { SmoothScrollProvider } from '@/components/landing/SmoothScrollProvider'
import { ArrowRight } from 'lucide-react'
import { Sparkles } from '@/components/ui/sparkles'

export default function HomePage() {
  return (
    <SmoothScrollProvider>
      {/* Background de sparkles - léger et animé - Version actuelle */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ width: '100vw', height: '100vh' }}>
        <Sparkles
          particleCount={60}
          particleColors={["#823F91","#c081e3","#823F91"]}
          speed={0.15}
        />
      </div>

      {/* Contenu principal */}
      <div className="min-h-screen overflow-x-hidden bg-background" style={{ position: 'relative', zIndex: 1 }}>
        <div>
          <p>Git reconnected OK</p>
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
