'use client'

import { motion } from 'motion/react'
import FlipCard from '@/components/ui/flip-card'

export default function MatchingExplainerCards() {
  return (
    <section className="w-full py-20 bg-gradient-to-b from-gray-50 to-white">
      {/* Titre de section */}
      <div className="container mx-auto px-4 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comment fonctionne le matching ?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Une approche intelligente qui connecte les bons couples avec les bons prestataires
          </p>
        </motion.div>
      </div>

      {/* Deux cartes côte à côte */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto items-center">
          
          {/* Carte 1 : Pour les Couples */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <FlipCard
              title="Pour les Couples"
              subtitle="Trouvez vos prestataires idéaux"
              description="Décrivez votre événement en 30 secondes et laissez notre algorithme intelligent trouver les prestataires qui correspondent parfaitement à vos besoins, votre budget et votre style."
              features={[
                'Quiz rapide de 3 questions',
                'Matching instantané et personnalisé',
                'Profils vérifiés et avis certifiés',
                '92% de compatibilité moyenne'
              ]}
            />
          </motion.div>

          {/* Carte 2 : Pour les Prestataires */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center"
          >
            <FlipCard
              title="Pour les Prestataires"
              subtitle="Recevez des demandes qualifiées"
              description="Créez votre profil professionnel et recevez automatiquement des demandes de couples qui correspondent exactement à vos services, votre zone et vos disponibilités."
              features={[
                'Leads 100% qualifiés et ciblés',
                'Zéro prospection nécessaire',
                'Visibilité auprès des bons clients',
                '+40% de réservations en moyenne'
              ]}
            />
          </motion.div>

        </div>
      </div>

      {/* Call-to-action subtil (optionnel) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="container mx-auto px-4 mt-12 text-center"
      >
        <p className="text-sm text-gray-500">
          Survolez les cartes pour découvrir plus de détails
        </p>
      </motion.div>
    </section>
  )
}
