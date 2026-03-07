'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, MapPin, Star, BadgeCheck, Grid3X3, List, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { SERVICE_CATEGORIES, getServiceTypeLabel } from '@/lib/constants/service-types'
import { CULTURE_CATEGORIES, getCultureById } from '@/lib/constants/cultures'

// --- Types ---

interface PublicProfile {
  rating: number | null
  total_reviews: number | null
  is_verified: boolean | null
}

interface ProviderCulture {
  culture_id: string
}

export interface ProviderData {
  id: string
  nom_entreprise: string | null
  prenom: string | null
  avatar_url: string | null
  ville_principale: string | null
  description_courte: string | null
  service_type: string | null
  budget_min: number | null
  budget_max: number | null
  is_early_adopter: boolean | null
  prestataire_public_profiles: PublicProfile | PublicProfile[] | null
  provider_cultures: ProviderCulture[] | null
}

// --- Helper to normalize public profile (can be object or array) ---

function getPublicProfile(raw: PublicProfile | PublicProfile[] | null): PublicProfile | null {
  if (!raw) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  return raw
}

// --- Star Rating ---

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'size-3.5',
              star <= Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-200'
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {rating.toFixed(1)} ({count})
      </span>
    </div>
  )
}

// --- Initials Avatar Fallback ---

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex size-full items-center justify-center bg-[#E8D4EF] text-[#823F91] font-semibold text-lg">
      {initials}
    </div>
  )
}

// --- Provider Card ---

function ProviderCard({ provider, index }: { provider: ProviderData; index: number }) {
  const publicProfile = getPublicProfile(provider.prestataire_public_profiles)
  const cultures = (provider.provider_cultures ?? [])
    .map((c) => getCultureById(c.culture_id))
    .filter(Boolean)
    .slice(0, 3)

  const displayName = provider.nom_entreprise || provider.prenom || 'Prestataire'
  const serviceLabel = provider.service_type ? getServiceTypeLabel(provider.service_type) : null

  const budgetDisplay =
    provider.budget_min != null || provider.budget_max != null
      ? provider.budget_min != null && provider.budget_max != null
        ? `${provider.budget_min.toLocaleString('fr-FR')} - ${provider.budget_max.toLocaleString('fr-FR')} \u20AC`
        : provider.budget_min != null
          ? `A partir de ${provider.budget_min.toLocaleString('fr-FR')} \u20AC`
          : `Jusqu'a ${provider.budget_max!.toLocaleString('fr-FR')} \u20AC`
      : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
    >
      <Link href={`/prestataires/${provider.id}`} className="block group">
        <Card className="overflow-hidden border border-gray-100 bg-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 p-0 gap-0">
          {/* Image / Avatar */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
            {provider.avatar_url ? (
              <Image
                src={provider.avatar_url}
                alt={displayName}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <InitialsAvatar name={displayName} />
            )}

            {/* Verified badge */}
            {publicProfile?.is_verified && (
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-[#823F91] border-0 shadow-sm gap-1">
                  <BadgeCheck className="size-3.5" />
                  Verifie
                </Badge>
              </div>
            )}

            {/* Early adopter badge */}
            {provider.is_early_adopter && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-[#823F91]/90 backdrop-blur-sm text-white border-0 shadow-sm text-[10px]">
                  Early Adopter
                </Badge>
              </div>
            )}
          </div>

          <CardContent className="p-4 space-y-2.5">
            {/* Service type */}
            {serviceLabel && (
              <span className="text-xs font-medium text-[#823F91] uppercase tracking-wide">
                {serviceLabel}
              </span>
            )}

            {/* Name */}
            <h3 className="font-semibold text-base text-gray-900 leading-tight line-clamp-1 group-hover:text-[#823F91] transition-colors">
              {displayName}
            </h3>

            {/* City */}
            {provider.ville_principale && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span className="line-clamp-1">{provider.ville_principale}</span>
              </div>
            )}

            {/* Rating */}
            {publicProfile?.rating != null && publicProfile.total_reviews != null && publicProfile.total_reviews > 0 && (
              <StarRating rating={publicProfile.rating} count={publicProfile.total_reviews} />
            )}

            {/* Description */}
            {provider.description_courte && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {provider.description_courte}
              </p>
            )}

            {/* Budget */}
            {budgetDisplay && (
              <p className="text-sm font-medium text-gray-700">{budgetDisplay}</p>
            )}

            {/* Culture badges */}
            {cultures.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {cultures.map((culture) => (
                  <Badge
                    key={culture!.id}
                    variant="outline"
                    size="sm"
                    className="text-[10px] text-muted-foreground font-normal border-gray-200"
                  >
                    {culture!.label}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

// --- Filters ---

function PrestatairesFilters({
  search,
  onSearchChange,
  serviceType,
  onServiceTypeChange,
  cultureId,
  onCultureChange,
  viewMode,
  onViewModeChange,
}: {
  search: string
  onSearchChange: (v: string) => void
  serviceType: string
  onServiceTypeChange: (v: string) => void
  cultureId: string
  onCultureChange: (v: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (v: 'grid' | 'list') => void
}) {
  const hasActiveFilters = search || serviceType || cultureId

  return (
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher un prestataire..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Service type filter */}
          <Select value={serviceType} onValueChange={onServiceTypeChange}>
            <SelectTrigger className="w-full sm:w-[220px] h-10">
              <SelectValue placeholder="Type de service" />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_CATEGORIES.map((category) => (
                <SelectGroup key={category.id}>
                  <SelectLabel>{category.label}</SelectLabel>
                  {category.services.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          {/* Culture filter */}
          <Select value={cultureId} onValueChange={onCultureChange}>
            <SelectTrigger className="w-full sm:w-[200px] h-10">
              <SelectValue placeholder="Culture" />
            </SelectTrigger>
            <SelectContent>
              {CULTURE_CATEGORIES.map((category) => (
                <SelectGroup key={category.id}>
                  <SelectLabel>{category.label}</SelectLabel>
                  {category.subcategories?.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          {/* View toggle + clear */}
          <div className="flex items-center gap-2 ml-auto">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSearchChange('')
                  onServiceTypeChange('')
                  onCultureChange('')
                }}
                className="text-xs text-muted-foreground gap-1"
              >
                <X className="size-3.5" />
                Effacer
              </Button>
            )}
            <div className="hidden sm:flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => onViewModeChange('grid')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'grid' ? 'bg-[#823F91] text-white' : 'text-gray-400 hover:text-gray-600'
                )}
                aria-label="Vue grille"
              >
                <Grid3X3 className="size-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'list' ? 'bg-[#823F91] text-white' : 'text-gray-400 hover:text-gray-600'
                )}
                aria-label="Vue liste"
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Empty State ---

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="size-16 rounded-full bg-[#E8D4EF] flex items-center justify-center mb-4">
        <Search className="size-7 text-[#823F91]" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Aucun prestataire trouve
      </h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Essayez de modifier vos filtres ou d&apos;elargir votre recherche pour trouver des prestataires.
      </p>
    </div>
  )
}

// --- Main Client Component ---

export function PrestatairesPageClient({
  providers,
  totalCount,
}: {
  providers: ProviderData[]
  totalCount: number
}) {
  const [search, setSearch] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [cultureId, setCultureId] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredProviders = useMemo(() => {
    let results = providers

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      results = results.filter((p) => {
        const name = (p.nom_entreprise || p.prenom || '').toLowerCase()
        const desc = (p.description_courte || '').toLowerCase()
        const city = (p.ville_principale || '').toLowerCase()
        const svcLabel = p.service_type ? getServiceTypeLabel(p.service_type).toLowerCase() : ''
        return name.includes(q) || desc.includes(q) || city.includes(q) || svcLabel.includes(q)
      })
    }

    // Service type filter
    if (serviceType) {
      results = results.filter((p) => p.service_type === serviceType)
    }

    // Culture filter
    if (cultureId) {
      results = results.filter((p) =>
        (p.provider_cultures ?? []).some((c) => c.culture_id === cultureId)
      )
    }

    return results
  }, [providers, search, serviceType, cultureId])

  return (
    <>
      <PrestatairesFilters
        search={search}
        onSearchChange={setSearch}
        serviceType={serviceType}
        onServiceTypeChange={setServiceType}
        cultureId={cultureId}
        onCultureChange={setCultureId}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Result count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-gray-900">{filteredProviders.length}</span>{' '}
            prestataire{filteredProviders.length !== 1 ? 's' : ''}{' '}
            {(search || serviceType || cultureId) ? 'trouves' : `sur ${totalCount}`}
          </p>
        </div>

        {filteredProviders.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'flex flex-col gap-4'
            )}
          >
            {filteredProviders.map((provider, index) => (
              <ProviderCard key={provider.id} provider={provider} index={index} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
