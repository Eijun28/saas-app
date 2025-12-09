'use client'

import { motion } from 'framer-motion'
import { scrollFadeIn, scaleOnHover } from '@/lib/animations'

// Placeholder logos - replace with actual partner logos
const logos = [
  { name: 'Partner 1', src: '/placeholder-logo-1.svg' },
  { name: 'Partner 2', src: '/placeholder-logo-2.svg' },
  { name: 'Partner 3', src: '/placeholder-logo-3.svg' },
  { name: 'Partner 4', src: '/placeholder-logo-4.svg' },
]

export function TrustLogos() {
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={scrollFadeIn}
          initial="initial"
          whileInView="whileInView"
          viewport={scrollFadeIn.viewport}
          className="flex items-center justify-center gap-12 md:gap-16 flex-wrap opacity-60 grayscale"
        >
          {logos.map((logo, index) => (
            <motion.div
              key={index}
              variants={scaleOnHover}
              initial="initial"
              whileHover="hover"
              className="h-12 md:h-16 w-auto"
            >
              <div className="h-full w-32 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-xs">{logo.name}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

