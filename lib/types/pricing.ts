// Types for provider pricing system

export type PricingUnit =
  | 'forfait'           // Prix fixe / forfait
  | 'par_personne'      // Par invité/personne
  | 'par_heure'         // Par heure
  | 'par_demi_journee'  // Par demi-journée (4h)
  | 'par_journee'       // Par journée complète
  | 'par_part'          // Par part (gâteaux, traiteur)
  | 'par_essayage'      // Par essayage (robes, costumes)
  | 'par_piece'         // Par pièce/unité
  | 'par_km'            // Par kilomètre (déplacement)
  | 'sur_devis'         // Sur devis uniquement

export interface ProviderPricing {
  id: string
  provider_id: string
  label: string | null
  pricing_unit: PricingUnit
  price_min: number | null
  price_max: number | null
  is_primary: boolean
  display_order: number
  description: string | null
  created_at: string
  updated_at: string
}

export interface ProviderPricingInsert {
  provider_id?: string
  label?: string | null
  pricing_unit: PricingUnit
  price_min?: number | null
  price_max?: number | null
  is_primary?: boolean
  display_order?: number
  description?: string | null
}

export interface ProviderPricingUpdate {
  label?: string | null
  pricing_unit?: PricingUnit
  price_min?: number | null
  price_max?: number | null
  is_primary?: boolean
  display_order?: number
  description?: string | null
}

// Pricing unit display configuration
export interface PricingUnitConfig {
  value: PricingUnit
  label: string
  shortLabel: string      // For compact display
  suffix: string          // What to show after price (ex: "/pers.", "/h")
  placeholder: string     // Placeholder for price input
  allowRange: boolean     // Can have min-max range
  requiresPrice: boolean  // Must have at least price_min
}

export const PRICING_UNITS: PricingUnitConfig[] = [
  {
    value: 'forfait',
    label: 'Forfait (prix fixe)',
    shortLabel: 'Forfait',
    suffix: '',
    placeholder: '2500',
    allowRange: true,
    requiresPrice: true,
  },
  {
    value: 'par_personne',
    label: 'Par personne / invité',
    shortLabel: 'Par pers.',
    suffix: '/pers.',
    placeholder: '85',
    allowRange: true,
    requiresPrice: true,
  },
  {
    value: 'par_heure',
    label: 'Par heure',
    shortLabel: 'Par heure',
    suffix: '/h',
    placeholder: '150',
    allowRange: true,
    requiresPrice: true,
  },
  {
    value: 'par_demi_journee',
    label: 'Par demi-journée (4h)',
    shortLabel: 'Demi-journée',
    suffix: '/demi-journée',
    placeholder: '400',
    allowRange: true,
    requiresPrice: true,
  },
  {
    value: 'par_journee',
    label: 'Par journée complète',
    shortLabel: 'Journée',
    suffix: '/jour',
    placeholder: '800',
    allowRange: true,
    requiresPrice: true,
  },
  {
    value: 'par_part',
    label: 'Par part',
    shortLabel: 'Par part',
    suffix: '/part',
    placeholder: '8',
    allowRange: true,
    requiresPrice: true,
  },
  {
    value: 'par_essayage',
    label: 'Par essayage',
    shortLabel: 'Essayage',
    suffix: '/essayage',
    placeholder: '50',
    allowRange: true,
    requiresPrice: true,
  },
  {
    value: 'par_piece',
    label: 'Par pièce / unité',
    shortLabel: 'Par pièce',
    suffix: '/pièce',
    placeholder: '25',
    allowRange: true,
    requiresPrice: true,
  },
  {
    value: 'par_km',
    label: 'Par kilomètre',
    shortLabel: 'Par km',
    suffix: '/km',
    placeholder: '0.50',
    allowRange: false,
    requiresPrice: true,
  },
  {
    value: 'sur_devis',
    label: 'Sur devis uniquement',
    shortLabel: 'Sur devis',
    suffix: '',
    placeholder: '',
    allowRange: false,
    requiresPrice: false,
  },
]

// Helper functions
export function getPricingUnitConfig(unit: PricingUnit): PricingUnitConfig {
  return PRICING_UNITS.find(u => u.value === unit) || PRICING_UNITS[0]
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return ''
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

export function formatPricing(pricing: ProviderPricing): string {
  const config = getPricingUnitConfig(pricing.pricing_unit)

  if (pricing.pricing_unit === 'sur_devis') {
    return 'Sur devis'
  }

  if (pricing.price_min == null) {
    return 'Sur devis'
  }

  const minFormatted = formatPrice(pricing.price_min)

  if (pricing.price_max != null && pricing.price_max !== pricing.price_min) {
    const maxFormatted = formatPrice(pricing.price_max)
    return `${minFormatted} - ${maxFormatted}${config.suffix}`
  }

  return `${minFormatted}${config.suffix}`
}

export function formatPricingShort(pricing: ProviderPricing): string {
  const config = getPricingUnitConfig(pricing.pricing_unit)

  if (pricing.pricing_unit === 'sur_devis') {
    return 'Sur devis'
  }

  if (pricing.price_min == null) {
    return 'Sur devis'
  }

  // For short format, show "À partir de X" if there's a range
  if (pricing.price_max != null && pricing.price_max !== pricing.price_min) {
    return `Dès ${formatPrice(pricing.price_min)}${config.suffix}`
  }

  return `${formatPrice(pricing.price_min)}${config.suffix}`
}

// Get primary pricing or first pricing for display
export function getPrimaryPricing(pricings: ProviderPricing[]): ProviderPricing | null {
  if (pricings.length === 0) return null
  return pricings.find(p => p.is_primary) || pricings[0]
}
