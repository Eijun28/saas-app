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
      <Card className="border-gray-200/50">
        <CardContent className="py-16 text-center">
          {Icon && (
            <Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          )}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          {description && (
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {description}
            </p>
          )}
          {action && (
            <Button
              onClick={action.onClick}
              className="bg-[#823F91] hover:bg-[#6D3478]"
            >
              {action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

