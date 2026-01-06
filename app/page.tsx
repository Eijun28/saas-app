'use client'

import Hero from '@/components/landing/Hero'
import { FeaturesGrid } from '@/components/landing/FeaturesGrid'
import CTA from '@/components/landing/CTA'
import { SmoothScrollProvider } from '@/components/landing/SmoothScrollProvider'
import Chatbot from '@/components/Chatbot'
import { ArrowRight } from 'lucide-react'
import { ShootingStars } from '@/components/ui/shooting-stars'
import { StarsBackground } from '@/components/ui/stars-background'

export default function HomePage() {
  return (
    <SmoothScrollProvider>
      {/* Fond dégradé violet clair inspiré eden.so */}
      <div 
        className="min-h-screen overflow-x-hidden relative"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #f8f0fa 25%, #eecdf6 60%, #e8c4f0 100%)',
        }}
      >
        {/* Étoiles et étoiles filantes - effet subtil sur fond clair */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <StarsBackground 
            starDensity={0.00003}
            allStarsTwinkle={true}
            twinkleProbability={0.7}
            minTwinkleSpeed={0.4}
            maxTwinkleSpeed={1}
            starColor="150, 100, 160"
            moveSpeed={0.1}
          />
          <ShootingStars 
            minSpeed={15}
            maxSpeed={35}
            minDelay={2000}
            maxDelay={5000}
            starColor="#823F91"
            trailColor="#B855D6"
            starWidth={12}
            starHeight={2}
            className="opacity-70"
          />
        </div>

        <Hero />
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
        
        {/* Chatbot - Fixed bottom right */}
        <Chatbot />
      </div>
    </SmoothScrollProvider>
  )
}
