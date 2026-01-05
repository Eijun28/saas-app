'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Heart, Users, Instagram, Facebook, Image, Search, Star, Globe } from 'lucide-react'

// ===== CONSTANTS =====
const PLATFORMS = [
  { name: 'Mariages.net', icon: Heart, color: '#E91E63', position: { x: -300, y: -150 } },
  { name: 'Zankyou', icon: Users, color: '#9C27B0', position: { x: 0, y: -200 } },
  { name: 'Instagram', icon: Instagram, color: '#E1306C', position: { x: 300, y: -150 } },
  { name: 'Facebook', icon: Facebook, color: '#1877F2', position: { x: 450, y: 0 } },
  { name: 'Pinterest', icon: Image, color: '#E60023', position: { x: -450, y: 0 } },
  { name: 'Google', icon: Search, color: '#4285F4', position: { x: -300, y: 150 } },
  { name: 'The Knot', icon: Star, color: '#7B68EE', position: { x: 0, y: 200 } },
  { name: 'Weddingplz', icon: Globe, color: '#10B981', position: { x: 300, y: 150 } },
] as const

// ===== MAIN COMPONENT =====
export function PlatformFusionAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 60%", "center 30%"]
  })

  // Fusion progress
  const fusionProgress = useTransform(scrollYProgress, [0.2, 0.8], [0, 1])

  // Logo animations - appelés directement au niveau supérieur
  const logoOpacity = useTransform(fusionProgress, [0.5, 1], [0, 1])
  const logoScale = useTransform(fusionProgress, [0.5, 1], [0.5, 1])
  const textOpacity = useTransform(fusionProgress, [0.7, 1], [0, 1])
  const bottomTextOpacity = useTransform(scrollYProgress, [0.5, 0.9], [0, 1])

  return (
    <section 
      ref={containerRef} 
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 py-32"
      aria-label="Animation de fusion des plateformes"
    >
      {/* Header Text */}
      <motion.header 
        className="text-center mb-20 px-4 max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-6 leading-tight">
          Stop aux recherches infinies, aux prestataires qui ne comprennent pas vos traditions, 
          aux compromis sur votre identité
        </h2>
      </motion.header>

      {/* Animation Container */}
      <div 
        className="relative w-full h-[600px] flex items-center justify-center"
        role="img"
        aria-label="Animation montrant la fusion des plateformes en NUPLY"
      >
        {/* Platform Icons */}
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon
          
          const x = useTransform(fusionProgress, [0.2, 0.8], [platform.position.x, 0])
          const y = useTransform(fusionProgress, [0.2, 0.8], [platform.position.y, 0])
          const opacity = useTransform(fusionProgress, [0, 0.6, 1], [1, 0.5, 0])
          const scale = useTransform(fusionProgress, [0, 0.7, 1], [1, 0.8, 0])

          return (
            <motion.div
              key={platform.name}
              style={{
                x,
                y,
                opacity,
                scale,
                position: 'absolute',
              }}
              className="flex flex-col items-center gap-3"
              aria-hidden="true"
            >
              <div 
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl shadow-lg flex items-center justify-center transition-transform hover:scale-110"
                style={{ backgroundColor: platform.color }}
              >
                <Icon className="w-10 h-10 md:w-12 md:h-12 text-white" aria-hidden="true" />
              </div>
              
              <span 
                className="text-sm md:text-base font-medium"
                style={{ color: platform.color }}
              >
                {platform.name}
              </span>
            </motion.div>
          )
        })}

        {/* NUPLY Logo */}
        <motion.div
          style={{
            opacity: logoOpacity,
            scale: logoScale,
          }}
          className="absolute flex flex-col items-center"
          role="img"
          aria-label="Logo NUPLY"
        >
          {/* Logo with Pulse */}
          <motion.div 
            className="relative"
            animate={{
              boxShadow: [
                '0 0 20px rgba(225, 29, 72, 0.3)',
                '0 0 60px rgba(225, 29, 72, 0.5)',
                '0 0 20px rgba(225, 29, 72, 0.3)',
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 flex items-center justify-center shadow-2xl">
              <span className="text-5xl md:text-6xl font-bold text-white select-none">N</span>
            </div>
          </motion.div>

          {/* Brand Name */}
          <motion.div
            className="mt-6 text-center"
            style={{ opacity: textOpacity }}
          >
            <h3 className="text-4xl md:text-5xl font-bold text-[#823F91] mb-2">
              NUPLY
            </h3>
            <p className="text-lg md:text-xl text-slate-600 font-medium">
              La solution tout-en-un
            </p>
          </motion.div>

          {/* Particles */}
          <motion.div
            style={{ opacity: textOpacity }}
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const angle = (i * 360) / 12
              const distance = 100
              const x = Math.cos(angle * Math.PI / 180) * distance
              const y = Math.sin(angle * Math.PI / 180) * distance
              
              return (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-rose-400 to-pink-400"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  animate={{
                    x: [0, x],
                    y: [0, y],
                    opacity: [1, 0],
                    scale: [1, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeOut"
                  }}
                />
              )
            })}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Text */}
      <motion.footer 
        className="text-center mt-20 px-4"
        style={{ opacity: bottomTextOpacity }}
      >
        <p className="text-xl md:text-2xl text-slate-600 italic max-w-3xl mx-auto">
          Des heures passées à chercher... pour finalement faire des compromis
        </p>
      </motion.footer>
    </section>
  )
}
