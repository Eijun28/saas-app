'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PageTitleProps {
  title: string
  description?: string
  className?: string
  actions?: ReactNode
}

/**
 * Composant de titre uniforme pour toutes les pages prestataire.
 * Coherent avec le hero banner du dashboard — fond gradient subtil, titre bold gris fonce.
 */
export function PageTitle({ title, description, className, actions }: PageTitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F5F0F7] via-white to-[#E8D4EF]/30 border border-[#823F91]/8 p-5 sm:p-6",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#823F91]/[0.04] pointer-events-none" />
      <div className="absolute -bottom-6 -right-3 w-20 h-20 rounded-full bg-[#823F91]/[0.03] pointer-events-none" />
    </motion.div>
  )
}
