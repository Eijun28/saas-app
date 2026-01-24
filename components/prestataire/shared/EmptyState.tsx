'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Card className="w-full border-[#823F91]/20 bg-white">
        <CardContent className="py-12 sm:py-16 px-4 sm:px-6 text-center">
          {Icon && (
            <Icon className="h-12 w-12 sm:h-16 sm:w-16 text-[#823F91]/30 mx-auto mb-4 sm:mb-6" />
          )}
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent mb-2 sm:mb-3 break-words px-2">
            {title}
          </h3>
          {description && (
            <p className="text-sm sm:text-base text-[#823F91]/60 mb-6 sm:mb-8 max-w-md mx-auto break-words px-2 leading-relaxed">
              {description}
            </p>
          )}
          {action && (
            <Button
              onClick={action.onClick}
              className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white shadow-lg shadow-[#823F91]/30 transition-all duration-300 h-10 sm:h-11 px-6 sm:px-8 text-sm sm:text-base"
            >
              {action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

