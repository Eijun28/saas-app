'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onStart: () => void
}

export default function IntroStep({ onStart }: Props) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 md:py-16 px-4">
      {/* Icône principale */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6 sm:mb-8"
      >
        <div 
          className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(130, 63, 145, 0.1)' }}
        >
          <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" style={{ color: '#823F91' }} />
        </div>
      </motion.div>

      {/* Titre */}
      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6 px-2"
        style={{ color: '#823F91' }}
      >
        Trouvez votre prestataire de mariage idéal
      </motion.h3>

      {/* Liste des avantages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="w-full max-w-md space-y-3 sm:space-y-4 mb-8 sm:mb-10"
      >
        {[
          { icon: '✓', text: 'Gratuit et sans engagement' },
          { icon: '✓', text: 'Résultats personnalisés en 30s' },
          { icon: '✓', text: 'Aucune carte bancaire requise' }
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
            className="flex items-center gap-3 text-sm sm:text-base text-gray-700"
          >
            <div 
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: '#823F91' }}
            >
              {item.icon}
            </div>
            <span>{item.text}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Bouton CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="lg"
            onClick={onStart}
            className={cn(
              "text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 shadow-lg hover:shadow-xl w-full sm:w-auto"
            )}
            style={{
              backgroundColor: '#823F91',
              color: 'white',
            }}
          >
            <span>Commencer le quiz</span>
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
