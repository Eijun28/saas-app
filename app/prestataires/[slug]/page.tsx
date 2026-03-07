import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Star, MapPin, BadgeCheck, ArrowLeft, Euro, Clock, Globe2, Heart } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getServiceTypeLabel, getServiceTypeIcon } from '@/lib/constants/service-types'
import { getCultureById } from '@/lib/constants/cultures'
import { JsonLd } from '@/components/seo/JsonLd'
import { siteConfig } from '@/config/site'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ReviewsList } from '@/components/reviews/ReviewsList'

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('nom_entreprise, service_type, ville_principale')
    .eq('id', slug)
    .eq('role', 'prestataire')
    .single()

  if (!data) return { title: 'Prestataire non trouve | NUPLY' }

  return {
    title: `${data.nom_entreprise} - ${getServiceTypeLabel(data.service_type || '')} | NUPLY`,
    description: `Decouvrez ${data.nom_entreprise}, ${getServiceTypeLabel(data.service_type || '')} a ${data.ville_principale || 'France'}. Profil, portfolio, avis et tarifs sur NUPLY.`,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={
            size === 'sm'
              ? `h-3.5 w-3.5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`
              : `h-4.5 w-4.5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`
          }
        />
      ))}
    </div>
  )
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PortfolioImage {
  id: string
  image_url: string
  caption: string | null
  display_order: number
}

interface Service {
  id: string
  name: string
  description: string | null
  price: number | null
  duration_hours: number | null
}

interface ProviderZone {
  zone_id: string
  zone_label: string
}

interface ProviderCulture {
  culture_id: string
}

export default async function ProviderPublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch all data in parallel
  const [profileResult, publicProfileResult, portfolioResult, servicesResult, culturesResult, zonesResult] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, nom_entreprise, prenom, nom, service_type, ville_principale, avatar_url')
        .eq('id', slug)
        .eq('role', 'prestataire')
        .single(),
      supabase
        .from('prestataire_public_profiles')
        .select('rating, total_reviews, is_verified, description')
        .eq('profile_id', slug)
        .maybeSingle(),
      supabase
        .from('portfolio_images')
        .select('id, image_url, caption, display_order')
        .eq('prestataire_id', slug)
        .order('display_order', { ascending: true }),
      supabase
        .from('services')
        .select('id, name, description, price, duration_hours')
        .eq('prestataire_id', slug),
      supabase
        .from('provider_cultures')
        .select('culture_id')
        .eq('profile_id', slug),
      supabase
        .from('provider_zones')
        .select('zone_id, zone_label')
        .eq('profile_id', slug),
    ])

  if (!profileResult.data) {
    notFound()
  }

  const profile = profileResult.data
  const publicProfile = publicProfileResult.data
  const portfolio: PortfolioImage[] = portfolioResult.data ?? []
  const services: Service[] = servicesResult.data ?? []
  const cultures: ProviderCulture[] = culturesResult.data ?? []
  const zones: ProviderZone[] = zonesResult.data ?? []

  const ServiceIcon = getServiceTypeIcon(profile.service_type || '')
  const serviceLabel = getServiceTypeLabel(profile.service_type || '')
  const rating = publicProfile?.rating ? Number(publicProfile.rating) : 0
  const totalReviews = publicProfile?.total_reviews ?? 0
  const isVerified = publicProfile?.is_verified ?? false
  const description = publicProfile?.description ?? null
  const initials = `${(profile.prenom || '').charAt(0)}${(profile.nom || '').charAt(0)}`.toUpperCase() || 'P'

  // JSON-LD LocalBusiness schema for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: profile.nom_entreprise || `${profile.prenom} ${profile.nom}`,
    description: description || `${serviceLabel} pour mariages multiculturels`,
    url: `${siteConfig.url}/prestataires/${slug}`,
    ...(profile.avatar_url ? { image: profile.avatar_url } : {}),
    ...(profile.ville_principale ? {
      address: {
        '@type': 'PostalAddress',
        addressLocality: profile.ville_principale,
        addressCountry: 'FR',
      },
    } : {}),
    ...(totalReviews > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating.toFixed(1),
        reviewCount: totalReviews,
        bestRating: '5',
        worstRating: '1',
      },
    } : {}),
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <JsonLd data={jsonLd} />
      {/* Back link */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <Link
            href="/prestataires"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#823F91] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux prestataires
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* ---------------------------------------------------------------- */}
          {/* Main content (2 cols on desktop) */}
          {/* ---------------------------------------------------------------- */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-2 ring-[#823F91]/10 ring-offset-2">
                    {profile.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={profile.nom_entreprise || ''} />
                    ) : null}
                    <AvatarFallback className="bg-[#823F91]/10 text-[#823F91] text-xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                        {profile.nom_entreprise || `${profile.prenom} ${profile.nom}`}
                      </h1>
                      {isVerified && (
                        <BadgeCheck className="h-5 w-5 text-[#823F91] shrink-0" />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="brand-secondary" className="gap-1">
                        <ServiceIcon className="h-3.5 w-3.5" />
                        {serviceLabel}
                      </Badge>
                      {profile.ville_principale && (
                        <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5" />
                          {profile.ville_principale}
                        </span>
                      )}
                    </div>

                    {totalReviews > 0 && (
                      <div className="flex items-center gap-2">
                        <StarRating rating={Math.round(rating)} />
                        <span className="text-sm font-semibold text-gray-900">
                          {rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-400">
                          ({totalReviews} avis)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About */}
            {description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">A propos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Portfolio gallery */}
            {portfolio.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {portfolio.map((img) => (
                      <div
                        key={img.id}
                        className="relative aspect-[4/3] rounded-xl overflow-hidden group"
                      >
                        <Image
                          src={img.image_url}
                          alt={img.caption || 'Photo portfolio'}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
                        />
                        {img.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs line-clamp-2">{img.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services & Pricing */}
            {services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Services & Tarifs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {services.map((service, idx) => (
                      <div key={service.id}>
                        {idx > 0 && <Separator className="mb-3" />}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900">
                              {service.name}
                            </h3>
                            {service.description && (
                              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                            {service.duration_hours && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-1">
                                <Clock className="h-3 w-3" />
                                {service.duration_hours}h
                              </span>
                            )}
                          </div>
                          {service.price != null && (
                            <span className="inline-flex items-center gap-0.5 text-sm font-bold text-[#823F91] whitespace-nowrap">
                              <Euro className="h-3.5 w-3.5" />
                              {formatPrice(service.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cultures */}
            {cultures.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="h-4.5 w-4.5 text-[#823F91]" />
                    Cultures prises en charge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {cultures.map((c) => {
                      const culture = getCultureById(c.culture_id)
                      return (
                        <Badge key={c.culture_id} variant="secondary" className="text-xs">
                          {culture?.label || c.culture_id}
                        </Badge>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avis clients</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewsList providerId={slug} />
              </CardContent>
            </Card>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Sidebar (1 col on desktop, stacked on mobile) */}
          {/* ---------------------------------------------------------------- */}
          <div className="space-y-6 lg:order-last">
            {/* Sticky CTA sidebar on desktop */}
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* CTA Card */}
              <Card className="border border-[#823F91]/10">
                <CardContent className="pt-6 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 text-center">
                    Interessé(e) ?
                  </h2>
                  <p className="text-sm text-gray-500 text-center">
                    Creez votre compte gratuitement pour contacter{' '}
                    {profile.nom_entreprise || `${profile.prenom}`} et recevoir un devis
                    personnalise.
                  </p>
                  <Button asChild className="w-full" size="lg">
                    <Link href="/sign-up">Contactez ce prestataire</Link>
                  </Button>
                  <p className="text-xs text-gray-400 text-center">
                    Inscription gratuite, sans engagement
                  </p>
                </CardContent>
              </Card>

              {/* Quick info card */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Informations</h3>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <ServiceIcon className="h-4 w-4 text-[#823F91]" />
                      <span>{serviceLabel}</span>
                    </div>

                    {profile.ville_principale && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4 text-[#823F91]" />
                        <span>{profile.ville_principale}</span>
                      </div>
                    )}

                    {isVerified && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <BadgeCheck className="h-4 w-4 text-[#823F91]" />
                        <span>Profil verifie</span>
                      </div>
                    )}

                    {totalReviews > 0 && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span>
                          {rating.toFixed(1)} / 5 ({totalReviews} avis)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Zones */}
                  {zones.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-2">
                          <Globe2 className="h-4 w-4 text-[#823F91]" />
                          Zones d&apos;intervention
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {zones.map((z) => (
                            <Badge key={z.zone_id} variant="outline" size="sm" className="text-xs">
                              {z.zone_label || z.zone_id}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-sm border-t border-gray-100 p-3 safe-area-inset-bottom">
        <Button asChild className="w-full" size="lg">
          <Link href="/sign-up">Contactez ce prestataire</Link>
        </Button>
      </div>

      {/* Spacer for mobile sticky CTA */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
