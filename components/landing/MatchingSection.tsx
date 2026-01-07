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
      className="py-20 px-4 bg-background relative overflow-hidden"
    >
      {/* TITRE PRINCIPAL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 max-w-4xl mx-auto"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'rgba(139, 90, 159, 1)' }}>
          Le matching qui comprend vraiment vos besoins
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Notre algorithme analyse vos critères pour vous proposer les prestataires les plus compatibles avec votre vision du mariage
        </p>
      </motion.div>

      {/* COMPOSANT PLACEHOLDERS AND VANISH INPUT */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isVisible ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex flex-col justify-center items-center px-4 mb-8"
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
        className="text-center"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/sign-up">
            <Button
              size="lg"
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl"
              style={{
                backgroundColor: 'hsl(var(--violet-500))',
                color: 'white',
              }}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Lancer mon matching
            </Button>
          </Link>
        </motion.div>
        
        <p className="text-sm text-gray-500 mt-4">
          Gratuit • Résultats en 30 secondes • Aucune carte bancaire requise
        </p>
      </motion.div>
    </section>
  )
}
