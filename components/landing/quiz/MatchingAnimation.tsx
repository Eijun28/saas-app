'use client'

import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { Loader2, Check } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export default function MatchingAnimation() {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const steps = [
    "Analyse de 2 847 prestataires",
    "Calcul des compatibilités",
    "Sélection des meilleurs matches"
  ]

  useEffect(() => {
    // Progression de 0 à 100% en 2.5s
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = null
          }
          return 100
        }
        return prev + 2
      })
    }, 50)

    // Changement des étapes textuelles
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 800)

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      clearInterval(stepInterval)
    }
  }, [steps.length])

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 px-4">
      {/* Icône de chargement */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="mb-6 sm:mb-8"
      >
        <Loader2 className="h-12 w-12 sm:h-16 sm:w-16" style={{ color: '#823F91' }} />
      </motion.div>

      {/* Texte */}
      <motion.h3 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 text-center"
      >
        Analyse en cours...
      </motion.h3>

      {/* Barre de progression */}
      <div className="w-full max-w-md mb-6 sm:mb-8">
        <Progress 
          value={progress} 
          className="h-2 sm:h-3 bg-[#823F91]/20 [&>div]:bg-[#823F91]"
        />
        <p className="text-sm sm:text-base text-gray-600 text-center mt-2">
          {progress}%
        </p>
      </div>

      {/* Liste des étapes */}
      <div className="space-y-3 sm:space-y-4 w-full max-w-md">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: index <= currentStep ? 1 : 0.3,
              x: 0 
            }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3"
          >
            {index < currentStep ? (
              <Check className="h-5 w-5 flex-shrink-0" style={{ color: '#823F91' }} />
            ) : (
              <div 
                className="h-2 w-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: index === currentStep ? '#823F91' : '#d1d5db' }}
              />
            )}
            <p className="text-sm sm:text-base text-gray-700">{step}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
