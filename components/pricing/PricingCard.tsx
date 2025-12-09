'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Check, LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface PricingCardProps {
  name: string
  price: string
  period?: string
  description: string
  icon: LucideIcon
  features: string[]
  buttonText: string
  popular?: boolean
  href?: string
}

export function PricingCard({
  name,
  price,
  period,
  description,
  icon: Icon,
  features,
  buttonText,
  popular = false,
  href = '/sign-up',
}: PricingCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <div
        className={`
          relative h-full rounded-xl border border-gray-200 bg-white
          shadow-sm hover:shadow-md transition-all duration-300
          py-10 px-8 flex flex-col gap-6 max-w-sm mx-auto min-h-[500px]
          ${popular ? 'border-[#823F91] ring-1 ring-[#823F91]/20' : ''}
        `}
      >
        {popular && (
          <div className="absolute -top-3 right-4">
            <span className="bg-[#823F91] text-white px-3 py-1 rounded-full text-xs font-medium">
              Populaire
            </span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="h-6 w-6 text-[#823F91]">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-light text-gray-900">{price}</span>
          {period && (
            <span className="text-sm text-muted-foreground">{period}</span>
          )}
        </div>

        <ul className="flex-1 space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-[#823F91] mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>

        <Link href={href} className="mt-auto">
          <Button
            className={`
              w-full rounded-lg py-2 px-4 text-sm font-medium
              ${popular 
                ? 'bg-[#823F91] hover:bg-[#B855D6] text-white' 
                : 'bg-gray-900 hover:bg-gray-800 text-white'
              }
              transition-colors duration-200
            `}
          >
            {buttonText}
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}
