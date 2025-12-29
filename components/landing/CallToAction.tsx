'use client'

import { motion } from 'framer-motion'
import { RippleButton } from '@/components/ui/ripple-button'
import { ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'

export default function CallToAction() {
  return (
    <section className="py-20 md:py-28 lg:py-32 bg-gradient-to-b from-white to-violet-50/30">
      <div className="mx-auto max-w-5xl rounded-3xl border border-gray-200 bg-white px-6 py-12 md:py-20 lg:py-32 shadow-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E8D4EF]/80 border border-[#823F91]/30 mb-6">
            <span className="text-sm font-medium text-[#823F91]">
              🎉 Offre de lancement · Gratuit pour les couples
            </span>
          </div>

          {/* Titre principal */}
          <h2 className="text-balance text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            Prêt à organiser le mariage de vos rêves ?
          </h2>

          {/* Sous-titre */}
          <p className="mt-4 text-gray-600 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Rejoignez les 127 couples qui ont déjà trouvé leurs prestataires parfaits sur Nuply. Sans payer un centime.
          </p>

          {/* Mini-benefits */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-10">
            <div className="flex items-center gap-2 text-sm md:text-base text-slate-700">
              <Check className="w-5 h-5 text-[#823F91]" />
              <span>Matching en 5 minutes</span>
            </div>
            <div className="flex items-center gap-2 text-sm md:text-base text-slate-700">
              <Check className="w-5 h-5 text-[#823F91]" />
              <span>100% gratuit pour les couples</span>
            </div>
            <div className="flex items-center gap-2 text-sm md:text-base text-slate-700">
              <Check className="w-5 h-5 text-[#823F91]" />
              <span>Aucune carte bancaire requise</span>
            </div>
          </div>

          {/* CTA Principal */}
          <div className="mb-6">
            <Link href="/sign-up">
              <RippleButton
                className="group w-full sm:w-auto px-10 py-5 bg-[#823F91] hover:bg-[#6D3478] text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-[#823F91]/50 hover:-translate-y-1 flex items-center justify-center gap-2 border-0 text-base md:text-lg mx-auto"
                rippleColor="#ffffff"
              >
                Créer mon compte gratuit
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </RippleButton>
            </Link>
          </div>

          {/* Reassurance finale */}
          <p className="text-sm text-slate-500">
            Pas de spam, pas d'engagement. Désactivez votre compte à tout moment.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

