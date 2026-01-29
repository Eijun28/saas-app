'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PageTitleProps {
  title: string
  description?: string
  className?: string
}

/**
 * Composant de titre uniforme pour toutes les pages couple
 * Style épuré et moderne avec alignement cohérent et espacement uniforme avec la top bar
 */
export function PageTitle({ title, description, className }: PageTitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "pt-0 pb-6 sm:pb-7 md:pb-8",
        className
      )}
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#823F91] tracking-tight mb-2">
        {title}
      </h1>
      {description && (
        <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
          {description}
        </p>
      )}
    </motion.div>
  )
}
