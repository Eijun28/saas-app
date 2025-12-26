'use client'

import Hero from '@/components/landing/Hero'
import { FeaturesGrid } from '@/components/landing/FeaturesGrid'
import CallToAction from '@/components/landing/CallToAction'
import { SmoothScrollProvider } from '@/components/landing/SmoothScrollProvider'
import Chatbot from '@/components/Chatbot'
import { NuplyGlobe } from '@/components/nuply-globe'
import { HowItWorks } from '@/components/how-it-works'
import { AnimatedListNuply } from '@/components/landing/AnimatedListNuply'

export default function HomePage() {
  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-white overflow-x-hidden relative">
        <Hero />
        <HowItWorks />
        <FeaturesGrid />
        
        {/* Section Matching en temps réel */}
        <section className="py-20 px-4 bg-white">
          <div className="container mx-auto">
            <div className="max-w-6xl mx-auto">
              
              {/* Titre de section */}
              <div className="text-center mb-12">
                <h2 className="text-[120px] lg:text-[168px] font-bold mb-4">
                  Matching en temps réel
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  Notre IA trouve vos prestataires parfaits automatiquement
                </p>
              </div>

              {/* AnimatedList centré */}
              <div className="max-w-2xl mx-auto">
                <AnimatedListNuply />
              </div>
            </div>
          </div>
        </section>
        <div className="py-20 md:py-28 lg:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <NuplyGlobe />
          </div>
        </div>
        <CallToAction />
        
        {/* Chatbot - Fixed bottom right */}
        <Chatbot />
      </div>
    </SmoothScrollProvider>
  )
}
