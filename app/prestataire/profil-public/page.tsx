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
import { CULTURES } from '@/lib/constants/cultures'
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
  } | null>(null)
  const [cultures, setCultures] = useState<Array<{ id: string; label: string }>>([])
  const [zones, setZones] = useState<Array<{ id: string; label: string }>>([])
  const [portfolio, setPortfolio] = useState<Array<{ id: string; image_url: string; title?: string }>>([])
  const [isLoading, setIsLoading] = useState(true)

  const [openSections, setOpenSections] = useState({
    infos: true,
    cultures: false,
    zones: false,
    portfolio: false,
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
  }, [])

  const reloadData = async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    if (user) loadAllData(user.id)
  }

  async function loadAllData(userId: string) {
    setIsLoading(true)

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('avatar_url, prenom, nom, description_courte, bio, nom_entreprise, budget_min, budget_max, ville_principale, annees_experience')
        .eq('id', userId)
        .maybeSingle()

      if (profileError && profileError.code !== 'PGRST116' && !profileError.message?.includes('does not exist')) {
        throw new Error(`Erreur profil: ${profileError.message}`)
      }

      const { data: culturesData } = await supabase
        .from('provider_cultures')
        .select('culture_id')
        .eq('profile_id', userId)

      const { data: zonesData } = await supabase
        .from('provider_zones')
        .select('zone_id')
        .eq('profile_id', userId)

      const { data: portfolioData } = await supabase
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

      setProfile({
        nom_entreprise: profileData?.nom_entreprise || undefined,
        avatar_url: profileData?.avatar_url || null,
        service_type: undefined,
        prenom: profileData?.prenom || undefined,
        nom: profileData?.nom || undefined,
        description_courte: profileData?.description_courte || undefined,
        bio: profileData?.bio || undefined,
        budget_min: profileData?.budget_min ?? undefined,
        budget_max: profileData?.budget_max ?? undefined,
        ville_principale: profileData?.ville_principale || undefined,
        annees_experience: profileData?.annees_experience ?? undefined,
      })

      setCultures(mappedCultures)
      setZones(mappedZones)
      setPortfolio(mappedPortfolio)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section as keyof typeof prev] }))
  }

  const completionChecks = [
    { complete: !!profile?.avatar_url, label: 'Photo de profil' },
    { complete: !!profile?.nom_entreprise, label: 'Nom d\'entreprise' },
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
      <div className="container max-w-6xl py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Non connecté</h2>
          <p className="text-muted-foreground">Veuillez vous connecter pour accéder à cette page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="bg-background border-b">
        <div className="container max-w-6xl">
          <div className="flex items-center justify-between h-20">
            <div>
              <h1 className="text-2xl font-bold">Profil public</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Complétez votre profil pour attirer plus de clients
              </p>
            </div>
            <ProfilePreviewDialog
              userId={user.id}
              profile={{
                nom_entreprise: profile?.nom_entreprise || 'Mon Entreprise',
                service_type: profile?.service_type || 'Prestataire',
                avatar_url: profile?.avatar_url || undefined,
                prenom: profile?.prenom,
                nom: profile?.nom,
                description_courte: profile?.description_courte,
                bio: profile?.bio,
                budget_min: profile?.budget_min,
                budget_max: profile?.budget_max,
                annees_experience: profile?.annees_experience,
                ville_principale: profile?.ville_principale,
              }}
              cultures={cultures}
              zones={zones}
              portfolio={portfolio}
            />
          </div>
        </div>
      </div>

      <div className="container max-w-6xl py-8">
        <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">Profil à {completionPercent}%</h3>
              <p className="text-sm text-muted-foreground">
                {completedCount} sur {completionChecks.length} sections complétées
              </p>
            </div>
            {completionPercent === 100 && (
              <Badge className="bg-green-500">
                <Check className="h-3 w-3 mr-1" />
                Complet
              </Badge>
            )}
          </div>
          <Progress value={completionPercent} className="h-2" />
        </Card>

        {completionPercent < 100 && (
          <Card className="p-4 mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm mb-2">Pour compléter votre profil :</h4>
                <ul className="text-sm space-y-1">
                  {completionChecks
                    .filter(c => !c.complete)
                    .map((check, i) => (
                      <li key={i} className="text-muted-foreground">
                        • {check.label}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          <Collapsible
            open={openSections.infos}
            onOpenChange={() => toggleSection('infos')}
          >
            <Card>
              <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {profile?.avatar_url && profile?.nom_entreprise && profile?.description_courte ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-xs font-medium text-primary">1</span>
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold">Informations de base</h3>
                    <p className="text-xs text-muted-foreground">
                      Photo de profil, nom et description
                    </p>
                  </div>
                </div>
                {openSections.infos ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-3 border-t pt-3">
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
                    userId={user.id}
                    currentName={profile?.nom_entreprise}
                    onSave={reloadData}
                  />
                  <ProfileDescriptionEditor
                    userId={user.id}
                    currentDescription={profile?.description_courte}
                    currentBio={profile?.bio}
                    onSave={reloadData}
                  />
                  <ProfessionalInfoEditor
                    userId={user.id}
                    currentBudgetMin={profile?.budget_min}
                    currentBudgetMax={profile?.budget_max}
                    currentExperience={profile?.annees_experience}
                    currentVille={profile?.ville_principale}
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
            <Card>
              <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {cultures.length > 0 ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-xs font-medium text-primary">2</span>
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold">Cultures maîtrisées</h3>
                    <p className="text-xs text-muted-foreground">
                      {cultures.length > 0
                        ? `${cultures.length} culture${cultures.length > 1 ? 's' : ''} sélectionnée${cultures.length > 1 ? 's' : ''}`
                        : 'Aucune culture sélectionnée'}
                    </p>
                  </div>
                </div>
                {openSections.cultures ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 border-t pt-3">
                  <CultureSelector userId={user.id} onSave={() => loadAllData(user.id)} />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible
            open={openSections.zones}
            onOpenChange={() => toggleSection('zones')}
          >
            <Card>
              <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {zones.length > 0 ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-xs font-medium text-primary">3</span>
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold">Zones d'intervention</h3>
                    <p className="text-xs text-muted-foreground">
                      {zones.length > 0
                        ? `${zones.length} département${zones.length > 1 ? 's' : ''}`
                        : 'Aucune zone sélectionnée'}
                    </p>
                  </div>
                </div>
                {openSections.zones ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 border-t pt-3">
                  <ZoneSelector userId={user.id} onSave={() => loadAllData(user.id)} />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible
            open={openSections.portfolio}
            onOpenChange={() => toggleSection('portfolio')}
          >
            <Card>
              <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {portfolio.length > 0 ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-xs font-medium text-primary">4</span>
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold">Portfolio</h3>
                    <p className="text-xs text-muted-foreground">
                      {portfolio.length > 0
                        ? `${portfolio.length} photo${portfolio.length > 1 ? 's' : ''}`
                        : 'Aucune photo ajoutée'}
                    </p>
                  </div>
                </div>
                {openSections.portfolio ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 border-t pt-3">
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
