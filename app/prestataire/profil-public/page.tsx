'use client'

import { useState, useEffect, Suspense } from 'react'
import { Info, Globe, MapPin, Camera, Sparkles, Briefcase, Upload, Check, AlertCircle, Tag, Euro, Share2, Store, ClipboardList } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { PageTitle } from '@/components/prestataire/shared/PageTitle'
import { ProfileScoreCard } from '@/components/provider/ProfileScoreCard'
import { BrandColorPicker } from '@/components/provider/BrandColorPicker'
import { ServiceDetailsEditor } from '@/components/provider/ServiceDetailsEditor'
import { VisibilityStats } from '@/components/provider/VisibilityStats'
import { CULTURES } from '@/lib/constants/cultures'
import { getServiceTypeLabel } from '@/lib/constants/service-types'
import { hasServiceFields } from '@/lib/constants/service-fields'
import { DEPARTEMENTS } from '@/lib/constants/zones'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function ProfilPublicPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<{
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
    // Boutique fields
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
    brand_color?: string
    _timestamp?: number
  } | null>(null)
  const [cultures, setCultures] = useState<Array<{ id: string; label: string }>>([])
  const [zones, setZones] = useState<Array<{ id: string; label: string }>>([])
  const [portfolio, setPortfolio] = useState<Array<{ id: string; image_url: string; title?: string }>>([])
  const [serviceDetails, setServiceDetails] = useState<Record<string, unknown>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState('infos')

  // Pricing data
  const { pricings, reload: reloadPricing } = useProviderPricing(user?.id || null)

  useEffect(() => {
    async function getUser() {
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
    setRefreshKey(prev => prev + 1)
  }

  async function loadAllData(userId: string, showLoading = true) {
    if (showLoading) {
      setIsLoading(true)
    }

    try {
      const freshSupabase = createClient()

      // Lancer toutes les requêtes en parallèle pour un chargement rapide
      const [
        profileResult,
        socialResult,
        culturesResult,
        zonesResult,
        portfolioResult,
        pricingResult,
        brandResult,
        serviceDetailsResult,
      ] = await Promise.all([
        // Profil principal
        freshSupabase
          .from('profiles')
          .select('avatar_url, prenom, nom, description_courte, bio, nom_entreprise, budget_min, budget_max, ville_principale, annees_experience, is_early_adopter, service_type, siret, has_physical_location, boutique_name, boutique_address, boutique_address_complement, boutique_postal_code, boutique_city, boutique_country, boutique_phone, boutique_email, boutique_hours, boutique_notes, boutique_appointment_only')
          .eq('id', userId)
          .maybeSingle(),
        // Réseaux sociaux
        freshSupabase
          .from('profiles')
          .select('instagram_url, facebook_url, website_url, linkedin_url, tiktok_url')
          .eq('id', userId)
          .maybeSingle(),
        // Cultures
        freshSupabase
          .from('provider_cultures')
          .select('culture_id')
          .eq('profile_id', userId),
        // Zones
        freshSupabase
          .from('provider_zones')
          .select('zone_id')
          .eq('profile_id', userId),
        // Portfolio
        freshSupabase
          .from('provider_portfolio')
          .select('id, image_url, title')
          .eq('profile_id', userId)
          .order('display_order', { ascending: true }),
        // Pricing principal
        freshSupabase
          .from('provider_pricing')
          .select('pricing_unit')
          .eq('provider_id', userId)
          .eq('is_primary', true)
          .maybeSingle(),
        // Couleur de marque
        freshSupabase
          .from('prestataire_profiles')
          .select('brand_color')
          .eq('user_id', userId)
          .maybeSingle(),
        // Détails métier spécifiques
        freshSupabase
          .from('provider_service_details')
          .select('details')
          .eq('profile_id', userId)
          .maybeSingle(),
      ])

      // Traitement profil avec fallback si colonnes boutique manquantes
      let profileData = profileResult.data
      let profileError = profileResult.error

      if (profileError && profileError.code === '42703') {
        console.warn('⚠️ Certaines colonnes n\'existent pas, réessai sans boutique')
        const { data, error } = await freshSupabase
          .from('profiles')
          .select('avatar_url, prenom, nom, description_courte, bio, nom_entreprise, budget_min, budget_max, ville_principale, annees_experience, is_early_adopter, service_type')
          .eq('id', userId)
          .maybeSingle()
        profileData = data as typeof profileData
        profileError = error
      }

      if (profileError && profileError.code !== 'PGRST116' && !profileError.message?.includes('does not exist')) {
        console.error('Erreur profil:', profileError)
        throw new Error(`Erreur profil: ${profileError.message}`)
      }

      // Traitement réseaux sociaux
      const socialData = socialResult.data
      const socialLinks = {
        instagram_url: socialData?.instagram_url || null,
        facebook_url: socialData?.facebook_url || null,
        website_url: socialData?.website_url || null,
        linkedin_url: socialData?.linkedin_url || null,
        tiktok_url: socialData?.tiktok_url || null,
      }

      const culturesData = culturesResult.data
      const zonesData = zonesResult.data
      const portfolioData = portfolioResult.data
      const pricingData = pricingResult.data
      const brandColor = brandResult.data?.brand_color || '#823F91'

      const mappedCultures = (culturesData || []).map(c => {
        const culture = CULTURES.find(cult => cult.id === c.culture_id)
        return culture ? { id: c.culture_id, label: culture.label } : null
      }).filter(Boolean) as Array<{ id: string; label: string }>

      const mappedZones = (zonesData || []).map(z => {
        const zone = DEPARTEMENTS.find(dept => dept.id === z.zone_id)
        return zone ? { id: z.zone_id, label: zone.label } : null
      }).filter(Boolean) as Array<{ id: string; label: string }>

      const mappedPortfolio = (portfolioData || []).map(p => ({
        id: p.id,
        image_url: p.image_url,
        title: p.title || undefined,
      }))

      const loadedServiceDetails = (serviceDetailsResult.data?.details as Record<string, unknown>) || {}

      const timestamp = Date.now()
      const newProfile = {
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
        instagram_url: socialLinks.instagram_url,
        facebook_url: socialLinks.facebook_url,
        website_url: socialLinks.website_url,
        linkedin_url: socialLinks.linkedin_url,
        tiktok_url: socialLinks.tiktok_url,
        siret: profileData?.siret || null,
        // Boutique fields
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
        pricing_unit: pricingData?.pricing_unit || undefined,
        brand_color: brandColor,
        _timestamp: timestamp,
      }
      
      setProfile(newProfile)
      setCultures(mappedCultures)
      setZones(mappedZones)
      setPortfolio(mappedPortfolio)
      setServiceDetails(loadedServiceDetails)
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer mx-auto" />
          <Skeleton className="h-4 w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer mx-auto" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Non connecté</h2>
          <p className="text-muted-foreground">Veuillez vous connecter pour accéder à cette page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <PageTitle 
        title="Profil public"
        description="Gérez votre profil visible par les couples"
      />
      <div className="flex flex-row items-center justify-between gap-2 xs:gap-3 sm:gap-4">
            {/* Avatar + Nom + Métier à gauche */}
            <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <AvatarUploader 
                  userId={user.id}
                  currentAvatarUrl={profile?.avatar_url}
                  userName={profile?.nom_entreprise || 'Utilisateur'}
                  size="lg"
                  editable={true}
                  showEnlarge={false}
                  onAvatarUpdate={(url) => {
                    if (user) reloadData()
                  }}
                />
                {profile?.is_early_adopter && (
                  <div className={cn(
                    "absolute -top-1 -right-1 w-5 h-5 rounded-full shadow-[0_2px_4px_rgba(130,63,145,0.3)]",
                    "bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center z-10"
                  )}>
                    <Sparkles className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>
              
              {/* Nom et Métier */}
              <div className="space-y-0.5 min-w-0 flex-1">
                <h1 className="text-base xs:text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
                  {profile?.nom_entreprise || 'Mon Entreprise'}
                </h1>
                {profile?.service_type && (
                  <p className="text-[11px] xs:text-xs sm:text-sm text-muted-foreground truncate">
                    {getServiceTypeLabel(profile.service_type)}
                  </p>
                )}
              </div>
            </div>

            {/* Bouton Aperçu à droite */}
            <div className="flex-shrink-0">
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
                brandColor={profile?.brand_color}
                hasSiret={!!profile?.siret}
                serviceDetails={serviceDetails}
                serviceTypeValue={profile?.service_type}
              />
            </div>
          </div>

      {/* Carte Score de complétion */}
      <ProfileScoreCard
        profile={profile}
        cultures={cultures}
        zones={zones}
        portfolio={portfolio}
        serviceDetails={serviceDetails}
      />

      {/* Statistiques de visibilité */}
      <VisibilityStats
        userId={user.id}
        serviceType={profile?.service_type}
      />

      {/* COLONNE UNIQUE - Sections éditables avec Tabs */}
      <main>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 xs:space-y-4 sm:space-y-6">
                <TabsList className={cn("grid w-full h-auto p-0.5 bg-muted/40 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.08)]", profile?.service_type && hasServiceFields(profile.service_type) ? 'grid-cols-6' : 'grid-cols-5')}>
                <TabsTrigger
                  value="infos"
                  className="text-xs sm:text-sm font-medium data-[state=active]:shadow-sm"
                  style={{
                    background: activeTab === 'infos' ? 'linear-gradient(to right, #823F91, #9D5FA8)' : 'white',
                    color: activeTab === 'infos' ? '#ffffff' : '#823F91',
                  }}
                >
                  <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" style={{ color: 'inherit' }} />
                  <span className="hidden sm:inline" style={{ color: 'inherit' }}>Infos</span>
                </TabsTrigger>
                {profile?.service_type && hasServiceFields(profile.service_type) && (
                <TabsTrigger
                  value="metier"
                  className="text-xs sm:text-sm font-medium data-[state=active]:shadow-sm"
                  style={{
                    background: activeTab === 'metier' ? 'linear-gradient(to right, #823F91, #9D5FA8)' : 'white',
                    color: activeTab === 'metier' ? '#ffffff' : '#823F91',
                  }}
                >
                  <ClipboardList className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" style={{ color: 'inherit' }} />
                  <span className="hidden sm:inline" style={{ color: 'inherit' }}>Métier</span>
                </TabsTrigger>
                )}
                <TabsTrigger
                  value="cultures"
                  className="text-xs sm:text-sm font-medium data-[state=active]:shadow-sm"
                  style={{
                    background: activeTab === 'cultures' ? 'linear-gradient(to right, #823F91, #9D5FA8)' : 'white',
                    color: activeTab === 'cultures' ? '#ffffff' : '#823F91',
                  }}
                >
                  <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" style={{ color: 'inherit' }} />
                  <span className="hidden sm:inline" style={{ color: 'inherit' }}>Cultures</span>
                </TabsTrigger>
                <TabsTrigger
                  value="zones"
                  className="text-xs sm:text-sm font-medium data-[state=active]:shadow-sm"
                  style={{
                    background: activeTab === 'zones' ? 'linear-gradient(to right, #823F91, #9D5FA8)' : 'white',
                    color: activeTab === 'zones' ? '#ffffff' : '#823F91',
                  }}
                >
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" style={{ color: 'inherit' }} />
                  <span className="hidden sm:inline" style={{ color: 'inherit' }}>Zones</span>
                </TabsTrigger>
                <TabsTrigger
                  value="tags"
                  className="text-xs sm:text-sm font-medium data-[state=active]:shadow-sm"
                  style={{
                    background: activeTab === 'tags' ? 'linear-gradient(to right, #823F91, #9D5FA8)' : 'white',
                    color: activeTab === 'tags' ? '#ffffff' : '#823F91',
                  }}
                >
                  <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" style={{ color: 'inherit' }} />
                  <span className="hidden sm:inline" style={{ color: 'inherit' }}>Tags</span>
                </TabsTrigger>
                <TabsTrigger
                  value="portfolio"
                  className="text-xs sm:text-sm font-medium data-[state=active]:shadow-sm"
                  style={{
                    background: activeTab === 'portfolio' ? 'linear-gradient(to right, #823F91, #9D5FA8)' : 'white',
                    color: activeTab === 'portfolio' ? '#ffffff' : '#823F91',
                  }}
                >
                  <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" style={{ color: 'inherit' }} />
                  <span className="hidden sm:inline" style={{ color: 'inherit' }}>Portfolio</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="infos" className="mt-3 xs:mt-4 sm:mt-6 space-y-4">
                {/* Section 1 : Entreprise */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)]">
                    <div className="p-3 xs:p-4 sm:p-5 lg:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-[#823F91]/10">
                          <Briefcase className="h-4 w-4 text-[#823F91]" />
                        </div>
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">Entreprise</h3>
                      </div>
                      <div className="space-y-4 sm:space-y-5">
                        <BusinessNameEditor
                          key={`business-name-${profile?._timestamp || 0}`}
                          userId={user.id}
                          currentName={profile?.nom_entreprise}
                          onSave={reloadData}
                        />
                        <SiretEditor
                          key={`siret-${profile?._timestamp || 0}`}
                          userId={user.id}
                          currentSiret={profile?.siret}
                          onSave={reloadData}
                        />
                        <ProfileDescriptionEditor
                          key={`profile-desc-${profile?._timestamp || 0}`}
                          userId={user.id}
                          currentDescription={profile?.description_courte}
                          onSave={reloadData}
                        />
                        <BioEditor
                          key={`bio-${profile?._timestamp || 0}`}
                          userId={user.id}
                          currentBio={profile?.bio}
                          onSave={reloadData}
                        />
                        <ProfessionalInfoEditor
                          key={`professional-${profile?._timestamp || 0}`}
                          userId={user.id}
                          currentBudgetMin={profile?.budget_min}
                          currentBudgetMax={profile?.budget_max}
                          currentExperience={profile?.annees_experience}
                          currentVille={profile?.ville_principale}
                          currentServiceType={profile?.service_type}
                          onSave={reloadData}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Section 2 : Tarifs */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)]">
                    <div className="p-3 xs:p-4 sm:p-5 lg:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-[#823F91]/10">
                          <Euro className="h-4 w-4 text-[#823F91]" />
                        </div>
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">Tarifs</h3>
                      </div>
                      <PricingEditor
                        key={`pricing-${refreshKey}`}
                        providerId={user.id}
                        initialPricing={pricings}
                        onUpdate={reloadPricing}
                      />
                    </div>
                  </Card>
                </motion.div>

                {/* Section 3 : Réseaux & Apparence */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)]">
                    <div className="p-3 xs:p-4 sm:p-5 lg:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-[#823F91]/10">
                          <Share2 className="h-4 w-4 text-[#823F91]" />
                        </div>
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">Réseaux & Apparence</h3>
                      </div>
                      <div className="space-y-4 sm:space-y-5">
                        <SocialLinksEditor
                          key={`social-${profile?._timestamp || 0}`}
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
                        <div className="border-t pt-4">
                          <BrandColorPicker
                            userId={user.id}
                            currentColor={profile?.brand_color}
                            onSave={reloadData}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Section 4 : Lieu physique */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)]">
                    <div className="p-3 xs:p-4 sm:p-5 lg:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-[#823F91]/10">
                          <Store className="h-4 w-4 text-[#823F91]" />
                        </div>
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">Lieu physique</h3>
                      </div>
                      <BoutiqueEditor
                        key={`boutique-${profile?._timestamp || 0}`}
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
                    </div>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Onglet Détails Métier */}
              {profile?.service_type && hasServiceFields(profile.service_type) && (
              <TabsContent value="metier" className="mt-3 xs:mt-4 sm:mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)]">
                    <div className="p-3 xs:p-4 sm:p-5 lg:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-[#823F91]/10">
                          <ClipboardList className="h-4 w-4 text-[#823F91]" />
                        </div>
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                          Détails métier
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        Renseignez les détails spécifiques à votre activité pour aider les couples à mieux vous trouver.
                      </p>
                      <ServiceDetailsEditor
                        key={`service-details-${refreshKey}`}
                        userId={user.id}
                        serviceType={profile.service_type}
                        onSave={() => loadAllData(user.id)}
                      />
                    </div>
                  </Card>
                </motion.div>
              </TabsContent>
              )}

              <TabsContent value="cultures" className="mt-3 xs:mt-4 sm:mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)]">
                    <div className="p-3 xs:p-4 sm:p-5 lg:p-6">
                      <CultureSelector userId={user.id} onSave={() => loadAllData(user.id)} />
                    </div>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="zones" className="mt-3 xs:mt-4 sm:mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)]">
                    <div className="p-3 xs:p-4 sm:p-5 lg:p-6">
                      <ZoneSelector userId={user.id} onSave={() => loadAllData(user.id)} />
                    </div>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="tags" className="mt-3 xs:mt-4 sm:mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)]">
                    <div className="p-3 xs:p-4 sm:p-5 lg:p-6">
                      <TagSelector userId={user.id} onSave={() => loadAllData(user.id)} />
                    </div>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="portfolio" className="mt-3 xs:mt-4 sm:mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2 xs:space-y-3 sm:space-y-4 lg:space-y-5"
                >
                  <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)]">
                    <div className="p-3 xs:p-4 sm:p-5 lg:p-6">
                      <PortfolioUploader userId={user.id} onSave={() => loadAllData(user.id)} />
                    </div>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
      </main>
    </div>
  )
}
