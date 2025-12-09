'use client'

import { motion } from 'framer-motion'

const highlights = [
  {
    title: 'IA de matching intelligente',
    description: 'Un algorithme avancé qui comprend vos préférences culturelles, votre style et votre budget pour vous proposer les meilleurs matches.',
  },
  {
    title: 'Pensé pour les cultures sous-représentées',
    description: 'Nuply met en avant les cultures moins visibles en France, garantissant une représentation authentique et inclusive.',
  },
  {
    title: 'Prestataires vérifiés',
    description: 'Tous nos prestataires passent par un processus de vérification rigoureux pour garantir qualité et fiabilité.',
  },
  {
    title: 'Expérience fluide & moderne',
    description: 'Une interface intuitive qui simplifie l\'organisation de votre mariage, de la recherche à la gestion quotidienne.',
  },
]

export function WhyNuply() {
  return (
    <section className="py-32 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl font-semibold text-gray-900 mb-4">
            Pourquoi Nuply ?
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {highlights.map((highlight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="p-8"
            >
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                {highlight.title}
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                {highlight.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

