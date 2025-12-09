'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '1',
    title: 'Créez votre profil',
    description: 'Renseignez vos préférences, votre culture et votre style de mariage souhaité.',
  },
  {
    number: '2',
    title: 'Recevez les meilleurs prestataires pour vous',
    description: 'Notre IA analyse vos critères et vous propose des prestataires parfaitement adaptés.',
  },
  {
    number: '3',
    title: 'Organisez facilement votre mariage',
    description: 'Gérez votre budget, votre timeline et communiquez avec tous vos prestataires en un seul endroit.',
  },
]

export function HowItWorks() {
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
            Comment Nuply fonctionne
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              <div className="border border-gray-200 rounded-xl p-8 bg-white hover:shadow-sm transition-shadow duration-300">
                <div className="mb-6">
                  <span className="text-4xl font-semibold text-[#823F91]">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3 pb-3 border-b border-[#823F91] border-opacity-20">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

