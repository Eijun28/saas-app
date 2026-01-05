'use client'

import Hero from '@/components/landing/Hero'
import { FeaturesGrid } from '@/components/landing/FeaturesGrid'
import CTA from '@/components/landing/CTA'
import { SmoothScrollProvider } from '@/components/landing/SmoothScrollProvider'
import Chatbot from '@/components/Chatbot'
import { HowItWorks } from '@/components/how-it-works'
import { ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-white overflow-x-hidden relative">
        <Hero />
        <HowItWorks />
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
          className="bg-white"
        />
        
        {/* Chatbot - Fixed bottom right */}
        <Chatbot />
      </div>
    </SmoothScrollProvider>
  )
}
