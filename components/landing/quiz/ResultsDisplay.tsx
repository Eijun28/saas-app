'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { QuizAnswers } from './types'
import { Sparkles, ArrowRight, RotateCcw, Check } from 'lucide-react'
import Link from 'next/link'

interface Props {
  answers: QuizAnswers
  onReset: () => void
}

export default function ResultsDisplay({ answers, onReset }: Props) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Titre de succès */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8 sm:mb-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-block mb-6 sm:mb-8"
        >
          <div 
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: 'rgba(130, 63, 145, 0.1)' }}
          >
            <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14" style={{ color: '#823F91' }} />
          </div>
        </motion.div>
        
        <h3 
          className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 px-2"
          style={{ color: '#823F91' }}
        >
          Vos critères ont été enregistrés !
        </h3>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 px-2 max-w-2xl mx-auto">
          Créez votre compte pour découvrir les prestataires qui correspondent parfaitement à votre mariage
        </p>
      </motion.div>

      {/* Résumé des critères */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-gray-50 rounded-lg p-6 sm:p-8 mb-8 sm:mb-12 border border-gray-200"
      >
        <h4 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-center" style={{ color: '#823F91' }}>
          Vos critères de recherche
        </h4>
        <div className="space-y-3 sm:space-y-4">
          {answers.communities && (
            <>
              {answers.communities.epoux1 && (
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#823F91' }} />
                  <div>
                    <p className="text-sm sm:text-base font-medium text-gray-900">
                      Époux 1 : {answers.communities.epoux1.country || 'Non spécifié'}
                    </p>
                    {answers.communities.epoux1.religion && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Cérémonie religieuse : {answers.communities.epoux1.religion === 'oui' ? 'Oui' : answers.communities.epoux1.religion === 'non' ? 'Non' : answers.communities.epoux1.religionOther || 'Autre'}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {answers.communities.epoux2 && (
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#823F91' }} />
                  <div>
                    <p className="text-sm sm:text-base font-medium text-gray-900">
                      Époux 2 : {answers.communities.epoux2.country || 'Non spécifié'}
                    </p>
                    {answers.communities.epoux2.religion && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Cérémonie religieuse : {answers.communities.epoux2.religion === 'oui' ? 'Oui' : answers.communities.epoux2.religion === 'non' ? 'Non' : answers.communities.epoux2.religionOther || 'Autre'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          
          {answers.prestataire && (
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#823F91' }} />
              <p className="text-sm sm:text-base font-medium text-gray-900">
                Prestataire recherché : {answers.prestataire}
              </p>
            </div>
          )}
          
          {answers.budget && (
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#823F91' }} />
              <p className="text-sm sm:text-base font-medium text-gray-900">
                Budget : {answers.budget.toLocaleString('fr-FR')} €
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Avantages de créer un compte */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mb-8 sm:mb-12"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: '✓', text: 'Accès à tous les prestataires' },
            { icon: '✓', text: 'Matching personnalisé' },
            { icon: '✓', text: 'Gratuit et sans engagement' }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="text-center p-4 rounded-lg bg-white border border-gray-200"
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: 'rgba(130, 63, 145, 0.1)' }}
              >
                <span className="text-lg font-bold" style={{ color: '#823F91' }}>{item.icon}</span>
              </div>
              <p className="text-sm sm:text-base text-gray-700">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="flex flex-col items-center gap-4 sm:gap-6"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full sm:w-auto"
        >
          <Link href="/sign-up" className="block w-full">
            <Button
              size="lg"
              className="text-base sm:text-lg md:text-xl px-8 sm:px-10 md:px-12 py-5 sm:py-6 md:py-7 shadow-lg hover:shadow-xl w-full sm:w-auto"
              style={{
                backgroundColor: '#823F91',
                color: 'white',
              }}
            >
              <Sparkles className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              Créer mon compte gratuitement
              <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </Link>
        </motion.div>

        <p className="text-xs sm:text-sm text-gray-500 text-center px-4">
          Gratuit • Sans carte bancaire • Résultats en quelques secondes
        </p>

        <Button
          variant="ghost"
          onClick={onReset}
          className="text-sm sm:text-base mt-2"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Refaire le quiz
        </Button>
      </motion.div>
    </div>
  )
}
