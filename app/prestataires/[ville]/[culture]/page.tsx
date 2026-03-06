import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createMetadata } from '@/lib/seo/config'
import { siteConfig } from '@/config/site'
import { JsonLd } from '@/components/seo/JsonLd'
import { getCultureById } from '@/lib/constants/cultures'
import { PrestatairesPageClient } from '@/components/prestataires/PrestatairesPageClient'
import type { ProviderData } from '@/components/prestataires/PrestatairesPageClient'
import { SEO_CITIES, SEO_CULTURES } from '@/lib/constants/seo-cities'

function capitalize(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** Escape SQL LIKE special characters to prevent pattern injection */
function escapeLikePattern(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&')
}

/** Validate that ville and culture are from known SEO lists */
function isValidParams(ville: string, culture: string): boolean {
  return SEO_CITIES.includes(ville) && SEO_CULTURES.includes(culture)
}

/** Pre-render all known city+culture combinations at build time */
export function generateStaticParams() {
  return SEO_CITIES.flatMap((ville) =>
    SEO_CULTURES.map((culture) => ({ ville, culture }))
  )
}

interface Props {
  params: Promise<{ ville: string; culture: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ville, culture } = await params
  if (!isValidParams(ville, culture)) return { title: 'Page non trouvee | NUPLY' }
  const villeLabel = decodeURIComponent(ville).replace(/-/g, ' ')
  const cultureLabel =
    getCultureById(culture)?.label ||
    decodeURIComponent(culture).replace(/-/g, ' ')

  const title = `Prestataires mariage ${cultureLabel} a ${capitalize(villeLabel)} | NUPLY`
  const description = `Trouvez les meilleurs prestataires specialises dans les mariages ${cultureLabel}s a ${capitalize(villeLabel)}. Photographes, traiteurs, DJ et decorateurs sur NUPLY.`

  return createMetadata({
    title,
    description,
    canonical: `/prestataires/${ville}/${culture}`,
    keywords: [
      `mariage ${cultureLabel.toLowerCase()}`,
      `prestataire mariage ${capitalize(villeLabel)}`,
      `mariage ${cultureLabel.toLowerCase()} ${capitalize(villeLabel)}`,
      `photographe mariage ${cultureLabel.toLowerCase()}`,
      `traiteur mariage ${cultureLabel.toLowerCase()}`,
    ],
  })
}

export default async function PrestatairesVilleCulturePage({ params }: Props) {
  const { ville, culture } = await params
  if (!isValidParams(ville, culture)) notFound()
  const villeLabel = decodeURIComponent(ville).replace(/-/g, ' ')
  const cultureLabel =
    getCultureById(culture)?.label ||
    decodeURIComponent(culture).replace(/-/g, ' ')

  const supabase = await createClient()

  // Query providers filtered by city and culture
  const { data: providers, error } = await supabase
    .from('profiles')
    .select(`
      id,
      nom_entreprise,
      prenom,
      avatar_url,
      ville_principale,
      description_courte,
      service_type,
      budget_min,
      budget_max,
      is_early_adopter,
      prestataire_public_profiles (
        rating,
        total_reviews,
        is_verified
      ),
      provider_cultures (
        culture_id
      )
    `)
    .eq('role', 'prestataire')
    .not('nom_entreprise', 'is', null)
    .ilike('ville_principale', `%${escapeLikePattern(villeLabel)}%`)
    .order('created_at', { ascending: false })
    .limit(50)

  let providerList: ProviderData[] = []
  let totalCount = 0

  if (error) {
    // Fallback: query without joins
    const { data: fallbackData, count } = await supabase
      .from('profiles')
      .select(
        'id, nom_entreprise, prenom, avatar_url, ville_principale, description_courte, service_type, budget_min, budget_max, is_early_adopter',
        { count: 'exact' }
      )
      .eq('role', 'prestataire')
      .not('nom_entreprise', 'is', null)
      .ilike('ville_principale', `%${escapeLikePattern(villeLabel)}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    providerList = (fallbackData ?? []).map((p) => ({
      ...p,
      prestataire_public_profiles: null,
      provider_cultures: null,
    }))
    totalCount = count ?? providerList.length
  } else {
    // Filter by culture on the joined provider_cultures
    const allProviders = (providers ?? []) as unknown as ProviderData[]
    providerList = allProviders.filter((p) =>
      p.provider_cultures?.some((pc) => pc.culture_id === culture)
    )
    totalCount = providerList.length
  }

  // JSON-LD BreadcrumbList schema
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: siteConfig.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Prestataires',
        item: `${siteConfig.url}/prestataires`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `Mariage ${cultureLabel} a ${capitalize(villeLabel)}`,
        item: `${siteConfig.url}/prestataires/${ville}/${culture}`,
      },
    ],
  }

  // JSON-LD ItemList for SEO
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Prestataires mariage ${cultureLabel} a ${capitalize(villeLabel)}`,
    description: `Liste des prestataires specialises dans les mariages ${cultureLabel}s a ${capitalize(villeLabel)}`,
    numberOfItems: totalCount,
    itemListElement: providerList.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${siteConfig.url}/prestataires/${p.id}`,
      name: p.nom_entreprise || p.prenom || 'Prestataire',
    })),
  }

  return (
    <main className="min-h-screen bg-white">
      <JsonLd data={[breadcrumbJsonLd, itemListJsonLd]} />

      {/* Breadcrumb navigation */}
      <nav
        aria-label="Fil d'ariane"
        className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8"
      >
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-[#823F91] transition-colors">
              Accueil
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href="/prestataires"
              className="hover:text-[#823F91] transition-colors"
            >
              Prestataires
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-foreground">
            {capitalize(villeLabel)} — Mariage {cultureLabel}
          </li>
        </ol>
      </nav>

      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F5F0F7] via-white to-[#E8D4EF]/30 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Prestataires mariage{' '}
            <span className="text-[#823F91]">{cultureLabel}</span> a{' '}
            {capitalize(villeLabel)}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Decouvrez les meilleurs professionnels specialises dans les mariages{' '}
            {cultureLabel.toLowerCase()}s a {capitalize(villeLabel)}.
            Photographes, traiteurs, DJ, decorateurs et bien d&apos;autres
            services pour celebrer votre union dans la tradition.
          </p>

          {totalCount > 0 && (
            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border border-[#E8D4EF] px-5 py-2.5 shadow-sm">
              <span className="text-2xl font-bold text-[#823F91]">
                {totalCount}
              </span>
              <span className="text-sm text-muted-foreground">
                prestataire{totalCount !== 1 ? 's' : ''} disponible
                {totalCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Decorative gradient blobs */}
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-[#823F91]/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-[#E8D4EF]/40 blur-3xl pointer-events-none" />
      </section>

      {/* Provider grid or empty state */}
      {providerList.length > 0 ? (
        <PrestatairesPageClient
          providers={providerList}
          totalCount={totalCount}
        />
      ) : (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Aucun prestataire trouve pour ce critere
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Nous n&apos;avons pas encore de prestataire specialise dans les
            mariages {cultureLabel.toLowerCase()}s a{' '}
            {capitalize(villeLabel)}. Decouvrez tous nos prestataires
            disponibles sur la plateforme.
          </p>
          <Link
            href="/prestataires"
            className="mt-6 inline-flex items-center rounded-lg bg-[#823F91] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#6D3478]"
          >
            Voir tous les prestataires
          </Link>
        </section>
      )}

      {/* Back link */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Link
          href="/prestataires"
          className="text-sm font-medium text-[#823F91] hover:text-[#6D3478] transition-colors"
        >
          &larr; Retour a la liste des prestataires
        </Link>
      </section>
    </main>
  )
}
