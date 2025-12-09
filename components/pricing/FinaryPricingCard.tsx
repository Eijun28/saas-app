'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface FinaryPricingCardProps {
  name: string
  pricePerDay: string
  pricePerMonth: string
  pricePerYear?: string
  savings?: string
  description: string
  features: string[]
  buttonText: string
  badge: string
  popular?: boolean
}

export function FinaryPricingCard({
  name,
  pricePerDay,
  pricePerMonth,
  pricePerYear,
  savings,
  description,
  features,
  buttonText,
  badge,
  popular = false,
}: FinaryPricingCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className={`relative rounded-3xl p-8 ${
        popular
          ? 'bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white shadow-xl'
          : 'bg-white border-2 border-gray-200 shadow-sm'
      }`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-white text-[#823F91] px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
            {badge}
          </span>
        </div>
      )}
      
      {!popular && (
        <div className="mb-4">
          <span className="text-[#823F91] text-xs font-bold uppercase tracking-wide">
            {badge}
          </span>
        </div>
      )}

      <h3 className={`text-2xl font-bold mb-2 ${popular ? 'text-white' : 'text-gray-900'}`}>
        {name}
      </h3>
      
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-bold ${popular ? 'text-white' : 'text-gray-900'}`}>
            {pricePerMonth.split('/')[0]}
          </span>
          <span className={`text-lg ${popular ? 'text-white/80' : 'text-gray-600'}`}>
            /mois
          </span>
        </div>
        <p className={`text-sm mt-1 ${popular ? 'text-white/70' : 'text-gray-500'}`}>
          soit {pricePerDay} par jour
        </p>
        {pricePerYear && (
          <p className={`text-sm mt-1 ${popular ? 'text-white/70' : 'text-gray-500'}`}>
            ou {pricePerYear} {savings}
          </p>
        )}
      </div>

      <p className={`mb-6 ${popular ? 'text-white/90' : 'text-gray-600'}`}>
        {description}
      </p>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${popular ? 'text-white' : 'text-[#823F91]'}`} />
            <span className={`text-sm ${popular ? 'text-white' : 'text-gray-700'}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <button
        className={`w-full py-4 rounded-xl font-semibold transition-all ${
          popular
            ? 'bg-white text-[#823F91] hover:bg-gray-100'
            : 'bg-[#823F91] text-white hover:bg-[#9D5FA8]'
        }`}
      >
        {buttonText}
      </button>
    </motion.div>
  )
}
