'use client'

import dynamic from 'next/dynamic'
import Hero from '@/components/landing/Hero'
import { CulturesMarquee } from '@/components/landing/CulturesMarquee'
import { SmoothScrollProvider } from '@/components/landing/SmoothScrollProvider'
import { ArrowRight } from 'lucide-react'
import { Sparkles } from '@/components/ui/sparkles'
import { useEffect, useState } from 'react'
import { StructuredData } from '@/lib/seo/structured-data'

const homepageFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Comment trouver des prestataires mariage vérifiés en France ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'NUPLY vous met en relation avec des prestataires mariage vérifiés (photographes, traiteurs, DJ, wedding planners, fleuristes, salles de réception). Créez un compte gratuit, remplissez votre brief et recevez des propositions adaptées à votre style, budget et région.',
      },
    },
    {
      '@type': 'Question',
      name: 'Qu\'est-ce que le matching mariage NUPLY ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Le matching NUPLY est un algorithme qui analyse votre profil (style de mariage, budget, région, date, traditions culturelles) et vous propose les prestataires les plus adaptés à votre projet. Fini la recherche fastidieuse sur Google : recevez des profils qualifiés directement dans votre espace.',
      },
    },
    {
      '@type': 'Question',
      name: 'NUPLY est-il adapté aux mariages multiculturels ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui, NUPLY est spécialisé dans les mariages multiculturels. La plateforme référence des prestataires expérimentés dans les cérémonies mixtes (franco-africain, franco-maghrébin, franco-indien, franco-asiatique...) et dispose d\'outils pour gérer plusieurs traditions dans un même planning.',
      },
    },
    {
      '@type': 'Question',
      name: 'Combien coûte NUPLY pour les couples ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'L\'inscription de base est gratuite pour les couples. Des fonctionnalités avancées (matching illimité, budget détaillé, messagerie illimitée) sont disponibles dans les formules payantes. Consultez notre page tarifs pour les détails.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quels types de prestataires mariage puis-je trouver sur NUPLY ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'NUPLY référence tous les corps de métier du mariage : photographes, vidéastes, traiteurs, DJ et groupes de musique, wedding planners, fleuristes, décorateurs, salles et domaines de réception, officiants de cérémonie laïque et bien d\'autres.',
      },
    },
  ],
}

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
      {/* Données structurées FAQ pour la homepage */}
      <StructuredData data={homepageFaqSchema} />

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
