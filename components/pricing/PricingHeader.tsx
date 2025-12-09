'use client'

import { Badge } from '@/components/ui/badge'

interface PricingHeaderProps {
  badge: string
  title: string
  description: string
}

export function PricingHeader({ badge, title, description }: PricingHeaderProps) {
  return (
    <div className="text-center mb-16">
      <Badge className="mb-4 bg-[#E8D4EF] text-[#823F91] border-0">
        {badge}
      </Badge>
      <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mb-4">
        {title}
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        {description}
      </p>
    </div>
  )
}

