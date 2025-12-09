'use client'

import { HeroFlipWords } from '@/components/HeroFlipWords'
import { AvatarCirclesDemo } from '@/components/landing/AvatarCirclesDemo'
import { FeaturesGrid } from '@/components/landing/FeaturesGrid'
import { StatsSection } from '@/components/landing/StatsSection'
import CallToAction from '@/components/landing/CallToAction'
import { SmoothScrollProvider } from '@/components/landing/SmoothScrollProvider'
import Chatbot from '@/components/Chatbot'

export default function HomePage() {
  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-white overflow-x-hidden relative">
        <HeroFlipWords />
        <AvatarCirclesDemo />
        <FeaturesGrid />
        <StatsSection />
        <CallToAction />
        
        {/* Chatbot - Fixed bottom right */}
        <Chatbot />
      </div>
    </SmoothScrollProvider>
  )
}
