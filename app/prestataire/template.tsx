'use client'

import { motion } from 'framer-motion'

export default function PrestataireTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex-1 min-h-0 flex flex-col"
    >
      {children}
    </motion.div>
  )
}
