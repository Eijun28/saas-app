'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { staggerCards, scrollFadeIn, cardHover } from '@/lib/animations'
import { COPY } from '@/lib/constants'
import { ClipboardCheck, Sparkles, Calendar } from 'lucide-react'

const icons = {
  clipboard: ClipboardCheck,
  sparkles: Sparkles,
  calendar: Calendar,
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={scrollFadeIn}
          initial="initial"
          whileInView="whileInView"
          viewport={scrollFadeIn.viewport}
          className="text-center mb-16 md:mb-20"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B0E12] mb-6">
            {COPY.howItWorks.title}
          </h2>
        </motion.div>

        <motion.div
          variants={staggerCards}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          className="grid md:grid-cols-3 gap-8 md:gap-12"
        >
          {COPY.howItWorks.steps.map((step, index) => {
            const Icon = icons[step.icon as keyof typeof icons] || ClipboardCheck
            return (
              <motion.div
                key={index}
                variants={cardHover}
                initial="initial"
                whileHover="hover"
                className="h-full"
              >
                <Card className="h-full border-2 border-gray-100 hover:border-[#E8D4EF] hover:shadow-xl hover:shadow-[#823F91]/10 transition-all duration-300 bg-white">
                  <CardHeader className="text-center pb-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#E8D4EF] to-[#823F91]/20 flex items-center justify-center"
                    >
                      <Icon className="h-8 w-8 text-[#823F91]" />
                    </motion.div>
                    <CardTitle className="text-xl md:text-2xl font-bold text-[#0B0E12] mb-3">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-[#6B7280] leading-relaxed text-center">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

