'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Rocket } from 'lucide-react'

interface FlipCardProps {
  title: string
  subtitle: string
  description: string
  features: string[]
  className?: string
}

export default function FlipCard({
  title,
  subtitle,
  description,
  features,
  className
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div
      className={cn('perspective-1000 w-full h-[400px]', className)}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of card */}
        <div
          className="absolute inset-0 backface-hidden rounded-2xl p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200/50 shadow-lg flex flex-col items-center justify-center text-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
        >
          <div className="mb-6">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ backgroundColor: '#823F91' }}
            >
              <Rocket className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-lg font-semibold mb-4" style={{ color: '#823F91' }}>{subtitle}</p>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>

        {/* Back of card */}
        <div
          className="absolute inset-0 backface-hidden rounded-2xl p-8 border-2 shadow-xl flex flex-col justify-center text-white"
          style={{ 
            backfaceVisibility: 'hidden', 
            transform: 'rotateY(180deg)',
            backgroundColor: '#823F91',
            borderColor: 'rgba(130, 63, 145, 0.5)'
          }}
        >
          <h3 className="text-2xl font-bold mb-4 text-center">{title}</h3>
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <span className="text-2xl mt-0.5">✓</span>
                <span className="text-sm leading-relaxed">{feature}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  )
}
