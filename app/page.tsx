'use client'

import dynamic from 'next/dynamic'
import Hero from '@/components/landing/Hero'
import { SmoothScrollProvider } from '@/components/landing/SmoothScrollProvider'

// Lazy load des sections below-the-fold pour améliorer les Core Web Vitals
const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks').then(mod => ({ default: mod.HowItWorks })), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
  ssr: true,
})

const FeaturesGrid = dynamic(() => import('@/components/landing/FeaturesGrid').then(mod => ({ default: mod.FeaturesGrid })), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
  ssr: true,
})

const AnimatedListNuply = dynamic(() => import('@/components/landing/AnimatedListNuply').then(mod => ({ default: mod.AnimatedListNuply })), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
  ssr: true,
})

const FAQ = dynamic(() => import('@/components/landing/FAQ'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
  ssr: true,
})

const CallToAction = dynamic(() => import('@/components/landing/CallToAction'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
  ssr: true,
})

const Chatbot = dynamic(() => import('@/components/Chatbot'), {
  ssr: false, // Chatbot n'a pas besoin d'être rendu côté serveur
})

export default function HomePage() {
  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-white overflow-x-hidden relative">
        {/* Hero section avec h1 */}
        <Hero />
        
        {/* Section Comment ça marche avec h2 */}
        <HowItWorks />
        
        {/* Section Fonctionnalités avec h2 */}
        <FeaturesGrid />
        
        {/* Section Matching en temps réel avec h2 */}
        <section className="py-20 px-4 bg-white" aria-labelledby="matching-title">
          <div className="container mx-auto">
            <div className="max-w-6xl mx-auto">
              
              {/* Titre de section */}
              <div className="text-center mb-12">
                <h2 id="matching-title" className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
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
        
        {/* Section FAQ avec h2 */}
        <FAQ />
        
        {/* Section CTA finale avec h2 */}
        <CallToAction />
        
        {/* Chatbot - Fixed bottom right */}
        <Chatbot />
      </div>
    </SmoothScrollProvider>
  )
}
