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
            Prêt à organiser le mariage de vos rêves ?
          </h2>
          
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            En 5 minutes, découvrez les prestataires qui correspondent parfaitement à votre culture, votre budget et votre vision.
          </p>
          
          <motion.div
            variants={glowPulse}
            animate="animate"
            className="flex flex-col items-center gap-4"
          >
            <Link href="/sign-up">
              <Button
                size="lg"
                className="group bg-[#823F91] hover:bg-[#6D3478] text-white rounded-xl py-5 px-10 font-semibold text-base md:text-lg transition-all duration-300 shadow-lg shadow-[#823F91]/30 hover:shadow-2xl hover:shadow-[#823F91]/50 hover:-translate-y-1 flex items-center gap-2"
              >
                Créer mon compte gratuit
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <p className="text-sm text-slate-500">
              Pas de spam, pas d'engagement. Désactivez votre compte à tout moment.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

