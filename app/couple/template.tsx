'use client'

import { motion } from 'framer-motion'

export default function CoupleTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="flex-1 min-h-0 flex flex-col"
    >
      {children}
    </motion.div>
  )
}
