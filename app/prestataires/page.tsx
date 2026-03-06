import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PrestatairesPageClient } from '@/components/prestataires/PrestatairesPageClient'
import type { ProviderData } from '@/components/prestataires/PrestatairesPageClient'

export const metadata: Metadata = {
  title: 'Prestataires mariage multiculturel | NUPLY',
  description:
    'Trouvez les meilleurs prestataires pour votre mariage multiculturel. Photographes, traiteurs, DJ et plus de 80 types de services.',
}

export default async function PrestatairesPage() {
  const supabase = await createClient()

  // Main query: profiles with public profile join and cultures
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
    .order('created_at', { ascending: false })
    .limit(50)

  // If the join fails (FK name mismatch), fall back to a simpler query
  let providerList: ProviderData[] = []
  let totalCount = 0

  if (error) {
    // Fallback: query without joins
    const { data: fallbackData, count } = await supabase
      .from('profiles')
      .select('id, nom_entreprise, prenom, avatar_url, ville_principale, description_courte, service_type, budget_min, budget_max, is_early_adopter', { count: 'exact' })
      .eq('role', 'prestataire')
      .not('nom_entreprise', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50)

    providerList = (fallbackData ?? []).map((p) => ({
      ...p,
      prestataire_public_profiles: null,
      provider_cultures: null,
    }))
    totalCount = count ?? providerList.length
  } else {
    providerList = (providers ?? []) as unknown as ProviderData[]
    totalCount = providerList.length

    // Get exact total count for display
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'prestataire')
      .not('nom_entreprise', 'is', null)

    totalCount = count ?? providerList.length
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F5F0F7] via-white to-[#E8D4EF]/30 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Nos{' '}
            <span className="text-[#823F91]">prestataires</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Decouvrez des professionnels du mariage specialises dans les celebrations multiculturelles.
            Plus de 80 types de services pour un mariage qui vous ressemble.
          </p>

          {/* Social proof counter */}
          {totalCount > 0 && (
            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border border-[#E8D4EF] px-5 py-2.5 shadow-sm">
              <span className="text-2xl font-bold text-[#823F91]">{totalCount}</span>
              <span className="text-sm text-muted-foreground">
                prestataire{totalCount !== 1 ? 's' : ''} disponible{totalCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Decorative gradient blob */}
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-[#823F91]/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-[#E8D4EF]/40 blur-3xl pointer-events-none" />
      </section>

      {/* Client-side filters + grid */}
      <PrestatairesPageClient providers={providerList} totalCount={totalCount} />
    </main>
  )
}
