'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  prestataire: string
  onSubmit: (budget: number) => void
  onBack: () => void
}

export default function Question3({ prestataire, onSubmit, onBack }: Props) {
  // Budget initial raisonnable (mais la barre va de 1€ à 1 000 000€)
  const [budget, setBudget] = useState<number>(10000)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animation d'apparition du curseur
    setIsVisible(true)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBudget(Number(e.target.value))
  }

  const handleSubmit = () => {
    onSubmit(budget)
  }

  const percent = ((budget - 1) / (1000000 - 1)) * 100

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Question */}
      <motion.h3 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6 px-2"
      >
        Quel est votre budget pour {prestataire.toLowerCase()} ?
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm sm:text-base text-gray-600 text-center mb-8 sm:mb-10 px-2"
      >
        Définissez votre budget pour ce prestataire
      </motion.p>

      {/* Slider avec animation */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mb-8 sm:mb-10 px-4 sm:px-6"
      >
        <div className="relative w-full">
          {/* Barre de fond */}
          <div className="relative h-3 bg-gray-200 rounded-full">
            {/* Barre de progression */}
            <div
              className="absolute h-3 rounded-full transition-all duration-200"
              style={{
                backgroundColor: '#823F91',
                width: `${percent}%`,
              }}
            />
          </div>
          
          {/* Input range */}
          <input
            type="range"
            min={1}
            max={1000000}
            step={100}
            value={budget}
            onChange={handleChange}
            className="absolute top-0 w-full h-3 opacity-0 cursor-pointer"
          />
        </div>
      </motion.div>

      {/* Affichage du budget sélectionné */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isVisible ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="text-center mb-8 sm:mb-10"
      >
        <div className="inline-block px-6 sm:px-8 py-4 sm:py-5 rounded-lg border-2" style={{ borderColor: '#823F91', backgroundColor: 'rgba(130, 63, 145, 0.05)' }}>
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Votre budget</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: '#823F91' }}>
            {budget.toLocaleString('fr-FR')} €
          </p>
        </div>
      </motion.div>

      {/* Boutons navigation et pagination */}
      <div className="flex flex-col items-center gap-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-sm sm:text-base w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleSubmit}
              className="text-sm sm:text-base px-6 sm:px-8 py-4 sm:py-5 w-full sm:w-auto"
              style={{
                backgroundColor: '#823F91',
                color: 'white',
              }}
            >
              <span>Voir mes matches</span>
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Pagination */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#823F91' }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#823F91' }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#823F91' }} />
        </div>
        <Badge variant="secondary" className="text-xs sm:text-sm">Étape 3/3</Badge>
      </div>
    </div>
  )
}
