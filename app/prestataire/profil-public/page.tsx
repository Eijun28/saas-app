'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
  } | null>(null)
  const [cultures, setCultures] = useState<Array<{ id: string; label: string }>>([])
  const [zones, setZones] = useState<Array<{ id: string; label: string }>>([])
  const [portfolio, setPortfolio] = useState<Array<{ id: string; image_url: string; title?: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const [openSections, setOpenSections] = useState({
    infos: true,
    cultures: false,
    zones: false,
    portfolio: false,
    reseaux: false,
  })

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
    
    // Attendre suffisamment longtemps pour s'assurer que la transaction DB est commitée
    // Les composants éditeurs appellent onSave après 500ms, donc on attend 600ms pour être sûr
    await new Promise(resolve => setTimeout(resolve, 600))
    
    // Recharger toutes les données depuis Supabase sans afficher le loader
    await loadAllData(user.id, false)
    
    // Forcer le re-render en incrémentant refreshKey
    setRefreshKey(prev => prev + 1)
  }

  async function loadAllData(userId: string, showLoading = true) {
    if (showLoading) {
      setIsLoading(true)
    }

    try {
      // Utiliser une nouvelle instance de supabase pour éviter les problèmes de cache
      const freshSupabase = createClient()
      
      console.log('🔄 Chargement des données pour userId:', userId)
      
      const { data: profileData, error: profileError } = await freshSupabase
        .from('profiles')
        .select('avatar_url, prenom, nom, description_courte, bio, nom_entreprise, budget_min, budget_max, ville_principale, annees_experience, is_early_adopter, instagram_url, facebook_url, website_url, linkedin_url, tiktok_url, service_type')
        .eq('id', userId)
        .maybeSingle()

      console.log('📥 Données reçues de Supabase:', profileData)
      console.log('❌ Erreur (si présente):', profileError)

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

      // Créer un nouvel objet pour forcer React à détecter le changement
      // ✅ AJOUT : Ajouter un timestamp pour forcer React à détecter le changement
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
        instagram_url: profileData?.instagram_url || null,
        facebook_url: profileData?.facebook_url || null,
        website_url: profileData?.website_url || null,
        linkedin_url: profileData?.linkedin_url || null,
        tiktok_url: profileData?.tiktok_url || null,
        _timestamp: timestamp, // ✅ Force React à détecter le changement
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Nouveau profil créé:', newProfile)
        console.log('✅ Cultures:', mappedCultures)
        console.log('✅ Zones:', mappedZones)
        console.log('✅ Portfolio:', mappedPortfolio)
      }
      
      // Mettre à jour tous les états en une seule fois pour forcer le re-render
      setProfile(newProfile)
      setCultures(mappedCultures)
      setZones(mappedZones)
      setPortfolio(mappedPortfolio)
      setRefreshKey(prev => prev + 1) // Forcer le re-render des composants enfants
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ États mis à jour, refreshKey:', refreshKey + 1)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section as keyof typeof prev] }))
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
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
      <div className="bg-background">
        <div className="container max-w-7xl">
          <div className="flex items-center justify-between h-20">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent">Profil public</h1>
              <p className="text-sm text-[#823F91]/70 mt-0.5">
                Complétez votre profil pour attirer plus de clients
              </p>
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
              }}
              cultures={cultures}
              zones={zones}
              portfolio={portfolio}
            />
          </div>
        </div>
      </div>

      <div className="container max-w-7xl py-8">
        <Card className="p-6 mb-6 bg-gradient-to-r from-[#823F91]/10 via-[#9D5FA8]/10 to-[#823F91]/10 border-[#823F91]/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-[#823F91]">Profil à {completionPercent}%</h3>
              <p className="text-sm text-[#823F91]">
                {completedCount} sur {completionChecks.length} sections complétées
              </p>
            </div>
            {completionPercent === 100 && (
              <Badge className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white shadow-md shadow-[#823F91]/30">
                <Check className="h-3 w-3 mr-1" />
                Complet
              </Badge>
            )}
          </div>
          <Progress 
            value={completionPercent} 
            className="h-2 bg-[#823F91]/20 [&>div]:bg-gradient-to-r [&>div]:from-[#823F91] [&>div]:to-[#9D5FA8]" 
          />
        </Card>

        {completionPercent < 100 && (
          <Card className="p-4 mb-6 border-[#823F91]/30 bg-gradient-to-r from-[#823F91]/10 via-[#9D5FA8]/10 to-[#823F91]/10">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-[#823F91] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm mb-2 text-[#823F91]">Pour compléter votre profil :</h4>
                <ul className="text-sm space-y-1">
                  {completionChecks
                    .filter(c => !c.complete)
                    .map((check, i) => (
                      <li key={i} className="text-[#823F91]">
                        • {check.label}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          <Collapsible
            open={openSections.infos}
            onOpenChange={() => toggleSection('infos')}
          >
            <Card className="border-[#823F91]/20 overflow-hidden">
              <CollapsibleTrigger className="w-full px-6 py-3 flex items-center justify-between bg-background">
                <div className="flex items-center gap-3">
                  {profile?.avatar_url && profile?.nom_entreprise && profile?.description_courte ? (
                    <Check className="h-5 w-5 text-[#823F91]" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-[#823F91]/40" />
                  )}
                  <div className="text-left">
                    <h3 className="font-semibold text-[#823F91]">Informations de base</h3>
                    <p className="text-sm text-[#823F91]">
                      Photo de profil, nom et description
                    </p>
                  </div>
                </div>
                {openSections.infos ? (
                  <ChevronUp className="h-5 w-5 text-[#823F91]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-[#823F91]" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6 space-y-6 border-t border-[#823F91]/20 pt-6 bg-background">
                  <AvatarUploader
                    userId={user.id}
                    currentAvatarUrl={profile?.avatar_url}
                    userName={profile?.nom_entreprise || 'Utilisateur'}
                    size="xl"
                    editable={true}
                    showEnlarge={false}
                    onAvatarUpdate={(url) => {
                      setProfile(prev => prev ? { ...prev, avatar_url: url } : null)
                      if (user) loadAllData(user.id)
                    }}
                  />
                  <BusinessNameEditor
                    key={`business-${refreshKey}-${profile?.nom_entreprise || ''}-${Date.now()}`}
                    userId={user.id}
                    currentName={profile?.nom_entreprise}
                    onSave={reloadData}
                  />
                  <ProfileDescriptionEditor
                    key={`description-${refreshKey}-${profile?.description_courte || ''}-${Date.now()}`}
                    userId={user.id}
                    currentDescription={profile?.description_courte}
                    currentBio={profile?.bio}
                    onSave={reloadData}
                  />
                  <ProfessionalInfoEditor
                    key={`professional-${refreshKey}-${profile?.budget_min || ''}-${profile?.budget_max || ''}-${Date.now()}`}
                    userId={user.id}
                    currentBudgetMin={profile?.budget_min}
                    currentBudgetMax={profile?.budget_max}
                    currentExperience={profile?.annees_experience}
                    currentVille={profile?.ville_principale}
                    onSave={reloadData}
                  />
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
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible
            open={openSections.cultures}
            onOpenChange={() => toggleSection('cultures')}
          >
            <Card className="border-[#823F91]/20 overflow-hidden">
              <CollapsibleTrigger className="w-full px-6 py-3 flex items-center justify-between bg-background">
                <div className="flex items-center gap-3">
                  {cultures.length > 0 ? (
                    <Check className="h-5 w-5 text-[#823F91]" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-[#823F91]/40" />
                  )}
                  <div className="text-left">
                    <h3 className="font-semibold text-[#823F91]">Cultures maîtrisées</h3>
                    <p className="text-sm text-[#823F91]">
                      {cultures.length > 0
                        ? `${cultures.length} culture${cultures.length > 1 ? 's' : ''} sélectionnée${cultures.length > 1 ? 's' : ''}`
                        : 'Aucune culture sélectionnée'}
                    </p>
                  </div>
                </div>
                {openSections.cultures ? (
                  <ChevronUp className="h-5 w-5 text-[#823F91]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-[#823F91]" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6 border-t border-[#823F91]/20 pt-6 bg-background">
                  <CultureSelector userId={user.id} onSave={() => loadAllData(user.id)} />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible
            open={openSections.zones}
            onOpenChange={() => toggleSection('zones')}
          >
            <Card className="border-[#823F91]/20 overflow-hidden">
              <CollapsibleTrigger className="w-full px-6 py-3 flex items-center justify-between bg-background">
                <div className="flex items-center gap-3">
                  {zones.length > 0 ? (
                    <Check className="h-5 w-5 text-[#823F91]" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-[#823F91]/40" />
                  )}
                  <div className="text-left">
                    <h3 className="font-semibold text-[#823F91]">Zones d&apos;intervention</h3>
                    <p className="text-sm text-[#823F91]">
                      {zones.length > 0
                        ? `${zones.length} département${zones.length > 1 ? 's' : ''}`
                        : 'Aucune zone sélectionnée'}
                    </p>
                  </div>
                </div>
                {openSections.zones ? (
                  <ChevronUp className="h-5 w-5 text-[#823F91]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-[#823F91]" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6 border-t border-[#823F91]/20 pt-6 bg-background">
                  <ZoneSelector userId={user.id} onSave={() => loadAllData(user.id)} />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible
            open={openSections.portfolio}
            onOpenChange={() => toggleSection('portfolio')}
          >
            <Card className="border-[#823F91]/20 overflow-hidden">
              <CollapsibleTrigger className="w-full px-6 py-3 flex items-center justify-between bg-background">
                <div className="flex items-center gap-3">
                  {portfolio.length > 0 ? (
                    <Check className="h-5 w-5 text-[#823F91]" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-[#823F91]/40" />
                  )}
                  <div className="text-left">
                    <h3 className="font-semibold text-[#823F91]">Portfolio</h3>
                    <p className="text-sm text-[#823F91]">
                      {portfolio.length > 0
                        ? `${portfolio.length} photo${portfolio.length > 1 ? 's' : ''}`
                        : 'Aucune photo ajoutée'}
                    </p>
                  </div>
                </div>
                {openSections.portfolio ? (
                  <ChevronUp className="h-5 w-5 text-[#823F91]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-[#823F91]" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6 border-t border-[#823F91]/20 pt-6 bg-background">
                  <PortfolioUploader userId={user.id} onSave={() => loadAllData(user.id)} />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>
    </div>
  )
}
