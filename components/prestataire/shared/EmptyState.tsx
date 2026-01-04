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
    >
      <Card className="border-[#823F91]/20 bg-gradient-to-br from-white via-[#823F91]/5 to-white">
        <CardContent className="py-16 text-center">
          {Icon && (
            <Icon className="h-16 w-16 text-[#823F91]/30 mx-auto mb-4" />
          )}
          <h3 className="text-lg font-semibold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent mb-2">
            {title}
          </h3>
          {description && (
            <p className="text-[#823F91]/60 mb-6 max-w-md mx-auto">
              {description}
            </p>
          )}
          {action && (
            <Button
              onClick={action.onClick}
              className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white shadow-lg shadow-[#823F91]/30 transition-all duration-300"
            >
              {action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

