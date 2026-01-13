'use client'



import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { motion } from 'framer-motion'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'

import { Label } from '@/components/ui/label'

import { Textarea } from '@/components/ui/textarea'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Badge } from '@/components/ui/badge'

import { Progress } from '@/components/ui/progress'

import { 

  Loader2, Check, User, Calendar, 

  Palette, Briefcase, Church, ArrowUpDown

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

  const loadProfile = async () => {

    if (!user) return

    

    setLoading(true)

    const supabase = createClient()

    

    try {

      const { data, error } = await supabase

        .from('couples')

        .select('*')

        .eq('user_id', user.id)

        .single()

      if (error) {

        console.error('Erreur chargement profil:', error)

        toast.error('Erreur lors du chargement du profil')

        return

      }

      if (data) {

        setFormData({

          partner_1_name: data.partner_1_name || '',

          partner_2_name: data.partner_2_name || '',

          email: data.email || '',

          wedding_date: data.wedding_date || '',

          wedding_city: data.wedding_city || '',

          wedding_region: data.wedding_region || '',

          wedding_country: data.wedding_country || 'France',

          guest_count: data.guest_count || undefined,

          wedding_type: data.wedding_type || '',

          cultures: data.cultures || [],

          religions: data.religions || [],

          cultural_requirements: data.cultural_requirements || '',

          wedding_style: data.wedding_style || '',

          ambiance: data.ambiance || '',

          color_theme: data.color_theme || '',

          services_needed: data.services_needed || [],

          service_priorities: data.service_priorities || [],

          other_services_text: data.other_services_text || '',

          budget_min: data.budget_min || undefined,

          budget_max: data.budget_max || undefined,

          budget_total: data.budget_total || undefined,

          budget_flexibility: data.budget_flexibility || '',

          planning_stage: data.planning_stage || '',

          profile_completion: data.profile_completion || 0,

        })

        

        if (data.avatar_url) {

          setPhotoUrl(data.avatar_url)

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

      

      const { error } = await supabase

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

          cultures: formData.cultures || [],

          religions: formData.religions || [],

          cultural_requirements: formData.cultural_requirements || null,

          wedding_style: formData.wedding_style || null,

          ambiance: formData.ambiance || null,

          color_theme: formData.color_theme || null,

          services_needed: formData.services_needed || [],

          service_priorities: formData.service_priorities || [],

          other_services_text: formData.other_services_text || null,

          budget_min: formData.budget_min || null,

          budget_max: formData.budget_max || null,

          budget_total: formData.budget_total || null,

          budget_flexibility: formData.budget_flexibility || null,

          planning_stage: formData.planning_stage || null,

          profile_completion: completion,

          updated_at: new Date().toISOString(),

        })

        .eq('user_id', user.id)

      if (error) {

        console.error('Erreur sauvegarde:', error)

        toast.error('Erreur lors de la sauvegarde')

        return

      }

      toast.success('Profil mis à jour avec succès')

      // Attendre suffisamment longtemps pour s'assurer que la transaction DB est commitée
      await new Promise(resolve => setTimeout(resolve, 600))
      
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

    <div className="w-full">

      <div className="w-full px-6 space-y-6">

        {/* Header avec progression */}

        <motion.div

          initial={{ opacity: 0, y: -20 }}

          animate={{ opacity: 1, y: 0 }}

          className="space-y-4"

        >

          {/* Barre de progression */}

          <Card className="border-gray-200 shadow-soft">

            <CardContent className="pt-6">

              <div className="space-y-4">

                <div className="flex justify-between items-center">

                  <div>

                    <h3 className="text-lg font-semibold text-[#4A4A4A]">Complétion du profil</h3>

                    <p className="text-xs text-[#6B7280] mt-1">

                      {completion < 50 && 'Complétez votre profil pour obtenir de meilleures recommandations'}

                      {completion >= 50 && completion < 80 && 'Bon début ! Ajoutez plus de détails pour affiner les résultats'}

                      {completion >= 80 && 'Excellent ! Votre profil est presque complet'}

                    </p>

                  </div>

                  <div className="text-right">

                    <span className="text-2xl font-bold text-[#823F91]">{completion}%</span>

                  </div>

                </div>

                

                {/* Barre de progression principale avec style Nuply */}

                <div className="space-y-2">

                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">

                    <div 

                      className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-[#823F91] to-[#6D3478]"

                      style={{ width: `${completion}%` }}

                    />

                  </div>

                  <div className="flex justify-between text-xs text-[#6B7280]">

                    <span>0%</span>

                    <span>100%</span>

                  </div>

                </div>



                {/* Indicateurs visuels supplémentaires */}

                <div className="flex items-center gap-2 pt-2">

                  <div className="flex-1 flex items-center gap-2">

                    <div className={`h-2 w-2 rounded-full ${completion >= 25 ? 'bg-[#823F91]' : 'bg-gray-300'}`} />

                    <span className="text-xs text-[#6B7280]">Informations de base</span>

                  </div>

                  <div className="flex-1 flex items-center gap-2">

                    <div className={`h-2 w-2 rounded-full ${completion >= 50 ? 'bg-[#823F91]' : 'bg-gray-300'}`} />

                    <span className="text-xs text-[#6B7280]">Détails du mariage</span>

                  </div>

                  <div className="flex-1 flex items-center gap-2">

                    <div className={`h-2 w-2 rounded-full ${completion >= 75 ? 'bg-[#823F91]' : 'bg-gray-300'}`} />

                    <span className="text-xs text-[#6B7280]">Préférences</span>

                  </div>

                  <div className="flex-1 flex items-center gap-2">

                    <div className={`h-2 w-2 rounded-full ${completion >= 100 ? 'bg-[#823F91]' : 'bg-gray-300'}`} />

                    <span className="text-xs text-[#6B7280]">Complet</span>

                  </div>

                </div>

              </div>

            </CardContent>

          </Card>

        </motion.div>

        {/* Tabs */}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <TabsList className="grid w-full grid-cols-5 lg:w-auto">

            <TabsTrigger value="base" className="flex items-center gap-2">

              <User className="h-4 w-4" />

              <span className="hidden sm:inline">Infos de base</span>

            </TabsTrigger>

            <TabsTrigger value="mariage" className="flex items-center gap-2">

              <Calendar className="h-4 w-4" />

              <span className="hidden sm:inline">Mariage</span>

            </TabsTrigger>

            <TabsTrigger value="culture" className="flex items-center gap-2">

              <Church className="h-4 w-4" />

              <span className="hidden sm:inline">Culture</span>

            </TabsTrigger>

            <TabsTrigger value="style" className="flex items-center gap-2">

              <Palette className="h-4 w-4" />

              <span className="hidden sm:inline">Style</span>

            </TabsTrigger>

            <TabsTrigger value="services" className="flex items-center gap-2">

              <Briefcase className="h-4 w-4" />

              <span className="hidden sm:inline">Services</span>

            </TabsTrigger>

          </TabsList>

          {/* TAB 1: Infos de base */}

          <TabsContent value="base" className="space-y-6">

            <Card className="border-gray-200">

              <CardHeader>

                <CardTitle>Informations personnelles</CardTitle>

                <CardDescription>

                  Vos informations de base

                </CardDescription>

              </CardHeader>

              <CardContent className="space-y-6">

                {/* Avatar */}

                <div className="flex items-center gap-6">

                  {user && (

                    <CoupleAvatarUploader

                      userId={user.id}

                      currentAvatarUrl={photoUrl}

                      userName={`${formData.partner_1_name || ''} ${formData.partner_2_name || ''}`.trim() || user?.email || ''}

                      size="xl"

                      editable={true}

                      onAvatarUpdate={(url) => {

                        setPhotoUrl(url)

                        loadProfile()

                      }}

                    />

                  )}

                  <div>

                    <p className="text-lg font-semibold text-gray-900">

                      {formData.partner_1_name} {formData.partner_2_name && `& ${formData.partner_2_name}`}

                    </p>

                    <p className="text-sm text-gray-500">{formData.email}</p>

                  </div>

                </div>

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

          </TabsContent>

          {/* TAB 2: Mariage */}

          <TabsContent value="mariage" className="space-y-6">

            <Card className="border-gray-200">

              <CardHeader>

                <CardTitle>Détails du mariage</CardTitle>

                <CardDescription>

                  Informations sur votre événement

                </CardDescription>

              </CardHeader>

              <CardContent className="space-y-6">

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

          </TabsContent>

          {/* TAB 3: Culture */}

          <TabsContent value="culture" className="space-y-6">

            <Card className="border-gray-200">

              <CardHeader>

                <CardTitle>Préférences culturelles & religieuses</CardTitle>

                <CardDescription>

                  Aidez-nous à vous recommander des prestataires qui comprennent vos traditions

                </CardDescription>

              </CardHeader>

              <CardContent className="space-y-6">

                <div className="space-y-4">

                  <div>

                    <Label className="mb-3 block">Cultures représentées (sélection multiple)</Label>

                    <div className="flex flex-wrap gap-2">

                      {CULTURES.map((culture) => (

                        <Badge

                          key={culture}

                          variant={formData.cultures?.includes(culture) ? 'default' : 'outline'}

                          className={`cursor-pointer ${

                            formData.cultures?.includes(culture)

                              ? 'bg-[#823F91] hover:bg-[#6D3478]'

                              : 'hover:bg-gray-100'

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

                          className={`cursor-pointer ${

                            formData.religions?.includes(religion)

                              ? 'bg-[#823F91] hover:bg-[#6D3478]'

                              : 'hover:bg-gray-100'

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

          </TabsContent>

          {/* TAB 4: Style */}

          <TabsContent value="style" className="space-y-6">

            <Card className="border-gray-200">

              <CardHeader>

                <CardTitle>Style et ambiance</CardTitle>

                <CardDescription>

                  Définissez l'atmosphère de votre mariage

                </CardDescription>

              </CardHeader>

              <CardContent className="space-y-6">

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

          </TabsContent>

          {/* TAB 5: Services */}

          <TabsContent value="services" className="space-y-6">

            <Card className="border-gray-200">

              <CardHeader>

                <CardTitle>Services recherchés</CardTitle>

                <CardDescription>

                  Sélectionnez les prestataires dont vous avez besoin

                </CardDescription>

              </CardHeader>

              <CardContent className="space-y-6">

                <div className="space-y-4">

                  <div>

                    <Label className="mb-3 block">Services nécessaires (sélection multiple)</Label>

                    <div className="flex flex-wrap gap-2">

                      {SERVICES.map((service) => (

                        <Badge

                          key={service}

                          variant={formData.services_needed?.includes(service) ? 'default' : 'outline'}

                          className={`cursor-pointer ${

                            formData.services_needed?.includes(service)

                              ? 'bg-[#823F91] hover:bg-[#6D3478]'

                              : 'hover:bg-gray-100'

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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative items-end">

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

                    {/* Bouton d'échange */}
                    <button
                      type="button"
                      onClick={() => {
                        const temp = formData.budget_min
                        setFormData({
                          ...formData,
                          budget_min: formData.budget_max,
                          budget_max: temp
                        })
                      }}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:translate-y-0 md:top-auto md:bottom-0 z-10 p-2 rounded-full bg-[#823F91] hover:bg-[#6D3478] text-white transition-colors shadow-md hover:shadow-lg"
                      title="Échanger les valeurs"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </button>

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

          </TabsContent>

        </Tabs>

        {/* Bouton de sauvegarde fixe en bas */}

        <motion.div

          initial={{ opacity: 0 }}

          animate={{ opacity: 1 }}

          className="sticky bottom-4 flex justify-end"

        >

          <Button

            onClick={handleSave}

            disabled={saving}

            size="lg"

            className="bg-[#823F91] hover:bg-[#6D3478] shadow-lg"

          >

            {saving ? (

              <>

                <Loader2 className="h-5 w-5 mr-2 animate-spin" />

                Enregistrement...

              </>

            ) : (

              <>

                <Check className="h-5 w-5 mr-2" />

                Enregistrer les modifications

              </>

            )}

          </Button>

        </motion.div>

      </div>

    </div>

  )

}
