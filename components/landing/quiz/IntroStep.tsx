'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onStart: () => void
}

export default function IntroStep({ onStart }: Props) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 md:py-16 px-4">
      {/* Bouton CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex items-center justify-center w-full mb-8 sm:mb-10"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="lg"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onStart()
            }}
            type="button"
            className={cn(
              "text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 shadow-lg hover:shadow-xl w-full sm:w-auto"
            )}
            style={{
              backgroundColor: '#823F91',
              color: 'white',
            }}
            onFocus={(e) => e.preventDefault()}
          >
            <span>Tester le matching</span>
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Liste des avantages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="w-full max-w-md space-y-3 sm:space-y-4 flex flex-col items-center"
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
            className="flex items-center gap-3 text-sm sm:text-base text-gray-700 justify-center"
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
    </div>
  )
}
