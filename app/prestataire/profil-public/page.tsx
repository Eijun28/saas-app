'use client'

import { useState, useEffect, Suspense } from 'react'
import { Info, Globe, MapPin, Camera, Sparkles, Briefcase, Upload, Check, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { AvatarUploader } from '@/components/provider/AvatarUploader'
import { BusinessNameEditor } from '@/components/provider/BusinessNameEditor'
import { ProfileDescriptionEditor } from '@/components/provider/ProfileDescriptionEditor'
import { CultureSelector } from '@/components/provider/CultureSelector'
import { ZoneSelector } from '@/components/provider/ZoneSelector'
import { PortfolioUploader } from '@/components/provider/PortfolioUploader'
import { ProfilePreviewDialog } from '@/components/provider/ProfilePreviewDialog'
import { ProfessionalInfoEditor } from '@/components/provider/ProfessionalInfoEditor'
import { SocialLinksEditor } from '@/components/provider/SocialLinksEditor'
import { CULTURES } from '@/lib/constants/cultures'
import { getServiceTypeLabel } from '@/lib/constants/service-types'
import { DEPARTEMENTS } from '@/lib/constants/zones'
import { motion } from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Masonry from 'react-masonry-css'
import { triggerConfetti } from '@/lib/utils/confetti'
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
    _timestamp?: number
  } | null>(null)
  const [cultures, setCultures] = useState<Array<{ id: string; label: string }>>([])
  const [zones, setZones] = useState<Array<{ id: string; label: string }>>([])
  const [portfolio, setPortfolio] = useState<Array<{ id: string; image_url: string; title?: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [activeTab, setActiveTab] = useState('infos')

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

  // Trigger confetti when completion reaches 100%
  useEffect(() => {
    const completionChecks = [
      { complete: !!profile?.avatar_url, label: 'Photo de profil' },
      { complete: !!profile?.nom_entreprise, label: "Nom d'entreprise" },
      { complete: !!profile?.description_courte, label: 'Description' },
      { complete: cultures.length > 0, label: 'Cultures' },
      { complete: zones.length > 0, label: 'Zones' },
      { complete: portfolio.length > 0, label: 'Portfolio' },
    ]
    const completedCount = completionChecks.filter(c => c.complete).length
    const completionPercent = Math.round((completedCount / completionChecks.length) * 100)
    
    if (completionPercent === 100) {
      triggerConfetti()
    }
  }, [profile, cultures, zones, portfolio])

  const reloadData = async () => {
    if (!user) return

    await new Promise(resolve => setTimeout(resolve, 500))
    await loadAllData(user.id, false)
    setRefreshKey(prev => prev + 1)
  }

  async function loadAllData(userId: string, showLoading = true) {
    if (showLoading) {
      setIsLoading(true)
    }

    try {
      const freshSupabase = createClient()
      
      let { data: profileData, error: profileError } = await freshSupabase
        .from('profiles')
        .select('avatar_url, prenom, nom, description_courte, bio, nom_entreprise, budget_min, budget_max, ville_principale, annees_experience, is_early_adopter, service_type')
        .eq('id', userId)
        .maybeSingle()

      if (profileError && profileError.code === '42703') {
        console.warn('⚠️ Certaines colonnes n\'existent pas, réessai sans réseaux sociaux')
        const { data, error } = await freshSupabase
          .from('profiles')
          .select('avatar_url, prenom, nom, description_courte, bio, nom_entreprise, budget_min, budget_max, ville_principale, annees_experience, is_early_adopter, service_type')
          .eq('id', userId)
          .maybeSingle()
        profileData = data
        profileError = error
      }

      let socialLinks = {
        instagram_url: null as string | null,
        facebook_url: null as string | null,
        website_url: null as string | null,
        linkedin_url: null as string | null,
        tiktok_url: null as string | null,
      }
      
      try {
        const { data: socialData } = await freshSupabase
          .from('profiles')
          .select('instagram_url, facebook_url, website_url, linkedin_url, tiktok_url')
          .eq('id', userId)
          .maybeSingle()
        
        if (socialData) {
          socialLinks = {
            instagram_url: socialData.instagram_url || null,
            facebook_url: socialData.facebook_url || null,
            website_url: socialData.website_url || null,
            linkedin_url: socialData.linkedin_url || null,
            tiktok_url: socialData.tiktok_url || null,
          }
        }
      } catch (socialError: any) {
        console.warn('⚠️ Colonnes réseaux sociaux non disponibles:', socialError?.message)
      }

      if (profileError && profileError.code !== 'PGRST116' && !profileError.message?.includes('does not exist')) {
        console.error('Erreur profil:', profileError)
        throw new Error(`Erreur profil: ${profileError.message}`)
      }

      const { data: culturesData } = await freshSupabase
        .from('provider_cultures')
        .select('culture_id')
        .eq('profile_id', userId)

      const { data: zonesData } = await freshSupabase
        .from('provider_zones')
        .select('zone_id')
        .eq('profile_id', userId)

      const { data: portfolioData } = await freshSupabase
        .from('provider_portfolio')
        .select('id, image_url, title')
        .eq('profile_id', userId)
        .order('display_order', { ascending: true })

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
        _timestamp: timestamp,
      }
      
      setProfile(newProfile)
      setCultures(mappedCultures)
      setZones(mappedZones)
      setPortfolio(mappedPortfolio)
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  const completionChecks = [
    { complete: !!profile?.avatar_url, label: 'Photo de profil' },
    { complete: !!profile?.nom_entreprise, label: "Nom d'entreprise" },
    { complete: !!profile?.description_courte, label: 'Description' },
    { complete: cultures.length > 0, label: 'Cultures' },
    { complete: zones.length > 0, label: 'Zones' },
    { complete: portfolio.length > 0, label: 'Portfolio' },
  ]

  const completedCount = completionChecks.filter(c => c.complete).length
  const completionPercent = Math.round((completedCount / completionChecks.length) * 100)

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
    <div className="min-h-screen bg-background">
      {/* Header Simple - Avatar à gauche, Nom/Métier, Bouton à droite */}
      <div className="w-full px-3 xs:px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3 sm:gap-4">
            {/* Avatar + Nom + Métier à gauche */}
            <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 flex-1 min-w-0 w-full xs:w-auto">
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
            <div className="w-full xs:w-auto flex-shrink-0">
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
                }}
                cultures={cultures}
                zones={zones}
                portfolio={portfolio}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Layout Centré - Sans sidebar */}
      <div className="w-full px-3 xs:px-4 sm:px-6 lg:px-8 pb-3 sm:pb-4 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          {/* COLONNE UNIQUE - Sections éditables avec Tabs */}
          <main>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 xs:space-y-4 sm:space-y-6">
                <TabsList className="grid grid-cols-4 w-full h-auto p-0.5 bg-muted/40 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                <TabsTrigger 
                  value="infos" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#823F91] data-[state=active]:to-[#9D5FA8] data-[state=active]:text-white data-[state=active]:shadow-sm text-xs sm:text-sm text-[#823F91] data-[state=active]:text-white group"
                >
                  <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 text-[#823F91] group-data-[state=active]:text-white transition-colors" />
                  <span className="hidden sm:inline">Infos</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="cultures"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#823F91] data-[state=active]:to-[#9D5FA8] data-[state=active]:text-white data-[state=active]:shadow-sm text-xs sm:text-sm text-[#823F91] data-[state=active]:text-white group"
                >
                  <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 text-[#823F91] group-data-[state=active]:text-white transition-colors" />
                  <span className="hidden sm:inline">Cultures</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="zones"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#823F91] data-[state=active]:to-[#9D5FA8] data-[state=active]:text-white data-[state=active]:shadow-sm text-xs sm:text-sm text-[#823F91] data-[state=active]:text-white group"
                >
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 text-[#823F91] group-data-[state=active]:text-white transition-colors" />
                  <span className="hidden sm:inline">Zones</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="portfolio"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#823F91] data-[state=active]:to-[#9D5FA8] data-[state=active]:text-white data-[state=active]:shadow-sm text-xs sm:text-sm text-[#823F91] data-[state=active]:text-white group"
                >
                  <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 text-[#823F91] group-data-[state=active]:text-white transition-colors" />
                  <span className="hidden sm:inline">Portfolio</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="infos" className="mt-3 xs:mt-4 sm:mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)]">
                    <div className="p-3 xs:p-4 sm:p-5 lg:p-6 space-y-3 xs:space-y-4 sm:space-y-5 lg:space-y-6">
                      <BusinessNameEditor
                        key={`business-name-${profile?._timestamp || 0}`}
                        userId={user.id}
                        currentName={profile?.nom_entreprise}
                        onSave={reloadData}
                      />
                      <ProfileDescriptionEditor
                        key={`profile-desc-${profile?._timestamp || 0}`}
                        userId={user.id}
                        currentDescription={profile?.description_courte}
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
                    </div>
                  </Card>
                </motion.div>
              </TabsContent>

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
                  
                  {portfolio.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Masonry
                        breakpointCols={{ default: 3, 1024: 2, 768: 2, 640: 3 }}
                        className="flex -ml-1 sm:-ml-2 lg:-ml-3 xl:-ml-4 w-auto"
                        columnClassName="pl-1 sm:pl-2 lg:pl-3 xl:pl-4 bg-clip-padding"
                      >
                        {portfolio.map((img, idx) => (
                          <motion.div
                            key={img.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ scale: 1.03 }}
                            className="mb-1 sm:mb-2 lg:mb-3 xl:mb-4 cursor-pointer group relative overflow-hidden rounded-md sm:rounded-lg lg:rounded-xl"
                            onClick={() => setLightboxIndex(idx)}
                          >
                            <img 
                              src={img.image_url} 
                              alt={img.title || `Portfolio ${idx + 1}`}
                              className="w-full aspect-square object-cover rounded-md sm:rounded-lg lg:rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:shadow-[0_2px_8px_rgba(0,0,0,0.1)] group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] sm:group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 sm:p-3 lg:p-4">
                              <p className="text-white text-[10px] sm:text-xs lg:text-sm font-medium line-clamp-1">{img.title || `Photo ${idx + 1}`}</p>
                            </div>
                          </motion.div>
                        ))}
                      </Masonry>

                      <Lightbox
                        open={lightboxIndex >= 0}
                        close={() => setLightboxIndex(-1)}
                        index={lightboxIndex}
                        slides={portfolio.map(img => ({ src: img.image_url }))}
                        plugins={[Zoom]}
                      />
                    </motion.div>
                  ) : (
                    <Card className="p-6 sm:p-8 lg:p-10 text-center shadow-[0_2px_8px_rgba(130,63,145,0.08)] bg-gradient-to-br from-purple-50/20 to-white">
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto mb-3 sm:mb-4 lg:mb-5 rounded-full bg-gradient-to-br from-[#823F91]/8 to-[#9D5FA8]/8 flex items-center justify-center shadow-[0_2px_4px_rgba(130,63,145,0.1)]">
                          <Camera className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-[#823F91]/50" />
                        </div>
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-1.5 lg:mb-2">Votre portfolio est vide</h3>
                        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mb-3 sm:mb-4 lg:mb-5 px-2">
                          Ajoutez vos plus belles réalisations pour séduire les futurs mariés
                        </p>
                      </motion.div>
                    </Card>
                  )}
                </motion.div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  )
}
