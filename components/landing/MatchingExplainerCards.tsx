'use client'

import { motion } from 'framer-motion'
import { 
  Users, 
  Briefcase, 
  Sparkles, 
  MessageCircle, 
  HeartHandshake, 
  BadgeCheck, 
  Gift, 
  TrendingUp,
  Calendar,
  PiggyBank,
  Shield,
  FileText,
  Star,
  Receipt
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface CardData {
  icon: React.ElementType
  title: string
  subtitle: string
  description: string
  detailedParagraph: string
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
          'relative h-[380px] w-full max-w-sm mx-auto',
          'transition-transform duration-1000 ease-in-out [transform-style:preserve-3d]',
          isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
        )}
      >
        {/* FRONT */}
        <div
          className={cn(
            'absolute inset-0 [backface-visibility:hidden]',
            'rounded-2xl p-6',
            'overflow-hidden flex flex-col',
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
          <div className="relative mb-3 mt-2 z-10">
            <div 
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg relative z-10 ring-2 ring-gray-200"
              style={{
                background: `linear-gradient(to bottom right, ${data.gradientColors.from}, ${data.gradientColors.via}, ${data.gradientColors.to})`,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Icon className="w-7 h-7 text-white" />
            </div>
            {/* Glow effect behind icon - SUBTIL */}
            <div 
              className="absolute inset-0 w-16 h-16 mx-auto -translate-x-1 -translate-y-1 rounded-2xl blur-xl opacity-30"
              style={{
                background: `linear-gradient(to bottom right, ${data.gradientColors.from}, ${data.gradientColors.via}, ${data.gradientColors.to})`
              }}
            />
          </div>

          {/* Texte */}
          <div className="relative z-10 text-center space-y-3 flex-1 flex flex-col justify-start pt-2">
            <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
              {data.title}
            </h3>
            {data.subtitle && (
              <h4 className="text-base font-semibold px-4" style={{ color: '#823F91' }}>
                {data.subtitle}
              </h4>
            )}
            <p className="text-sm text-gray-600 leading-relaxed px-4">
              {data.description}
            </p>
          </div>

          {/* Indicateur hover */}
          <div className="absolute bottom-4 left-0 right-0 text-center z-10">
            <div className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: '#823F91' }}>
              <Sparkles className="w-4 h-4" />
              <span>Survolez pour voir les avantages</span>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 [backface-visibility:hidden] rounded-2xl p-4 overflow-hidden flex flex-col"
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
          <div className="relative z-10 space-y-2 flex-1">
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
                if (feature.icon === Sparkles) {
                  return {
                    animate: { rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] },
                    transition: { duration: 2.5, repeat: Infinity, delay: index * 0.2 }
                  }
                }
                if (feature.icon === Calendar) {
                  return {
                    animate: { scale: [1, 1.08, 1] },
                    transition: { duration: 2, repeat: Infinity, delay: index * 0.2 }
                  }
                }
                if (feature.icon === PiggyBank) {
                  return {
                    animate: { y: [0, -2, 0], rotate: [0, 2, -2, 0] },
                    transition: { duration: 2.5, repeat: Infinity, delay: index * 0.2 }
                  }
                }
                if (feature.icon === Shield) {
                  return {
                    animate: { scale: [1, 1.1, 1] },
                    transition: { duration: 1.8, repeat: Infinity, delay: index * 0.2 }
                  }
                }
                if (feature.icon === FileText) {
                  return {
                    animate: { rotate: [0, 3, -3, 0] },
                    transition: { duration: 2.2, repeat: Infinity, delay: index * 0.2 }
                  }
                }
                if (feature.icon === Star) {
                  return {
                    animate: { scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] },
                    transition: { duration: 2, repeat: Infinity, delay: index * 0.2 }
                  }
                }
                if (feature.icon === Receipt) {
                  return {
                    animate: { scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] },
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
                  className="flex items-start gap-2 bg-gray-50 rounded-lg p-2 border border-gray-200 flex-shrink-0"
                >
                  <motion.div 
                    className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center flex-shrink-0"
                    animate={iconAnimation.animate}
                    transition={iconAnimation.transition}
                  >
                    <FeatureIcon className="w-3 h-3 text-white" />
                  </motion.div>
                  <p className="text-xs text-gray-900 font-medium leading-snug">
                    {feature.text}
                  </p>
                </motion.div>
              )
            })}
          </div>

          {/* Footer CTA */}
          <div className="relative z-10 mt-3">
            <Link
              href="/sign-up"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#823F91] to-[#9D5FA8] border border-transparent text-white font-semibold text-sm hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-2"
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
      subtitle: 'Décrivez votre mariage en quelques secondes.',
      description: 'Notre IA analyse vos envies, votre culture, votre budget et votre lieu pour vous connecter uniquement avec des prestataires qualifiés.',
      detailedParagraph: '',
      features: [
        { icon: Sparkles, text: 'Matching IA basé sur culture, budget et localisation' },
        { icon: MessageCircle, text: 'Messagerie sécurisée intégrée avec tous les prestataires' },
        { icon: PiggyBank, text: 'Gestion complète du budget par catégorie et prestataire' },
        { icon: Calendar, text: 'Timeline interactive avec rappels automatiques' },
        { icon: Shield, text: 'Paiements sécurisés via escrow et transactions protégées' }
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
      subtitle: 'Recevez des demandes qualifiées, sans prospection.',
      description: 'Nuply analyse les besoins des couples et vous envoie uniquement des projets alignés avec vos services, vos tarifs et vos conditions.',
      detailedParagraph: '',
      features: [
        { icon: Sparkles, text: 'Matching IA qui vous envoie uniquement des couples qualifiés' },
        { icon: Receipt, text: 'Création et gestions de vos devis & factures intégrées' },
        { icon: MessageCircle, text: 'Messagerie intégrée pour échanger directement' },
        { icon: FileText, text: 'Gestion centralisée de toutes vos demandes et contrats' },
        { icon: Shield, text: 'Paiements sécurisés avec système escrow intégré' }
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
