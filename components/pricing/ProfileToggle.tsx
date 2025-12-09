'use client'

import { motion } from 'framer-motion'

interface ProfileToggleProps {
  value: 'couple' | 'prestataire'
  onChange: (value: 'couple' | 'prestataire') => void
}

export function ProfileToggle({ value, onChange }: ProfileToggleProps) {
  return (
    <div className="relative inline-flex p-1 rounded-full bg-gray-100">
      <motion.div
        className="absolute inset-y-1 rounded-full bg-white shadow-sm"
        initial={false}
        animate={{
          left: value === 'couple' ? '4px' : '50%',
          right: value === 'couple' ? '50%' : '4px',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
      <button
        onClick={() => onChange('couple')}
        className={`relative z-10 px-8 py-3 rounded-full text-sm font-medium transition-colors ${
          value === 'couple' ? 'text-gray-900' : 'text-gray-600'
        }`}
      >
        Couple
      </button>
      <button
        onClick={() => onChange('prestataire')}
        className={`relative z-10 px-8 py-3 rounded-full text-sm font-medium transition-colors ${
          value === 'prestataire' ? 'text-gray-900' : 'text-gray-600'
        }`}
      >
        Prestataire
      </button>
    </div>
  )
}
