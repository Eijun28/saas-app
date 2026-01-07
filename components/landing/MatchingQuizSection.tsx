'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QuizAnswers, QuizStep, CoupleCommunities } from './quiz/types'
import IntroStep from './quiz/IntroStep'
import Question1 from './quiz/Question1'
import Question2 from './quiz/Question2'
import Question3 from './quiz/Question3'
import MatchingAnimation from './quiz/MatchingAnimation'
import ResultsDisplay from './quiz/ResultsDisplay'
import { Orbit } from '@/components/animate-ui/icons/orbit'

export default function MatchingQuizSection() {
  const [currentStep, setCurrentStep] = useState<QuizStep>('intro')
  const [answers, setAnswers] = useState<QuizAnswers>({
    communities: null,
    prestataire: null,
    budget: null
  })
  
  // Pattern d'animation au scroll (existant dans le projet)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  // Empêcher le scroll automatique lors du changement d'étape
  const scrollPositionRef = useRef<number>(0)
  const isChangingStepRef = useRef<boolean>(false)
  
  useEffect(() => {
    // Sauvegarder la position de scroll avant le changement
    scrollPositionRef.current = window.scrollY
    isChangingStepRef.current = true
    
    // Réinitialiser le flag après un court délai
    const timer = setTimeout(() => {
      isChangingStepRef.current = false
    }, 100)
    
    return () => clearTimeout(timer)
  }, [currentStep])

  useEffect(() => {
    // Empêcher le scroll automatique pendant les changements d'étape
    const handleScroll = (e: Event) => {
      if (isChangingStepRef.current) {
        e.preventDefault()
        window.scrollTo({ 
          top: scrollPositionRef.current, 
          behavior: 'instant' 
        })
      }
    }

    // Maintenir la position de scroll après le rendu
    if (currentStep !== 'intro' && isChangingStepRef.current) {
      const savedScroll = scrollPositionRef.current
      // Utiliser plusieurs requestAnimationFrame pour s'assurer que le DOM est complètement mis à jour
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo({ 
              top: savedScroll, 
              behavior: 'instant' 
            })
          })
        })
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: false })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [currentStep])

  return (
    <section
      ref={sectionRef}
      className="py-8 sm:py-12 md:py-20 px-3 sm:px-4 bg-background relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto">
        {/* Rectangle avec icône Orbit */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={isVisible ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8 flex items-center justify-center"
        >
          <div 
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg flex items-center justify-center"
            style={{ 
              backgroundColor: '#823F91',
              boxShadow: '0 0 30px rgba(130, 63, 145, 0.8), 0 0 60px rgba(130, 63, 145, 0.6), 0 0 90px rgba(130, 63, 145, 0.4)'
            }}
          >
            <div className="text-white">
              <Orbit 
                animate={true}
                loop={true}
                animation="default"
                loopDelay={3000}
                size={48}
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
                strokeWidth={3}
              />
            </div>
          </div>
        </motion.div>

        {/* Titre principal (apparaît au scroll) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8 md:mb-12"
        >
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-2"
            style={{ color: '#823F91' }}
          >
            Matchez vos prestataires en 2 minutes
          </h2>
        </motion.div>

        {/* Contenu du quiz (avec transitions) */}
        <motion.div
          ref={contentRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isVisible || currentStep !== 'intro' ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: currentStep === 'intro' ? 0.3 : 0, duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {currentStep === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <IntroStep onStart={() => setCurrentStep('q1')} />
              </motion.div>
            )}
            
            {currentStep === 'q1' && (
              <motion.div
                key="q1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Question1 
                  onSelect={(communities: CoupleCommunities) => {
                    setAnswers({...answers, communities})
                    setCurrentStep('q2')
                  }}
                />
              </motion.div>
            )}
            
            {currentStep === 'q2' && (
              <motion.div
                key="q2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Question2 
                  onSelect={(prestataire) => {
                    setAnswers({...answers, prestataire})
                    setCurrentStep('q3')
                  }}
                  onBack={() => setCurrentStep('q1')}
                />
              </motion.div>
            )}
            
            {currentStep === 'q3' && answers.prestataire && (
              <motion.div
                key="q3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Question3 
                  prestataire={answers.prestataire}
                  onSubmit={(budget: number) => {
                    setAnswers({...answers, budget})
                    setCurrentStep('loading')
                    
                    // Simulation API (2.5s)
                    setTimeout(() => setCurrentStep('results'), 2500)
                  }}
                  onBack={() => setCurrentStep('q2')}
                />
              </motion.div>
            )}
            
            {currentStep === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MatchingAnimation />
              </motion.div>
            )}
            
            {currentStep === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ResultsDisplay 
                  answers={answers}
                  onReset={() => {
                    setCurrentStep('intro')
                    setAnswers({ communities: null, prestataire: null, budget: null })
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
