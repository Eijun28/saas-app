'use client'

import { motion } from 'framer-motion'
import { slideFromLeft, slideFromRight, floating } from '@/lib/animations'
import { COPY } from '@/lib/constants'
import { Check } from 'lucide-react'

export function FeatureBlock() {
  return (
    <section className="py-24 md:py-32 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left: Text Content */}
          <motion.div
            variants={slideFromLeft}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: '-100px' }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B0E12] leading-tight">
              {COPY.featureBlock.headline}
            </h2>
            <div className="space-y-4">
              {COPY.featureBlock.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#823F91] flex items-center justify-center mt-1">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-base md:text-lg text-[#6B7280] leading-relaxed">
                    {feature}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Animated Mockup */}
          <motion.div
            variants={slideFromRight}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: '-100px' }}
            className="relative"
          >
            <motion.div
              variants={floating}
              animate="animate"
              className="relative w-full h-[500px] md:h-[600px] rounded-2xl bg-gradient-to-br from-[#E8D4EF] via-white to-[#E8D4EF] border-2 border-[#E8D4EF] shadow-2xl shadow-[#823F91]/20 flex items-center justify-center"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#823F91]/10 to-transparent rounded-2xl blur-2xl" />
              
              {/* Mockup content */}
              <div className="relative z-10 w-full h-full p-8 flex flex-col gap-4">
                <div className="w-full h-12 bg-white rounded-lg shadow-md" />
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

