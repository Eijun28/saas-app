'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function FinalCTA() {
  return (
    <section className="py-32 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <h2 className="text-5xl font-semibold text-gray-900 mb-4">
            Commencez dès aujourd'hui.
          </h2>
          
          <Link href="/sign-up">
            <Button
              size="lg"
              className="bg-[#823F91] hover:bg-[#6D3478] text-white rounded-lg py-4 px-8 font-medium text-base transition-all duration-300"
            >
              Créer un compte
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

