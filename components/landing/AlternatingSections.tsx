'use client'

import { motion } from 'framer-motion'
import { slideFromLeft, slideFromRight, tilt3D } from '@/lib/animations'
import { COPY } from '@/lib/constants'

export function AlternatingSections() {
  return (
    <section className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-7xl mx-auto space-y-32 md:space-y-40">
        {COPY.alternatingSections.map((section, index) => {
          const isEven = index % 2 === 0
          const TextComponent = isEven ? slideFromLeft : slideFromRight
          const VisualComponent = isEven ? slideFromRight : slideFromLeft

          return (
            <div
              key={index}
              className={`grid lg:grid-cols-2 gap-12 md:gap-16 items-center ${
                !isEven ? 'lg:grid-flow-dense' : ''
              }`}
            >
              {/* Text Content */}
              <motion.div
                variants={TextComponent}
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true, margin: '-100px' }}
                className={`space-y-6 ${!isEven ? 'lg:col-start-2' : ''}`}
              >
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#0B0E12] leading-tight">
                  {section.title}
                </h3>
                <p className="text-base md:text-lg text-[#6B7280] leading-relaxed">
                  {section.description}
                </p>
              </motion.div>

              {/* Visual Mockup */}
              <motion.div
                variants={VisualComponent}
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true, margin: '-100px' }}
                className={`${!isEven ? 'lg:col-start-1 lg:row-start-1' : ''}`}
              >
                <motion.div
                  variants={tilt3D}
                  initial="initial"
                  whileHover="hover"
                  className="relative w-full h-[400px] md:h-[500px] rounded-2xl bg-gradient-to-br from-[#E8D4EF] to-white border-2 border-[#E8D4EF] shadow-xl shadow-[#823F91]/10 overflow-hidden"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Mockup UI */}
                  <div className="w-full h-full p-6 flex flex-col gap-4">
                    <div className="h-8 bg-white rounded-lg shadow-sm" />
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className="bg-white rounded-lg shadow-sm p-3 flex flex-col gap-2"
                        >
                          <div className="h-3 bg-gray-200 rounded w-full" />
                          <div className="h-3 bg-gray-200 rounded w-2/3" />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

