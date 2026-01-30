'use client'

import { cn } from '@/lib/utils'
import type { ProviderPricing } from '@/lib/types/pricing'
import {
  formatPricing,
  formatPricingShort,
  getPricingUnitConfig,
  getPrimaryPricing,
} from '@/lib/types/pricing'
import { Euro, Tag } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PricingDisplayProps {
  pricings?: ProviderPricing[]
  // Fallback to old budget_min/max if no pricings
  budgetMin?: number | null
  budgetMax?: number | null
  variant?: 'card' | 'full' | 'inline'
  className?: string
}

export function PricingDisplay({
  pricings,
  budgetMin,
  budgetMax,
  variant = 'card',
  className,
}: PricingDisplayProps) {
  // If we have new pricing data, use it
  if (pricings && pricings.length > 0) {
    const primaryPricing = getPrimaryPricing(pricings)

    if (variant === 'card') {
      return <PricingCardView pricings={pricings} className={className} />
    }

    if (variant === 'full') {
      return <PricingFullView pricings={pricings} className={className} />
    }

    // Inline variant
    if (primaryPricing) {
      return (
        <span className={cn('text-sm font-medium', className)}>
          {formatPricingShort(primaryPricing)}
        </span>
      )
    }
  }

  // Fallback to old budget_min/max
  if (budgetMin || budgetMax) {
    const priceText = formatLegacyBudget(budgetMin, budgetMax)

    if (variant === 'card') {
      return (
        <div className={cn('space-y-1', className)}>
          <p className="text-xs text-gray-500">Budget</p>
          <p className="text-sm font-medium text-gray-900">{priceText}</p>
        </div>
      )
    }

    return <span className={cn('text-sm font-medium', className)}>{priceText}</span>
  }

  // No pricing info
  if (variant === 'card') {
    return (
      <div className={cn('space-y-1', className)}>
        <p className="text-xs text-gray-500">Tarifs</p>
        <p className="text-sm text-gray-400 italic">Sur devis</p>
      </div>
    )
  }

  return <span className={cn('text-sm text-gray-400 italic', className)}>Sur devis</span>
}

function PricingCardView({
  pricings,
  className,
}: {
  pricings: ProviderPricing[]
  className?: string
}) {
  const primaryPricing = getPrimaryPricing(pricings)
  const otherPricings = pricings.filter(p => !p.is_primary).slice(0, 2)

  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-xs text-gray-500 flex items-center gap-1">
        <Euro className="h-3 w-3" />
        Tarifs
      </p>

      {/* Primary pricing */}
      {primaryPricing && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {formatPricing(primaryPricing)}
          </span>
          {primaryPricing.label && (
            <span className="text-xs text-gray-500 truncate">
              ({primaryPricing.label})
            </span>
          )}
        </div>
      )}

      {/* Other pricings (collapsed) */}
      {otherPricings.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-xs text-[#823F91] hover:underline">
                + {pricings.length - 1} autre{pricings.length > 2 ? 's' : ''} tarif{pricings.length > 2 ? 's' : ''}
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-white shadow-lg border p-2">
              <div className="space-y-1">
                {pricings.filter(p => !p.is_primary).map(p => (
                  <div key={p.id} className="text-xs">
                    <span className="font-medium">{formatPricing(p)}</span>
                    {p.label && (
                      <span className="text-gray-500 ml-1">({p.label})</span>
                    )}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

function PricingFullView({
  pricings,
  className,
}: {
  pricings: ProviderPricing[]
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <Tag className="h-4 w-4 text-[#823F91]" />
        Tarifs
      </h4>

      <div className="grid gap-2">
        {pricings.map(pricing => {
          const config = getPricingUnitConfig(pricing.pricing_unit)
          return (
            <div
              key={pricing.id}
              className={cn(
                'flex items-center justify-between py-2 px-3 rounded-lg',
                pricing.is_primary
                  ? 'bg-[#823F91]/10 border border-[#823F91]/20'
                  : 'bg-gray-50'
              )}
            >
              <div className="flex items-center gap-2">
                {pricing.is_primary && (
                  <span className="text-xs bg-[#823F91] text-white px-1.5 py-0.5 rounded">
                    Principal
                  </span>
                )}
                <span className="text-sm text-gray-600">
                  {pricing.label || config.label}
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formatPricing(pricing)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatLegacyBudget(min?: number | null, max?: number | null): string {
  if (!min && !max) return 'Sur devis'

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price)

  if (min && max) {
    if (min === max) return formatPrice(min)
    return `${formatPrice(min)} - ${formatPrice(max)}`
  }

  if (min) return `À partir de ${formatPrice(min)}`
  if (max) return `Jusqu'à ${formatPrice(max)}`

  return 'Sur devis'
}
