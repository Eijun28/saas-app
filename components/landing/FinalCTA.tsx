'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { scrollFadeIn, glowPulse } from '@/lib/animations'
import { COPY } from '@/lib/constants'
import { ArrowRight } from 'lucide-react'

export function FinalCTA() {
  return (
    <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-white via-[#E8D4EF]/30 to-white">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          variants={scrollFadeIn}
          initial="initial"
          whileInView="whileInView"
          viewport={scrollFadeIn.viewport}
          className="space-y-8"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B0E12] leading-tight">
            {COPY.finalCTA.headline}
          </h2>
          
          <motion.div
            variants={glowPulse}
            animate="animate"
          >
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-[#823F91] hover:bg-[#6D3478] text-white rounded-lg py-6 px-10 font-semibold text-base transition-all duration-300 shadow-lg shadow-[#823F91]/30"
              >
                {COPY.finalCTA.cta}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

