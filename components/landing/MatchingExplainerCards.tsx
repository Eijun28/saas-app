'use client'

import { motion } from 'motion/react'
import { Rocket, Users, Briefcase, CheckCircle, Sparkles, TrendingUp, Target, Award } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface CardData {
  icon: React.ElementType
  title: string
  subtitle: string
  description: string
  features: Array<{ icon: React.ElementType; text: string }>
  gradient: string
  glowColor: string
  gradientColors: {
    from: string
    via: string
    to: string
  }
}

function FlipCard({ data, delay }: { data: CardData; delay: number }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const Icon = data.icon

  const handleFlip = () => {
    setIsFlipped(prev => !prev)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="perspective-[2000px]"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={handleFlip}
    >
      <div
        className={cn(
          'relative h-[420px] w-full max-w-sm mx-auto',
          'transition-transform duration-1000 ease-in-out [transform-style:preserve-3d]',
          isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
        )}
      >
        {/* FRONT */}
        <div
          className={cn(
            'absolute inset-0 [backface-visibility:hidden]',
            'rounded-2xl p-6',
            // Fond blanc avec accents violets subtils
            'bg-white',
            'border-2',
            // Bordure violette douce
            'border-purple-200',
            'shadow-lg',
            'overflow-hidden',
            // Effet glow sur les contours
            'shadow-[0_0_20px_rgba(168,85,247,0.3),0_0_40px_rgba(168,85,247,0.15),inset_0_0_20px_rgba(168,85,247,0.1)]',
            'hover:shadow-[0_0_30px_rgba(168,85,247,0.4),0_0_60px_rgba(168,85,247,0.2),inset_0_0_30px_rgba(168,85,247,0.15)]',
            'hover:border-purple-300',
            'transition-all duration-500'
          )}
          style={{
            transform: 'rotateY(0deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          {/* Dégradé violet subtil en fond */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              background: `linear-gradient(to bottom right, ${data.gradientColors.from}, ${data.gradientColors.via}, ${data.gradientColors.to})`
            }}
          />

          {/* Effet glow autour de la carte - SUBTIL */}
          <div 
            className="absolute -inset-1 rounded-2xl opacity-5 blur-2xl group-hover:opacity-10 transition-opacity duration-500"
            style={{
              background: `linear-gradient(to right, ${data.gradientColors.from}, ${data.gradientColors.via}, ${data.gradientColors.to})`
            }}
          />

          {/* Icône avec glow INTENSIFIÉ */}
          <div className="relative mb-6">
            <div 
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg relative z-10 ring-2 ring-purple-100"
              style={{
                background: `linear-gradient(to bottom right, ${data.gradientColors.from}, ${data.gradientColors.via}, ${data.gradientColors.to})`,
                boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)'
              }}
            >
              <Icon className="w-8 h-8 text-white" />
            </div>
            {/* Glow effect behind icon - SUBTIL */}
            <div 
              className="absolute inset-0 w-18 h-18 mx-auto -translate-x-1 -translate-y-1 rounded-2xl blur-xl opacity-30"
              style={{
                background: `linear-gradient(to bottom right, ${data.gradientColors.from}, ${data.gradientColors.via}, ${data.gradientColors.to})`
              }}
            />
          </div>

          {/* Texte - COULEURS ADAPTÉES */}
          <div className="relative z-10 text-center space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">
              {data.title}
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed px-2">
              {data.description}
            </p>
          </div>

          {/* Indicateur hover */}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <div className="inline-flex items-center gap-2 text-xs text-gray-500">
              <Sparkles className="w-3 h-3" />
              <span>Survolez pour voir les détails</span>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 [backface-visibility:hidden] rounded-2xl p-6 overflow-hidden flex flex-col"
          style={{
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: `linear-gradient(to bottom right, ${data.gradientColors.from}, ${data.gradientColors.via}, ${data.gradientColors.to})`,
            boxShadow: `0 0 20px ${data.glowColor}, 0 0 40px rgba(168, 85, 247, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)`
          }}
        >
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />

          {/* Features */}
          <div className="relative z-10 space-y-3 flex-1">
            {data.features.map((feature, index) => {
              const FeatureIcon = feature.icon
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <FeatureIcon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm text-white font-medium leading-snug">
                    {feature.text}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Footer CTA */}
          <div className="relative z-10 mt-4">
            <Link
              href="/sign-up"
              className="w-full py-3 px-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold text-sm hover:bg-white/30 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span>En savoir plus</span>
              <Sparkles className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default function MatchingExplainerCards() {
  const cardsData: CardData[] = [
    {
      icon: Users,
      title: 'Pour les Couples',
      subtitle: 'Trouvez vos prestataires idéaux',
      description: 'Décrivez votre événement en 30 secondes et laissez notre algorithme intelligent trouver les prestataires parfaits.',
      features: [
        { icon: Rocket, text: 'Quiz rapide de 3 questions' },
        { icon: Target, text: 'Matching instantané et personnalisé' },
        { icon: CheckCircle, text: 'Profils vérifiés et avis certifiés' }
      ],
      gradient: 'from-purple-500 via-pink-400 to-purple-500',
      glowColor: 'rgba(168,85,247,0.6)',
      gradientColors: {
        from: '#c084fc',
        via: '#f9a8d4',
        to: '#e9d5ff'
      }
    },
    {
      icon: Briefcase,
      title: 'Pour les Prestataires',
      subtitle: 'Recevez des demandes qualifiées',
      description: 'Créez votre profil et recevez automatiquement des demandes qui correspondent exactement à vos services.',
      features: [
        { icon: Target, text: 'Leads 100% qualifiés et ciblés' },
        { icon: Sparkles, text: 'Zéro prospection nécessaire' },
        { icon: TrendingUp, text: '+40% de réservations en moyenne' }
      ],
      gradient: 'from-blue-500 via-purple-400 to-pink-500',
      glowColor: 'rgba(147,51,234,0.6)',
      gradientColors: {
        from: '#93c5fd',
        via: '#c4b5fd',
        to: '#fbcfe8'
      }
    }
  ]

  return (
    <div className="w-full py-8 bg-background relative overflow-hidden">
      {/* Cartes */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {cardsData.map((card, index) => (
            <FlipCard key={index} data={card} delay={index * 0.2} />
          ))}
        </div>
      </div>
    </div>
  )
}
