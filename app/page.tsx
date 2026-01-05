'use client'

import Hero from '@/components/landing/Hero'
import { FeaturesGrid } from '@/components/landing/FeaturesGrid'
import CTA from '@/components/landing/CTA'
import { SmoothScrollProvider } from '@/components/landing/SmoothScrollProvider'
import Chatbot from '@/components/Chatbot'
import { ArrowRight } from 'lucide-react'

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
