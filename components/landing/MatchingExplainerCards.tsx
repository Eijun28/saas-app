'use client'

import { motion } from 'motion/react'
import { 
  Users, 
  Briefcase, 
  Sparkles, 
  MessageCircle, 
  HeartHandshake, 
  BadgeCheck, 
  Gift, 
  TrendingUp
} from 'lucide-react'
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
            'overflow-hidden',
            'transition-all duration-500'
          )}
          style={{
            transform: 'rotateY(0deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'white',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)'
          }}
        >
          {/* Pattern overlay plus doux */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.05),transparent_60%)]" />

          {/* Icône avec glow INTENSIFIÉ */}
          <div className="relative mb-6 z-10">
            <div 
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg relative z-10 ring-2 ring-gray-200"
              style={{
                background: `linear-gradient(to bottom right, ${data.gradientColors.from}, ${data.gradientColors.via}, ${data.gradientColors.to})`,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
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

          {/* Texte */}
          <div className="relative z-10 text-center space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">
              {data.title}
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed px-2">
              {data.description}
            </p>
          </div>

          {/* Indicateur hover */}
          <div className="absolute bottom-4 left-0 right-0 text-center z-10">
            <div className="inline-flex items-center gap-2 text-xs text-gray-600">
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
            background: `linear-gradient(135deg, ${data.gradientColors.from}15, ${data.gradientColors.via}10, ${data.gradientColors.to}15)`,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)'
          }}
        >
          {/* Pattern overlay plus doux */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.05),transparent_60%)]" />

          {/* Features */}
          <div className="relative z-10 space-y-3 flex-1">
            {data.features.map((feature, index) => {
              const FeatureIcon = feature.icon
              // Animations différentes selon le type d'icône
              const getAnimationProps = () => {
                if (feature.icon === HeartHandshake) {
                  return {
                    animate: { scale: [1, 1.1, 1] },
                    transition: { duration: 2, repeat: Infinity, delay: index * 0.2 }
                  }
                }
                if (feature.icon === Gift) {
                  return {
                    animate: { y: [0, -3, 0] },
                    transition: { duration: 2, repeat: Infinity, delay: index * 0.2 }
                  }
                }
                if (feature.icon === MessageCircle) {
                  return {
                    animate: { rotate: [0, 5, -5, 0] },
                    transition: { duration: 3, repeat: Infinity, delay: index * 0.2 }
                  }
                }
                if (feature.icon === BadgeCheck) {
                  return {
                    animate: { scale: [1, 1.08, 1] },
                    transition: { duration: 1.5, repeat: Infinity, delay: index * 0.2 }
                  }
                }
                if (feature.icon === TrendingUp) {
                  return {
                    animate: { y: [0, -2, 0] },
                    transition: { duration: 2, repeat: Infinity, delay: index * 0.2 }
                  }
                }
                return {
                  animate: { scale: [1, 1.05, 1] },
                  transition: { duration: 2, repeat: Infinity, delay: index * 0.2 }
                }
              }
              
              const iconAnimation = getAnimationProps()
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <motion.div 
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center flex-shrink-0"
                    animate={iconAnimation.animate}
                    transition={iconAnimation.transition}
                  >
                    <FeatureIcon className="w-4 h-4 text-white" />
                  </motion.div>
                  <p className="text-sm text-gray-900 font-medium leading-snug">
                    {feature.text}
                  </p>
                </motion.div>
              )
            })}
          </div>

          {/* Footer CTA */}
          <div className="relative z-10 mt-4">
            <Link
              href="/sign-up"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#823F91] to-[#9D5FA8] border border-transparent text-white font-semibold text-sm hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span>En savoir plus</span>
              <Sparkles className="w-4 h-4" />
            </Link>
          </div>
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
        { icon: MessageCircle, text: 'Quiz rapide de 3 questions' },
        { icon: HeartHandshake, text: 'Matching instantané et personnalisé' },
        { icon: BadgeCheck, text: 'Profils vérifiés et avis certifiés' }
      ],
      gradient: 'from-[#823F91] via-[#c081e3] to-[#823F91]',
      glowColor: 'rgba(130,63,145,0.6)',
      gradientColors: {
        from: '#823F91',
        via: '#c081e3',
        to: '#823F91'
      }
    },
    {
      icon: Briefcase,
      title: 'Pour les Prestataires',
      subtitle: 'Recevez des demandes qualifiées',
      description: 'Créez votre profil et recevez automatiquement des demandes qui correspondent exactement à vos services.',
      features: [
        { icon: Gift, text: 'Leads 100% qualifiés et ciblés' },
        { icon: HeartHandshake, text: 'Zéro prospection nécessaire' },
        { icon: TrendingUp, text: '+40% de réservations en moyenne' }
      ],
      gradient: 'from-[#c081e3] via-[#823F91] to-[#c081e3]',
      glowColor: 'rgba(192,129,227,0.6)',
      gradientColors: {
        from: '#c081e3',
        via: '#823F91',
        to: '#c081e3'
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
