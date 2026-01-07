'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input'

export default function MatchingSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

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

  return (
    <section
      ref={sectionRef}
      className="py-8 sm:py-12 md:py-20 px-3 sm:px-4 bg-background relative overflow-hidden"
    >
      {/* TITRE PRINCIPAL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-6 sm:mb-8 md:mb-12 max-w-4xl mx-auto"
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-2 break-words" style={{ color: 'rgba(139, 90, 159, 1)' }}>
          Le matching qui comprend vraiment vos besoins
        </h2>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-2 break-words leading-relaxed">
          Notre algorithme analyse vos critères pour vous proposer les prestataires les plus compatibles avec votre vision du mariage
        </p>
      </motion.div>

      {/* COMPOSANT PLACEHOLDERS AND VANISH INPUT */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isVisible ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex flex-col justify-center items-center px-2 sm:px-4 mb-6 sm:mb-8 w-full"
      >
        <PlaceholdersAndVanishInput
          placeholders={[
            "Rechercher un photographe pour mon mariage...",
            "Trouver un traiteur spécialisé cuisine marocaine...",
            "Chercher un DJ pour une soirée inoubliable...",
            "Découvrir des fleuristes pour ma décoration...",
            "Trouver un prestataire qui comprend ma culture..."
          ]}
          onChange={(e) => {
            console.log(e.target.value);
          }}
          onSubmit={(e) => {
            e.preventDefault();
            console.log("submitted");
            // Rediriger vers la page de recherche ou matching
            window.location.href = '/sign-up';
          }}
        />
      </motion.div>

      {/* CTA PRINCIPAL */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isVisible ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-center px-2"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/sign-up">
            <Button
              size="lg"
              className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 shadow-lg hover:shadow-xl w-full sm:w-auto"
              style={{
                backgroundColor: 'hsl(var(--violet-500))',
                color: 'white',
              }}
            >
              <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="break-words">Lancer mon matching</span>
            </Button>
          </Link>
        </motion.div>
        
        <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 px-2 break-words">
          Gratuit • Résultats en 30 secondes • Aucune carte bancaire requise
        </p>
      </motion.div>
    </section>
  )
}
