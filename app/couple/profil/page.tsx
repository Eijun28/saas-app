'use client'



import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { motion } from 'framer-motion'

import { Card, CardContent } from '@/components/ui/card'

import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'

import { Label } from '@/components/ui/label'

import { Textarea } from '@/components/ui/textarea'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Badge } from '@/components/ui/badge'

import { Progress } from '@/components/ui/progress'

import {

  Loader2, Check, User, Calendar,

  Palette, Briefcase, Church

} from 'lucide-react'

import { useUser } from '@/hooks/use-user'

import { createClient } from '@/lib/supabase/client'

import { CoupleAvatarUploader } from '@/components/couple/AvatarUploader'

import { toast } from 'sonner'

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from '@/components/ui/select-radix'

// Types pour les options de sélection

const CULTURES = [

  'Française', 'Marocaine', 'Algérienne', 'Tunisienne', 'Sénégalaise',

  'Camerounaise', 'Ivoirienne', 'Italienne', 'Espagnole', 'Portugaise',

  'Indienne', 'Pakistanaise', 'Chinoise', 'Vietnamienne', 'Thaïlandaise',

  'Turque', 'Libanaise', 'Syrienne', 'Autre'

]

const RELIGIONS = [

  'Musulman', 'Chrétien', 'Catholique', 'Protestant', 'Orthodoxe',

  'Juif', 'Hindou', 'Bouddhiste', 'Laïc/Non-religieux', 'Autre'

]

const WEDDING_STYLES = [

  { value: 'classique', label: 'Classique' },

  { value: 'moderne', label: 'Moderne' },

  { value: 'boheme', label: 'Bohème' },

  { value: 'traditionnel', label: 'Traditionnel' },

  { value: 'luxe', label: 'Luxe' },

  { value: 'champetre', label: 'Champêtre' },

  { value: 'minimaliste', label: 'Minimaliste' }

]

const AMBIANCES = [

  { value: 'intime', label: 'Intime' },

  { value: 'festif', label: 'Festif' },

  { value: 'elegant', label: 'Élégant' },

  { value: 'decontracte', label: 'Décontracté' },

  { value: 'romantique', label: 'Romantique' }

]

const SERVICES = [

  'Photographe', 'Vidéaste', 'Traiteur', 'Salle de réception',

  'DJ / Musicien', 'Fleuriste', 'Wedding Planner', 'Décorateur',

  'Coiffeur / Maquilleur', 'Pâtissier (wedding cake)', 'Location de voiture',

  'Animation', 'Officiant de cérémonie', 'Autre'

]

const WEDDING_TYPES = [

  { value: 'civil', label: 'Civil uniquement' },

  { value: 'religieux', label: 'Religieux uniquement' },

  { value: 'les_deux', label: 'Civil et religieux' },

  { value: 'autre', label: 'Autre' }

]

const PLANNING_STAGES = [

  { value: 'just_engaged', label: 'Tout juste fiancés' },

  { value: 'planning_started', label: 'Préparatifs commencés' },

  { value: 'almost_ready', label: 'Presque prêts' },

  { value: 'last_minute', label: 'Dernière ligne droite' }

]

const BUDGET_FLEXIBILITY = [

  { value: 'flexible', label: 'Flexible' },

  { value: 'somewhat_flexible', label: 'Moyennement flexible' },

  { value: 'strict', label: 'Budget strict' }

]

interface CoupleProfile {

  // Infos de base

  partner_1_name: string

  partner_2_name: string

  email: string

  avatar_url?: string

  

  // Mariage

  wedding_date?: string

  wedding_city?: string

  wedding_region?: string

  wedding_country?: string

  guest_count?: number

  wedding_type?: string

  

  // Culture

  cultures?: string[]

  religions?: string[]

  cultural_requirements?: string

  

  // Style

  wedding_style?: string

  ambiance?: string

  color_theme?: string

  

  // Services

  services_needed?: string[]

  service_priorities?: string[]

  other_services_text?: string

  

  // Budget

  budget_min?: number

  budget_max?: number

  budget_total?: number

  budget_flexibility?: string

  planning_stage?: string

  

  // Méta

  profile_completion?: number

  _timestamp?: number

}

export default function CoupleProfilPage() {

  const router = useRouter()

  const { user, loading: userLoading } = useUser()

  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)

  const [activeTab, setActiveTab] = useState('base')

  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  

  const [formData, setFormData] = useState<CoupleProfile>({

    partner_1_name: '',

    partner_2_name: '',

    email: '',

    cultures: [],

    religions: [],

    services_needed: [],

    service_priorities: [],

    other_services_text: '',

    wedding_country: 'France',

  })

  useEffect(() => {

    if (!userLoading && !user) {

      router.push('/sign-in')

      return

    }

    if (user) {

      loadProfile()

    }

  }, [user, userLoading, router])

  // Fonctions utilitaires pour convertir les données
  const extractWeddingStyle = (description: string | null): string => {
    if (!description) return ''
    const match = description.match(/Style: ([^|]+)/)
    return match ? match[1].trim() : ''
  }

  const extractAmbiance = (description: string | null): string => {
    if (!description) return ''
    const match = description.match(/Ambiance: ([^|]+)/)
    return match ? match[1].trim() : ''
  }

  const extractColorTheme = (description: string | null): string => {
    if (!description) return ''
    const match = description.match(/Couleurs: (.+)/)
    return match ? match[1].trim() : ''
  }

  const buildWeddingDescription = (style: string, ambiance: string, colors: string): string | null => {
    const parts: string[] = []
    if (style) parts.push(`Style: ${style}`)
    if (ambiance) parts.push(`Ambiance: ${ambiance}`)
    if (colors) parts.push(`Couleurs: ${colors}`)
    return parts.length > 0 ? parts.join(' | ') : null
  }

  const convertServicePrioritiesToArray = (priorities: any): string[] => {
    if (!priorities || typeof priorities !== 'object') return []
    return Object.keys(priorities)
  }

  const convertArrayToServicePriorities = (priorities: string[]): any => {
    if (!priorities || !Array.isArray(priorities)) return {}
    const result: any = {}
    priorities.forEach(service => {
      result[service] = 'medium' // valeur par défaut
    })
    return result
  }

  const mapOnboardingStepToPlanningStage = (step: number | null): string => {
    if (step === null || step === undefined) return ''
    const mapping: Record<number, string> = {
      0: 'just_engaged',
      1: 'planning_started',
      2: 'almost_ready',
      3: 'last_minute',
    }
    return mapping[step] || ''
  }

  const mapPlanningStageToOnboardingStep = (stage: string | null): number => {
    if (!stage) return 0
    const mapping: Record<string, number> = {
      'just_engaged': 0,
      'planning_started': 1,
      'almost_ready': 2,
      'last_minute': 3,
    }
    return mapping[stage] || 0
  }

  const loadProfile = async () => {

    if (!user) return

    

    setLoading(true)

    const supabase = createClient()

    

    try {

      // Charger couples avec couple_preferences
      const { data: coupleData, error: coupleError } = await supabase

        .from('couples')

        .select(`
          *,
          preferences:couple_preferences(*)
        `)

        .eq('user_id', user.id)

        .maybeSingle()

      if (coupleError) {

        console.error('Erreur chargement profil:', coupleError)

        toast.error('Erreur lors du chargement du profil')

        return

      }

      if (!coupleData) {
        toast.error('Profil couple introuvable')
        return
      }

      if (coupleData) {

        // Extraire les données depuis couple_preferences
        const prefs = coupleData.preferences || {} as any
        const culturalPrefs = (prefs.cultural_preferences || {}) as any

        // Extraire les données depuis wedding_description
        const weddingDesc = prefs.wedding_description || ''
        const weddingStyle = extractWeddingStyle(weddingDesc)
        const ambiance = extractAmbiance(weddingDesc)
        const colorTheme = extractColorTheme(weddingDesc)

        setFormData({

          partner_1_name: coupleData.partner_1_name || '',

          partner_2_name: coupleData.partner_2_name || '',

          email: coupleData.email || '',

          wedding_date: coupleData.wedding_date || '',

          wedding_city: coupleData.wedding_city || '',

          wedding_region: coupleData.wedding_region || '',

          wedding_country: coupleData.wedding_country || 'France',

          guest_count: coupleData.guest_count || undefined,

          wedding_type: coupleData.wedding_type || '',

          // Données depuis couple_preferences
          cultures: culturalPrefs.cultures || [],
          religions: culturalPrefs.religions || [],
          cultural_requirements: culturalPrefs.cultural_requirements || '',
          wedding_style: weddingStyle,
          ambiance: ambiance,
          color_theme: colorTheme,
          services_needed: prefs.essential_services || [],
          service_priorities: convertServicePrioritiesToArray(prefs.service_priorities),
          budget_flexibility: prefs.budget_breakdown?.flexibility || '',
          planning_stage: mapOnboardingStepToPlanningStage(prefs.onboarding_step),
          profile_completion: prefs.completion_percentage || 0,

          other_services_text: coupleData.other_services_text || '',

          budget_min: coupleData.budget_min || undefined,

          budget_max: coupleData.budget_max || undefined,

          budget_total: coupleData.budget_total || undefined,

          _timestamp: Date.now(),

        })

        

        if (coupleData.avatar_url) {

          setPhotoUrl(coupleData.avatar_url)

        }

      }

    } catch (error) {

      console.error('Erreur:', error)

      toast.error('Une erreur est survenue')

    } finally {

      setLoading(false)

    }

  }

  const calculateCompletion = (data: CoupleProfile): number => {

    const fields = [

      data.partner_1_name,

      data.partner_2_name,

      data.wedding_date,

      data.wedding_city,

      data.wedding_region,

      data.guest_count,

      data.wedding_type,

      data.cultures && data.cultures.length > 0,

      data.wedding_style,

      data.ambiance,

      data.services_needed && data.services_needed.length > 0,

      data.budget_min || data.budget_max,

      data.planning_stage,

    ]

    

    const completed = fields.filter(f => f).length

    return Math.round((completed / fields.length) * 100)

  }

  const handleSave = async () => {

    if (!user) return

    setSaving(true)

    const supabase = createClient()

    try {

      const completion = calculateCompletion(formData)

      // 1. Mettre à jour couples (données de base uniquement)
      const { error: coupleError } = await supabase

        .from('couples')

        .update({

          partner_1_name: formData.partner_1_name.trim(),

          partner_2_name: formData.partner_2_name.trim(),

          wedding_date: formData.wedding_date || null,

          wedding_city: formData.wedding_city || null,

          wedding_region: formData.wedding_region || null,

          wedding_country: formData.wedding_country || 'France',

          guest_count: formData.guest_count || null,

          wedding_type: formData.wedding_type || null,

          other_services_text: formData.other_services_text || null,

          budget_min: formData.budget_min || null,

          budget_max: formData.budget_max || null,

          budget_total: formData.budget_total || null,

          updated_at: new Date().toISOString(),

        })

        .eq('user_id', user.id)

      if (coupleError) {

        console.error('Erreur sauvegarde couple:', coupleError)

        toast.error('Erreur lors de la sauvegarde')

        return

      }

      // 2. Préparer les données pour couple_preferences
      const culturalPrefs = {
        cultures: formData.cultures || [],
        religions: formData.religions || [],
        cultural_requirements: formData.cultural_requirements || null,
        religious_ceremony: formData.religions?.[0] || null,
      }

      const weddingDesc = buildWeddingDescription(
        formData.wedding_style || '',
        formData.ambiance || '',
        formData.color_theme || ''
      )

      const servicePriorities = convertArrayToServicePriorities(formData.service_priorities || [])

      const budgetBreakdown = {
        flexibility: formData.budget_flexibility || null,
        total: {
          min: formData.budget_min || 0,
          max: formData.budget_max || 0,
        }
      }

      // Vérifier que l'utilisateur est bien authentifié
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authUser) {
        console.error('Erreur authentification:', authError)
        toast.error('Erreur d\'authentification')
        return
      }

      if (authUser.id !== user.id) {
        console.error('ID utilisateur mismatch:', { authUserId: authUser.id, userId: user.id })
        toast.error('Erreur: utilisateur non correspondant')
        return
      }

      // Récupérer le couple_id avec toutes les informations nécessaires pour le débogage
      const { data: couple, error: coupleFetchError } = await supabase
        .from('couples')
        .select('id, user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (coupleFetchError) {
        console.error('Erreur récupération couple:', {
          error: coupleFetchError,
          user_id: user.id,
          auth_uid: authUser.id,
        })
        toast.error('Erreur lors de la récupération du profil couple')
        return
      }

      if (!couple || !couple.id) {
        console.error('Couple introuvable:', {
          user_id: user.id,
          auth_uid: authUser.id,
        })
        toast.error('Couple introuvable')
        return
      }

      // Vérifier que le couple appartient bien à l'utilisateur
      if (couple.user_id !== user.id) {
        console.error('Couple n\'appartient pas à l\'utilisateur:', {
          couple_user_id: couple.user_id,
          user_id: user.id,
          auth_uid: authUser.id,
        })
        toast.error('Erreur: le couple n\'appartient pas à l\'utilisateur')
        return
      }

      console.log('Vérifications OK:', {
        couple_id: couple.id,
        couple_user_id: couple.user_id,
        user_id: user.id,
        auth_uid: authUser.id,
      })

      // Vérifier si couple_preferences existe
      const { data: existingPrefs, error: checkError } = await supabase
        .from('couple_preferences')
        .select('id')
        .eq('couple_id', couple.id)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erreur vérification préférences:', checkError)
        toast.error('Erreur lors de la vérification des préférences')
        return
      }

      if (existingPrefs) {
        // Mettre à jour couple_preferences
        const { error: prefsError } = await supabase
          .from('couple_preferences')
          .update({
            cultural_preferences: culturalPrefs,
            essential_services: formData.services_needed || [],
            service_priorities: servicePriorities,
            wedding_description: weddingDesc,
            budget_breakdown: budgetBreakdown,
            completion_percentage: completion,
            onboarding_step: mapPlanningStageToOnboardingStep(formData.planning_stage || null),
            profile_completed: completion >= 80,
            updated_at: new Date().toISOString(),
          })
          .eq('couple_id', couple.id)

        if (prefsError) {
          console.error('Erreur sauvegarde préférences:', prefsError)
          toast.error('Erreur lors de la sauvegarde des préférences')
          return
        }
      } else {
        // Créer couple_preferences
        // Préparer les données avec toutes les valeurs nécessaires
        const preferencesData = {
          couple_id: couple.id,
          languages: ['français'], // Colonne requise avec valeur par défaut
          cultural_preferences: culturalPrefs && Object.keys(culturalPrefs).length > 0 ? culturalPrefs : {},
          essential_services: Array.isArray(formData.services_needed) ? formData.services_needed : [],
          optional_services: [], // Colonne manquante
          service_priorities: servicePriorities && Object.keys(servicePriorities).length > 0 ? servicePriorities : {},
          wedding_description: weddingDesc && weddingDesc.trim() ? weddingDesc.trim() : null,
          budget_breakdown: budgetBreakdown && Object.keys(budgetBreakdown).length > 0 ? budgetBreakdown : {},
          completion_percentage: typeof completion === 'number' ? completion : 0,
          onboarding_step: mapPlanningStageToOnboardingStep(formData.planning_stage || null) || 0,
          profile_completed: (typeof completion === 'number' ? completion : 0) >= 80,
        }

        console.log('Données à insérer dans couple_preferences:', preferencesData)

        const { data: insertedData, error: prefsError } = await supabase
          .from('couple_preferences')
          .insert(preferencesData)
          .select()
          .single()

        if (prefsError) {
          console.error('Erreur création préférences:', {
            error: prefsError,
            message: prefsError.message,
            details: prefsError.details,
            hint: prefsError.hint,
            code: prefsError.code,
            couple_id: couple.id,
            data_tentative: preferencesData,
          })
          toast.error(`Erreur lors de la création des préférences: ${prefsError.message || prefsError.code || 'Erreur inconnue'}`)
          return
        }

        if (!insertedData) {
          console.error('Aucune donnée retournée après insertion couple_preferences')
          toast.error('Erreur: aucune donnée retournée après création')
          return
        }
      }

      toast.success('Profil mis à jour avec succès')

      // ✅ FIX: Augmenter délai à 1500ms au lieu de 600ms
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Recharger le profil depuis la DB
      loadProfile()

    } catch (error) {

      console.error('Erreur:', error)

      toast.error('Une erreur est survenue')

    } finally {

      setSaving(false)

    }

  }

  const toggleArrayItem = (array: string[], item: string) => {

    if (array.includes(item)) {

      return array.filter(i => i !== item)

    }

    return [...array, item]

  }

  if (userLoading || loading) {

    return (

      <div className="min-h-screen bg-white flex items-center justify-center">

        <motion.div

          animate={{ opacity: [0.5, 1, 0.5] }}

          transition={{ repeat: Infinity, duration: 1.5 }}

        >

          <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />

        </motion.div>

      </div>

    )

  }

  const completion = formData.profile_completion || 0

  return (

    <div className="min-h-screen bg-background">

      {/* Header Simple - Avatar à gauche, Nom, Bouton à droite */}
      <div className="w-full px-3 xs:px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-row items-center justify-between gap-2 xs:gap-3 sm:gap-4">
            {/* Avatar + Nom à gauche */}
            <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                {user && (
                  <CoupleAvatarUploader
                    userId={user.id}
                    currentAvatarUrl={photoUrl}
                    userName={`${formData.partner_1_name || ''} ${formData.partner_2_name || ''}`.trim() || user?.email || ''}
                    size="lg"
                    editable={true}
                    showEnlarge={false}
                    onAvatarUpdate={(url) => {
                      loadProfile()
                    }}
                  />
                )}
              </div>
              
              {/* Nom */}
              <div className="space-y-0.5 min-w-0 flex-1">
                <h1 className="text-base xs:text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
                  {formData.partner_1_name && formData.partner_2_name 
                    ? `${formData.partner_1_name} & ${formData.partner_2_name}`
                    : formData.partner_1_name || 'Mon Profil'}
                </h1>
                {formData.wedding_date && (
                  <p className="text-[11px] xs:text-xs sm:text-sm text-muted-foreground truncate">
                    Mariage prévu le {new Date(formData.wedding_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>

            {/* Bouton Sauvegarder à droite */}
            <div className="flex-shrink-0">
              <Button
                onClick={handleSave}
                disabled={saving}
                size="sm"
                className="bg-[#823F91] hover:bg-[#6D3478] text-white shadow-sm h-8 px-3 text-xs"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    <span className="hidden sm:inline">Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    <span className="hidden sm:inline">Enregistrer</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de progression du profil */}
      <div className="w-full px-3 xs:px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              Profil prêt à {completion}%
            </span>
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#823F91] to-[#9D5FA8] transition-all duration-500 ease-out"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Layout Centré */}
      <div className="w-full px-3 xs:px-4 sm:px-6 lg:px-8 pb-3 sm:pb-4 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          {/* Tabs */}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 xs:space-y-4 sm:space-y-6">
            <TabsList className="grid grid-cols-5 w-full h-auto p-0.5 bg-muted/40 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <TabsTrigger 
                value="base" 
                className="!bg-white !text-[#823F91] data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-[#823F91] data-[state=active]:!to-[#9D5FA8] data-[state=active]:!text-white data-[state=active]:shadow-sm text-xs sm:text-sm font-medium group"
              >
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 !text-[#823F91] group-data-[state=active]:!text-white transition-colors" />
                <span className="hidden sm:inline !text-[#823F91] group-data-[state=active]:!text-white transition-colors">Infos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="mariage"
                className="!bg-white !text-[#823F91] data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-[#823F91] data-[state=active]:!to-[#9D5FA8] data-[state=active]:!text-white data-[state=active]:shadow-sm text-xs sm:text-sm font-medium group"
              >
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 !text-[#823F91] group-data-[state=active]:!text-white transition-colors" />
                <span className="hidden sm:inline !text-[#823F91] group-data-[state=active]:!text-white transition-colors">Mariage</span>
              </TabsTrigger>
              <TabsTrigger 
                value="culture"
                className="!bg-white !text-[#823F91] data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-[#823F91] data-[state=active]:!to-[#9D5FA8] data-[state=active]:!text-white data-[state=active]:shadow-sm text-xs sm:text-sm font-medium group"
              >
                <Church className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 !text-[#823F91] group-data-[state=active]:!text-white transition-colors" />
                <span className="hidden sm:inline !text-[#823F91] group-data-[state=active]:!text-white transition-colors">Culture</span>
              </TabsTrigger>
              <TabsTrigger 
                value="style"
                className="!bg-white !text-[#823F91] data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-[#823F91] data-[state=active]:!to-[#9D5FA8] data-[state=active]:!text-white data-[state=active]:shadow-sm text-xs sm:text-sm font-medium group"
              >
                <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 !text-[#823F91] group-data-[state=active]:!text-white transition-colors" />
                <span className="hidden sm:inline !text-[#823F91] group-data-[state=active]:!text-white transition-colors">Style</span>
              </TabsTrigger>
              <TabsTrigger 
                value="services"
                className="!bg-white !text-[#823F91] data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-[#823F91] data-[state=active]:!to-[#9D5FA8] data-[state=active]:!text-white data-[state=active]:shadow-sm text-xs sm:text-sm font-medium group"
              >
                <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 !text-[#823F91] group-data-[state=active]:!text-white transition-colors" />
                <span className="hidden sm:inline !text-[#823F91] group-data-[state=active]:!text-white transition-colors">Services</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Infos de base */}
            <TabsContent value="base" className="mt-3 xs:mt-4 sm:mt-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)]">
                  <CardContent className="p-3 xs:p-4 sm:p-5 lg:p-6 space-y-3 xs:space-y-4 sm:space-y-5 lg:space-y-6">
                    {/* Form Fields */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-2">

                    <Label htmlFor="partner_1_name">Partenaire 1 *</Label>

                    <Input

                      id="partner_1_name"

                      value={formData.partner_1_name}

                      onChange={(e) => setFormData({ ...formData, partner_1_name: e.target.value })}

                      placeholder="Prénom Nom"

                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="partner_2_name">Partenaire 2 *</Label>

                    <Input

                      id="partner_2_name"

                      value={formData.partner_2_name}

                      onChange={(e) => setFormData({ ...formData, partner_2_name: e.target.value })}

                      placeholder="Prénom Nom"

                    />

                  </div>

                  <div className="space-y-2 md:col-span-2">

                    <Label htmlFor="email">Email</Label>

                    <Input

                      id="email"

                      type="email"

                      value={formData.email}

                      disabled

                      className="bg-gray-50 cursor-not-allowed"

                    />

                    <p className="text-xs text-gray-500">

                      L'email ne peut pas être modifié

                    </p>

                  </div>

                </div>

                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* TAB 2: Mariage */}
            <TabsContent value="mariage" className="mt-3 xs:mt-4 sm:mt-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)]">

                  <CardContent className="p-3 xs:p-4 sm:p-5 lg:p-6 space-y-3 xs:space-y-4 sm:space-y-5 lg:space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-2">

                    <Label htmlFor="wedding_date">Date du mariage *</Label>

                    <Input

                      id="wedding_date"

                      type="date"

                      value={formData.wedding_date || ''}

                      onChange={(e) => setFormData({ ...formData, wedding_date: e.target.value })}

                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="wedding_type">Type de mariage</Label>

                    <Select

                      value={formData.wedding_type || ''}

                      onValueChange={(value) => setFormData({ ...formData, wedding_type: value })}

                    >

                      <SelectTrigger id="wedding_type">

                        <SelectValue placeholder="Sélectionner..." />

                      </SelectTrigger>

                      <SelectContent>

                        {WEDDING_TYPES.map((type) => (

                          <SelectItem key={type.value} value={type.value}>

                            {type.label}

                          </SelectItem>

                        ))}

                      </SelectContent>

                    </Select>

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="wedding_city">Ville *</Label>

                    <Input

                      id="wedding_city"

                      value={formData.wedding_city || ''}

                      onChange={(e) => setFormData({ ...formData, wedding_city: e.target.value })}

                      placeholder="Paris, Lyon, Marseille..."

                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="wedding_region">Région / Département</Label>

                    <Input

                      id="wedding_region"

                      value={formData.wedding_region || ''}

                      onChange={(e) => setFormData({ ...formData, wedding_region: e.target.value })}

                      placeholder="Île-de-France, Provence..."

                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="wedding_country">Pays</Label>

                    <Input

                      id="wedding_country"

                      value={formData.wedding_country || ''}

                      onChange={(e) => setFormData({ ...formData, wedding_country: e.target.value })}

                      placeholder="France"

                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="guest_count">Nombre d'invités estimé</Label>

                    <Input

                      id="guest_count"

                      type="number"

                      value={formData.guest_count || ''}

                      onChange={(e) => setFormData({ ...formData, guest_count: parseInt(e.target.value) || undefined })}

                      placeholder="50, 100, 200..."

                      min="1"

                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="budget_total">Budget total (€)</Label>

                    <Input

                      id="budget_total"

                      type="number"

                      value={formData.budget_total || ''}

                      onChange={(e) => setFormData({ ...formData, budget_total: parseInt(e.target.value) || undefined })}

                      placeholder="25000"

                      min="0"

                    />

                  </div>

                  <div className="space-y-2 md:col-span-2">

                    <Label htmlFor="planning_stage">Où en êtes-vous dans les préparatifs ?</Label>

                    <Select

                      value={formData.planning_stage || ''}

                      onValueChange={(value) => setFormData({ ...formData, planning_stage: value })}

                    >

                      <SelectTrigger id="planning_stage">

                        <SelectValue placeholder="Sélectionner..." />

                      </SelectTrigger>

                      <SelectContent>

                        {PLANNING_STAGES.map((stage) => (

                          <SelectItem key={stage.value} value={stage.value}>

                            {stage.label}

                          </SelectItem>

                        ))}

                      </SelectContent>

                    </Select>

                  </div>

                </div>

                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* TAB 3: Culture */}
          <TabsContent value="culture" className="mt-3 xs:mt-4 sm:mt-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)]">

                  <CardContent className="p-3 xs:p-4 sm:p-5 lg:p-6 space-y-3 xs:space-y-4 sm:space-y-5 lg:space-y-6">

                <div className="space-y-4">

                  <div>

                    <Label className="mb-3 block">Cultures représentées (sélection multiple)</Label>

                    <div className="flex flex-wrap gap-2">

                      {CULTURES.map((culture) => (

                        <Badge

                          key={culture}

                          variant={formData.cultures?.includes(culture) ? 'default' : 'outline'}

                          className={`cursor-pointer border-0 ${

                            formData.cultures?.includes(culture)

                              ? 'bg-[#823F91] hover:bg-[#6D3478] text-white shadow-[0_1px_3px_rgba(130,63,145,0.2)]'

                              : 'bg-white text-[#823F91] hover:bg-gray-50 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_0_0_1px_rgba(130,63,145,0.05)] hover:shadow-[0_2px_6px_rgba(130,63,145,0.12),0_0_0_1px_rgba(130,63,145,0.1)]'

                          }`}

                          onClick={() => setFormData({

                            ...formData,

                            cultures: toggleArrayItem(formData.cultures || [], culture)

                          })}

                        >

                          {culture}

                        </Badge>

                      ))}

                    </div>

                  </div>

                  <div>

                    <Label className="mb-3 block">Religions / Croyances (sélection multiple)</Label>

                    <div className="flex flex-wrap gap-2">

                      {RELIGIONS.map((religion) => (

                        <Badge

                          key={religion}

                          variant={formData.religions?.includes(religion) ? 'default' : 'outline'}

                          className={`cursor-pointer border-0 ${

                            formData.religions?.includes(religion)

                              ? 'bg-[#823F91] hover:bg-[#6D3478] text-white shadow-[0_1px_3px_rgba(130,63,145,0.2)]'

                              : 'bg-white text-[#823F91] hover:bg-gray-50 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_0_0_1px_rgba(130,63,145,0.05)] hover:shadow-[0_2px_6px_rgba(130,63,145,0.12),0_0_0_1px_rgba(130,63,145,0.1)]'

                          }`}

                          onClick={() => setFormData({

                            ...formData,

                            religions: toggleArrayItem(formData.religions || [], religion)

                          })}

                        >

                          {religion}

                        </Badge>

                      ))}

                    </div>

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="cultural_requirements">Besoins culturels spécifiques (optionnel)</Label>

                    <Textarea

                      id="cultural_requirements"

                      value={formData.cultural_requirements || ''}

                      onChange={(e) => setFormData({ ...formData, cultural_requirements: e.target.value })}

                      placeholder="Ex: cérémonie laïque bilingue, menu halal, traditions spécifiques..."

                      rows={4}

                    />

                  </div>

                </div>

              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* TAB 4: Style */}
        <TabsContent value="style" className="mt-3 xs:mt-4 sm:mt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)]">

                  <CardContent className="p-3 xs:p-4 sm:p-5 lg:p-6 space-y-3 xs:space-y-4 sm:space-y-5 lg:space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-2">

                    <Label htmlFor="wedding_style">Style de mariage</Label>

                    <Select

                      value={formData.wedding_style || ''}

                      onValueChange={(value) => setFormData({ ...formData, wedding_style: value })}

                    >

                      <SelectTrigger id="wedding_style">

                        <SelectValue placeholder="Sélectionner..." />

                      </SelectTrigger>

                      <SelectContent>

                        {WEDDING_STYLES.map((style) => (

                          <SelectItem key={style.value} value={style.value}>

                            {style.label}

                          </SelectItem>

                        ))}

                      </SelectContent>

                    </Select>

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="ambiance">Ambiance souhaitée</Label>

                    <Select

                      value={formData.ambiance || ''}

                      onValueChange={(value) => setFormData({ ...formData, ambiance: value })}

                    >

                      <SelectTrigger id="ambiance">

                        <SelectValue placeholder="Sélectionner..." />

                      </SelectTrigger>

                      <SelectContent>

                        {AMBIANCES.map((amb) => (

                          <SelectItem key={amb.value} value={amb.value}>

                            {amb.label}

                          </SelectItem>

                        ))}

                      </SelectContent>

                    </Select>

                  </div>

                  <div className="space-y-2 md:col-span-2">

                    <Label htmlFor="color_theme">Palette de couleurs (optionnel)</Label>

                    <Input

                      id="color_theme"

                      value={formData.color_theme || ''}

                      onChange={(e) => setFormData({ ...formData, color_theme: e.target.value })}

                      placeholder="Ex: Rose poudré et or, Blanc et vert eucalyptus..."

                    />

                  </div>

                </div>

            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      {/* TAB 5: Services */}
      <TabsContent value="services" className="mt-3 xs:mt-4 sm:mt-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)]">

                  <CardContent className="p-3 xs:p-4 sm:p-5 lg:p-6 space-y-3 xs:space-y-4 sm:space-y-5 lg:space-y-6">

                <div className="space-y-4">

                  <div>

                    <Label className="mb-3 block">Services nécessaires (sélection multiple)</Label>

                    <div className="flex flex-wrap gap-2">

                      {SERVICES.map((service) => (

                        <Badge

                          key={service}

                          variant={formData.services_needed?.includes(service) ? 'default' : 'outline'}

                          className={`cursor-pointer border-0 ${

                            formData.services_needed?.includes(service)

                              ? 'bg-[#823F91] hover:bg-[#6D3478] text-white shadow-[0_1px_3px_rgba(130,63,145,0.2)]'

                              : 'bg-white text-[#823F91] hover:bg-gray-50 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_0_0_1px_rgba(130,63,145,0.05)] hover:shadow-[0_2px_6px_rgba(130,63,145,0.12),0_0_0_1px_rgba(130,63,145,0.1)]'

                          }`}

                          onClick={() => {

                            const newServices = toggleArrayItem(formData.services_needed || [], service)

                            setFormData({

                              ...formData,

                              services_needed: newServices,

                              // Réinitialiser le texte personnalisé si "Autre" est désélectionné

                              ...(service === 'Autre' && !newServices.includes('Autre') ? { other_services_text: '' } : {})

                            })

                          }}

                        >

                          {service}

                        </Badge>

                      ))}

                    </div>

                    {/* Champ de texte pour préciser les services "Autre" */}

                    {formData.services_needed?.includes('Autre') && (

                      <div className="mt-4 space-y-2">

                        <Label htmlFor="other_services_text">Précisez les services nécessaires</Label>

                        <Textarea

                          id="other_services_text"

                          value={formData.other_services_text || ''}

                          onChange={(e) => setFormData({ ...formData, other_services_text: e.target.value })}

                          placeholder="Ex: Location de matériel de sonorisation, Service de traduction, etc."

                          rows={3}

                          className="resize-none"

                        />

                        <p className="text-xs text-gray-500">

                          Décrivez les services supplémentaires dont vous avez besoin

                        </p>

                      </div>

                    )}

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="space-y-2">

                      <Label htmlFor="budget_min">Budget minimum (€)</Label>

                      <Input

                        id="budget_min"

                        type="number"

                        value={formData.budget_min || ''}

                        onChange={(e) => setFormData({ ...formData, budget_min: parseInt(e.target.value) || undefined })}

                        placeholder="10000"

                        min="0"

                      />

                    </div>

                    <div className="space-y-2">

                      <Label htmlFor="budget_max">Budget maximum (€)</Label>

                      <Input

                        id="budget_max"

                        type="number"

                        value={formData.budget_max || ''}

                        onChange={(e) => setFormData({ ...formData, budget_max: parseInt(e.target.value) || undefined })}

                        placeholder="20000"

                        min="0"

                      />

                    </div>

                    <div className="space-y-2 md:col-span-2">

                      <Label htmlFor="budget_flexibility">Flexibilité du budget</Label>

                      <Select

                        value={formData.budget_flexibility || ''}

                        onValueChange={(value) => setFormData({ ...formData, budget_flexibility: value })}

                      >

                        <SelectTrigger id="budget_flexibility">

                          <SelectValue placeholder="Sélectionner..." />

                        </SelectTrigger>

                        <SelectContent>

                          {BUDGET_FLEXIBILITY.map((flex) => (

                            <SelectItem key={flex.value} value={flex.value}>

                              {flex.label}

                            </SelectItem>

                          ))}

                        </SelectContent>

                      </Select>

                    </div>

                  </div>

                </div>

            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>
    </Tabs>
        </div>
      </div>
    </div>

  )

}
