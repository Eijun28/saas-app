'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'
import { useInView } from 'framer-motion'
import { 
  Instagram, 
  Facebook, 
  Search, 
  Image as ImageIcon,
  Globe,
  Heart,
  Users,
  Sparkles
} from 'lucide-react'

// Configuration des plateformes avec icônes Lucide React
const platforms = [
  { name: 'Mariages.net', icon: Heart, color: 'text-rose-600' },
  { name: 'Zankyou', icon: Users, color: 'text-blue-600' },
  { name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { name: 'Facebook', icon: Facebook, color: 'text-blue-500' },
  { name: 'Pinterest', icon: ImageIcon, color: 'text-red-600' },
  { name: 'Google', icon: Search, color: 'text-blue-600' },
  { name: 'The Knot', icon: Sparkles, color: 'text-purple-600' },
  { name: 'Weddinplz', icon: Globe, color: 'text-green-600' },
]

// Variants d'animation pour le container des logos
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

// Variants d'animation pour chaque logo
const logoVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: { 
    opacity: 0.6, 
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
  floating: {
    y: [0, -15, 0],
    rotate: [-3, 3, -3],
    opacity: [0.6, 0.8, 0.6],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

// Variants réduits pour les utilisateurs avec prefers-reduced-motion
const reducedLogoVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 0.6, 
    scale: 1,
    transition: {
      duration: 0.3,
    }
  },
}

interface PlatformLogoProps {
  platform: typeof platforms[0]
  index: number
  shouldReduceMotion: boolean
}

function PlatformLogo({ platform, platform: { icon: Icon, name, color }, index, shouldReduceMotion }: PlatformLogoProps) {
  const delay = index * 0.1

  return (
    <motion.div
      variants={shouldReduceMotion ? reducedLogoVariants : logoVariants}
      initial="hidden"
      animate="visible"
      whileHover={shouldReduceMotion ? {} : { 
        scale: 1.1, 
        opacity: 1,
        rotate: 0,
        transition: { duration: 0.2 }
      }}
      className={`
        relative flex flex-col items-center justify-center
        p-6 rounded-2xl bg-white/80 backdrop-blur-sm
        border border-slate-200/50 shadow-sm
        hover:shadow-md hover:border-slate-300/50
        transition-colors duration-200
        group
      `}
      style={{ 
        animationDelay: `${delay}s`,
      }}
    >
      {/* Effet de brillance au survol */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 flex flex-col items-center gap-2">
        <Icon 
          className={`w-8 h-8 md:w-10 md:h-10 ${color} transition-transform duration-200 group-hover:scale-110`}
          aria-hidden="true"
        />
        <span className="text-xs md:text-sm font-medium text-slate-700 text-center">
          {name}
        </span>
      </div>
    </motion.div>
  )
}

export function PainPointSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })
  const shouldReduceMotion = useReducedMotion()

  return (
    <section 
      ref={sectionRef}
      className="py-16 md:py-24 bg-gradient-to-b from-white to-slate-50"
      aria-label="Section problématique"
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header avec animations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center space-y-4 mb-12 md:mb-16"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm font-medium text-muted-foreground uppercase tracking-wide"
          >
            2024 n'est plus 2015...
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900"
          >
            Votre Culture Mérite Mieux
            <br />
            <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              Qu'une Liste Pinterest...
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="text-lg md:text-xl lg:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
          >
            Stop aux recherches infinies, aux prestataires qui ne comprennent pas 
            vos traditions, aux compromis sur votre identité
          </motion.p>
        </motion.div>

        {/* Logo Grid avec animations */}
        <motion.div
          variants={shouldReduceMotion ? undefined : containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mt-12 md:mt-16"
        >
          {/* Grid responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                variants={shouldReduceMotion ? undefined : logoVariants}
                animate={isInView && !shouldReduceMotion ? "floating" : undefined}
                style={{
                  animationDelay: `${index * 0.2}s`,
                }}
              >
                <PlatformLogo
                  platform={platform}
                  index={index}
                  shouldReduceMotion={!!shouldReduceMotion}
                />
              </motion.div>
            ))}
          </div>

          {/* Message sous les logos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-12 text-center"
          >
            <p className="text-sm md:text-base text-slate-500 italic">
              Des heures passées à chercher... pour finalement faire des compromis
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

