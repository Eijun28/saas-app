'use client'

import React from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Users, Heart, Globe, Star } from 'lucide-react'

const stats = [
  {
    icon: Users,
    value: '10,000+',
    label: 'Couples actifs',
    description: 'Rejoignez une communauté grandissante',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    icon: Heart,
    value: '5,000+',
    label: 'Mariages organisés',
    description: 'Des mariages réussis chaque année',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  {
    icon: Globe,
    value: '50+',
    label: 'Cultures représentées',
    description: 'Une diversité culturelle exceptionnelle',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Star,
    value: '4.9/5',
    label: 'Note moyenne',
    description: 'Basée sur plus de 2,000 avis',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
]

function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  // Extract number from value (e.g., "10,000+" -> 10000)
  const numericValue = parseInt(value.replace(/[^0-9]/g, ''))
  const [displayValue, setDisplayValue] = React.useState(0)

  React.useEffect(() => {
    if (!isInView) return

    const duration = 2000
    const steps = 60
    const increment = numericValue / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= numericValue) {
        setDisplayValue(numericValue)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [isInView, numericValue])

  // Format the number with commas
  const formattedValue = displayValue.toLocaleString('fr-FR')

  return (
    <span ref={ref}>
      {formattedValue}
      {suffix}
      {value.includes('+') && '+'}
      {value.includes('/') && value.split('/')[1]}
    </span>
  )
}

export function StatsSection() {
  return (
    <section className="py-20 md:py-28 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="px-4 py-1.5 rounded-full bg-[#E8D4EF] text-[#823F91] text-sm font-semibold">
              Statistiques
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#0B0E12] mb-4">
            NUPLY en chiffres
          </h2>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            Une communauté qui grandit chaque jour, des mariages qui marquent à jamais.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -8 }}
                className="relative"
              >
                <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 md:p-8 hover:border-[#823F91]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#823F91]/5 h-full">
                  <div className={`w-14 h-14 rounded-xl ${stat.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-7 w-7 ${stat.color}`} />
                  </div>
                  <div className="mb-2">
                    <div className="text-3xl md:text-4xl font-bold text-[#0B0E12] mb-1">
                      {stat.value.includes('/') ? (
                        stat.value
                      ) : (
                        <AnimatedCounter value={stat.value} />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-[#0B0E12] mb-1">
                      {stat.label}
                    </h3>
                  </div>
                  <p className="text-sm text-[#6B7280]">{stat.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

