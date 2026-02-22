'use client'

import { useState, useEffect } from 'react'
import {
  Globe,
  MapPin,
  Camera,
  Sparkles,
  Briefcase,
  Tag,
  Euro,
  Share2,
  Store,
  ClipboardList,
  Eye,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { AvatarUploader } from '@/components/provider/AvatarUploader'
import { BusinessNameEditor } from '@/components/provider/BusinessNameEditor'
import { SiretEditor } from '@/components/provider/SiretEditor'
import { ProfileDescriptionEditor } from '@/components/provider/ProfileDescriptionEditor'
import { BioEditor } from '@/components/provider/BioEditor'
import { CultureSelector } from '@/components/provider/CultureSelector'
import { ZoneSelector } from '@/components/provider/ZoneSelector'
import { TagSelector } from '@/components/provider/TagSelector'
import { PortfolioUploader } from '@/components/provider/PortfolioUploader'
import { ProfilePreviewDialog } from '@/components/provider/ProfilePreviewDialog'
import { ProfessionalInfoEditor } from '@/components/provider/ProfessionalInfoEditor'
import { PricingEditor } from '@/components/provider/PricingEditor'
import { SocialLinksEditor } from '@/components/provider/SocialLinksEditor'
import { BoutiqueEditor } from '@/components/provider/BoutiqueEditor'
import { useProviderPricing } from '@/hooks/use-provider-pricing'
import { ServiceDetailsEditor } from '@/components/provider/ServiceDetailsEditor'
import { CULTURES } from '@/lib/constants/cultures'
import { getServiceTypeLabel } from '@/lib/constants/service-types'
import { hasServiceFields } from '@/lib/constants/service-fields'
import { DEPARTEMENTS } from '@/lib/constants/zones'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

interface Profile {
  nom_entreprise?: string
  avatar_url?: string | null
  service_type?: string
  prenom?: string
  nom?: string
  description_courte?: string
  bio?: string
  budget_min?: number
  budget_max?: number
  ville_principale?: string
  annees_experience?: number
  is_early_adopter?: boolean
  instagram_url?: string | null
  facebook_url?: string | null
  website_url?: string | null
  linkedin_url?: string | null
  tiktok_url?: string | null
  has_physical_location?: boolean
  boutique_name?: string | null
  boutique_address?: string | null
  boutique_address_complement?: string | null
  boutique_postal_code?: string | null
  boutique_city?: string | null
  boutique_country?: string | null
  boutique_phone?: string | null
  boutique_email?: string | null
  boutique_hours?: Record<string, { open: string; close: string; closed: boolean }> | null
  boutique_notes?: string | null
  boutique_appointment_only?: boolean
  siret?: string | null
  pricing_unit?: string
  _timestamp?: number
}

/* ─────────────────────────────────────────────
   Nav items
   ───────────────────────────────────────────── */

const NAV_ITEMS = [
  { id: 'infos', label: 'Infos', icon: Briefcase },
  { id: 'cultures', label: 'Cultures', icon: Globe },
  { id: 'zones', label: 'Zones', icon: MapPin },
  { id: 'tags', label: 'Tags', icon: Tag },
  { id: 'portfolio', label: 'Portfolio', icon: Camera },
] as const

type NavId = (typeof NAV_ITEMS)[number]['id'] | 'metier' | 'tarifs' | 'reseaux' | 'boutique'

/* ─────────────────────────────────────────────
   Section wrapper
   ───────────────────────────────────────────── */

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <Card className="card-section">
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-1.5 rounded-lg bg-[#823F91]/10 flex-shrink-0">
            <Icon className="h-4 w-4 text-[#823F91]" />
          </div>
          <h2 className="font-semibold text-sm sm:text-base text-foreground">{title}</h2>
        </div>
        {children}
      </div>
    </Card>
  )
}

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */

export default function ProfilPublicPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [cultures, setCultures] = useState<Array<{ id: string; label: string }>>([])
  const [zones, setZones] = useState<Array<{ id: string; label: string }>>([])
  const [portfolio, setPortfolio] = useState<Array<{ id: string; image_url: string; title?: string }>>([])
  const [serviceDetails, setServiceDetails] = useState<Record<string, unknown>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string>('infos')

  const { pricings, reload: reloadPricing } = useProviderPricing(user?.id || null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        loadAllData(user.id)
      } else {
        setIsLoading(false)
      }
    }
    getUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const reloadData = async () => {
    if (!user) return
    await loadAllData(user.id, false)
  }

  async function loadAllData(userId: string, showLoading = true) {
    if (showLoading) setIsLoading(true)

    try {
      const sb = createClient()

      const [
        profileResult,
        socialResult,
        culturesResult,
        zonesResult,
        portfolioResult,
        pricingResult,
        serviceDetailsResult,
      ] = await Promise.all([
        sb.from('profiles').select('avatar_url, prenom, nom, description_courte, bio, nom_entreprise, budget_min, budget_max, ville_principale, annees_experience, is_early_adopter, service_type, siret, has_physical_location, boutique_name, boutique_address, boutique_address_complement, boutique_postal_code, boutique_city, boutique_country, boutique_phone, boutique_email, boutique_hours, boutique_notes, boutique_appointment_only').eq('id', userId).maybeSingle(),
        sb.from('profiles').select('instagram_url, facebook_url, website_url, linkedin_url, tiktok_url').eq('id', userId).maybeSingle(),
        sb.from('provider_cultures').select('culture_id').eq('profile_id', userId),
        sb.from('provider_zones').select('zone_id').eq('profile_id', userId),
        sb.from('provider_portfolio').select('id, image_url, title').eq('profile_id', userId).order('display_order', { ascending: true }),
        sb.from('provider_pricing').select('pricing_unit').eq('provider_id', userId).eq('is_primary', true).maybeSingle(),
        sb.from('provider_service_details').select('details').eq('profile_id', userId).maybeSingle(),
      ])

      let profileData = profileResult.data
      if (profileResult.error?.code === '42703') {
        const { data } = await sb.from('profiles').select('avatar_url, prenom, nom, description_courte, bio, nom_entreprise, budget_min, budget_max, ville_principale, annees_experience, is_early_adopter, service_type').eq('id', userId).maybeSingle()
        profileData = data as typeof profileData
      }

      const socialData = socialResult.data
      const mappedCultures = (culturesResult.data || []).map(c => {
        const found = CULTURES.find(cult => cult.id === c.culture_id)
        return found ? { id: c.culture_id, label: found.label } : null
      }).filter(Boolean) as Array<{ id: string; label: string }>

      const mappedZones = (zonesResult.data || []).map(z => {
        const found = DEPARTEMENTS.find(dept => dept.id === z.zone_id)
        return found ? { id: z.zone_id, label: found.label } : null
      }).filter(Boolean) as Array<{ id: string; label: string }>

      const mappedPortfolio = (portfolioResult.data || []).map(p => ({
        id: p.id,
        image_url: p.image_url,
        title: p.title || undefined,
      }))

      setProfile({
        nom_entreprise: profileData?.nom_entreprise || undefined,
        avatar_url: profileData?.avatar_url || null,
        service_type: profileData?.service_type || undefined,
        prenom: profileData?.prenom || undefined,
        nom: profileData?.nom || undefined,
        description_courte: profileData?.description_courte || undefined,
        bio: profileData?.bio || undefined,
        budget_min: profileData?.budget_min ?? undefined,
        budget_max: profileData?.budget_max ?? undefined,
        ville_principale: profileData?.ville_principale || undefined,
        annees_experience: profileData?.annees_experience ?? undefined,
        is_early_adopter: profileData?.is_early_adopter || false,
        instagram_url: socialData?.instagram_url || null,
        facebook_url: socialData?.facebook_url || null,
        website_url: socialData?.website_url || null,
        linkedin_url: socialData?.linkedin_url || null,
        tiktok_url: socialData?.tiktok_url || null,
        siret: profileData?.siret || null,
        has_physical_location: profileData?.has_physical_location || false,
        boutique_name: profileData?.boutique_name || null,
        boutique_address: profileData?.boutique_address || null,
        boutique_address_complement: profileData?.boutique_address_complement || null,
        boutique_postal_code: profileData?.boutique_postal_code || null,
        boutique_city: profileData?.boutique_city || null,
        boutique_country: profileData?.boutique_country || null,
        boutique_phone: profileData?.boutique_phone || null,
        boutique_email: profileData?.boutique_email || null,
        boutique_hours: profileData?.boutique_hours || null,
        boutique_notes: profileData?.boutique_notes || null,
        boutique_appointment_only: profileData?.boutique_appointment_only || false,
        pricing_unit: pricingResult.data?.pricing_unit || undefined,
        _timestamp: Date.now(),
      })
      setCultures(mappedCultures)
      setZones(mappedZones)
      setPortfolio(mappedPortfolio)
      setServiceDetails((serviceDetailsResult.data?.details as Record<string, unknown>) || {})
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-[#823F91] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container max-w-4xl py-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Non connecté</h2>
        <p className="text-muted-foreground">Veuillez vous connecter pour accéder à cette page</p>
      </div>
    )
  }

  const hasMetier = profile?.service_type && hasServiceFields(profile.service_type)

  // Build nav sections: base + optional Métier
  const navSections = [
    { id: 'infos', label: 'Infos générales', icon: Briefcase },
    { id: 'tarifs', label: 'Tarifs', icon: Euro },
    { id: 'reseaux', label: 'Réseaux sociaux', icon: Share2 },
    { id: 'boutique', label: 'Lieu physique', icon: Store },
    ...(hasMetier ? [{ id: 'metier', label: 'Détails métier', icon: ClipboardList }] : []),
    { id: 'cultures', label: 'Cultures', icon: Globe },
    { id: 'zones', label: "Zones d'intervention", icon: MapPin },
    { id: 'tags', label: 'Tags', icon: Tag },
    { id: 'portfolio', label: 'Portfolio', icon: Camera },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto pb-12">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <AvatarUploader
              userId={user.id}
              currentAvatarUrl={profile?.avatar_url}
              userName={profile?.nom_entreprise || 'Utilisateur'}
              size="lg"
              editable
              showEnlarge={false}
              onAvatarUpdate={() => { if (user) reloadData() }}
            />
            {profile?.is_early_adopter && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center shadow-md z-10">
                <Sparkles className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">
              {profile?.nom_entreprise || 'Mon Entreprise'}
            </h1>
            {profile?.service_type && (
              <p className="text-sm text-muted-foreground truncate">
                {getServiceTypeLabel(profile.service_type)}
              </p>
            )}
          </div>
        </div>
        <ProfilePreviewDialog
          userId={user.id}
          profile={{
            nom_entreprise: profile?.nom_entreprise || 'Mon Entreprise',
            service_type: profile?.service_type ? getServiceTypeLabel(profile.service_type) : 'Prestataire',
            avatar_url: profile?.avatar_url || undefined,
            prenom: profile?.prenom,
            nom: profile?.nom,
            description_courte: profile?.description_courte,
            bio: profile?.bio,
            budget_min: profile?.budget_min,
            budget_max: profile?.budget_max,
            annees_experience: profile?.annees_experience,
            ville_principale: profile?.ville_principale,
            is_early_adopter: profile?.is_early_adopter || false,
            instagram_url: profile?.instagram_url,
            facebook_url: profile?.facebook_url,
            website_url: profile?.website_url,
            linkedin_url: profile?.linkedin_url,
            tiktok_url: profile?.tiktok_url,
            pricing_unit: profile?.pricing_unit,
          }}
          cultures={cultures}
          zones={zones}
          portfolio={portfolio}
          hasSiret={!!profile?.siret}
          serviceDetails={serviceDetails}
          serviceTypeValue={profile?.service_type}
        />
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left nav */}
        <nav className="md:w-52 shrink-0">
          <ul className="space-y-0.5">
            {navSections.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-left',
                    activeSection === id
                      ? 'bg-[#823F91]/10 text-[#823F91] font-semibold'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground font-medium'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          {activeSection === 'infos' && (
            <Section icon={Briefcase} title="Infos générales">
              <div className="space-y-5">
                <BusinessNameEditor userId={user.id} currentName={profile?.nom_entreprise} onSave={reloadData} />
                <SiretEditor userId={user.id} currentSiret={profile?.siret} onSave={reloadData} />
                <ProfileDescriptionEditor userId={user.id} currentDescription={profile?.description_courte} onSave={reloadData} />
                <BioEditor userId={user.id} currentBio={profile?.bio} onSave={reloadData} />
                <ProfessionalInfoEditor
                  userId={user.id}
                  currentBudgetMin={profile?.budget_min}
                  currentBudgetMax={profile?.budget_max}
                  currentExperience={profile?.annees_experience}
                  currentVille={profile?.ville_principale}
                  currentServiceType={profile?.service_type}
                  onSave={reloadData}
                />
              </div>
            </Section>
          )}

          {activeSection === 'tarifs' && (
            <Section icon={Euro} title="Tarifs">
              <PricingEditor providerId={user.id} initialPricing={pricings} onUpdate={reloadPricing} />
            </Section>
          )}

          {activeSection === 'reseaux' && (
            <Section icon={Share2} title="Réseaux sociaux">
              <SocialLinksEditor
                userId={user.id}
                currentLinks={{
                  instagram_url: profile?.instagram_url,
                  facebook_url: profile?.facebook_url,
                  website_url: profile?.website_url,
                  linkedin_url: profile?.linkedin_url,
                  tiktok_url: profile?.tiktok_url,
                }}
                onSave={reloadData}
              />
            </Section>
          )}

          {activeSection === 'boutique' && (
            <Section icon={Store} title="Lieu physique">
              <BoutiqueEditor
                userId={user.id}
                initialData={{
                  has_physical_location: profile?.has_physical_location || false,
                  boutique_name: profile?.boutique_name,
                  boutique_address: profile?.boutique_address,
                  boutique_address_complement: profile?.boutique_address_complement,
                  boutique_postal_code: profile?.boutique_postal_code,
                  boutique_city: profile?.boutique_city,
                  boutique_country: profile?.boutique_country,
                  boutique_phone: profile?.boutique_phone,
                  boutique_email: profile?.boutique_email,
                  boutique_hours: profile?.boutique_hours,
                  boutique_notes: profile?.boutique_notes,
                  boutique_appointment_only: profile?.boutique_appointment_only || false,
                }}
                onSave={reloadData}
              />
            </Section>
          )}

          {activeSection === 'metier' && hasMetier && (
            <Section icon={ClipboardList} title="Détails métier">
              <p className="text-sm text-muted-foreground mb-4">
                Renseignez les détails spécifiques à votre activité pour aider les couples à mieux vous trouver.
              </p>
              <ServiceDetailsEditor userId={user.id} serviceType={profile!.service_type!} onSave={() => loadAllData(user.id)} />
            </Section>
          )}

          {activeSection === 'cultures' && (
            <Section icon={Globe} title="Cultures">
              <CultureSelector userId={user.id} onSave={() => loadAllData(user.id)} />
            </Section>
          )}

          {activeSection === 'zones' && (
            <Section icon={MapPin} title="Zones d'intervention">
              <ZoneSelector userId={user.id} onSave={() => loadAllData(user.id)} />
            </Section>
          )}

          {activeSection === 'tags' && (
            <Section icon={Tag} title="Tags">
              <TagSelector userId={user.id} onSave={() => loadAllData(user.id)} />
            </Section>
          )}

          {activeSection === 'portfolio' && (
            <Section icon={Camera} title="Portfolio">
              <PortfolioUploader userId={user.id} onSave={() => loadAllData(user.id)} />
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}
