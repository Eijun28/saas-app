'use client'

import { motion } from 'framer-motion'

interface FloatingHighlightProps {
  message: string
  position?: 'left' | 'right'
  delay?: number
}

export function FloatingHighlight({ 
  message, 
  position = 'right',
  delay = 0 
}: FloatingHighlightProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        y: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        },
      }}
      className={`absolute ${position === 'right' ? 'right-8' : 'left-8'} top-1/2 -translate-y-1/2 z-10`}
    >
      <div className="bg-[#823F91]/10 backdrop-blur-sm border border-[#823F91]/20 rounded-lg p-6 shadow-sm max-w-xs">
        <p className="text-gray-700 leading-relaxed">
          {message}
        </p>
      </div>
    </motion.div>
  )
}

