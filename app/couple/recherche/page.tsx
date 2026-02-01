'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Sparkles, Building2, X, ChevronDown, Filter, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { useIsMobile } from '@/hooks/use-mobile'
import { ProfilePreviewDialog } from '@/components/provider/ProfilePreviewDialog'
import { CULTURES } from '@/lib/constants/cultures'
import { DEPARTEMENTS } from '@/lib/constants/zones'
import { SERVICE_CATEGORIES } from '@/lib/constants/service-types'
import { PageTitle } from '@/components/couple/shared/PageTitle'

interface ProviderTag {
  id: string
  label: string
  category?: string
}

interface Provider {
  id: string
  nom_entreprise: string
  prenom?: string
  nom?: string
  avatar_url?: string | null
  ville_principale?: string | null
  description_courte?: string | null
  bio?: string | null
  budget_min?: number | null
  budget_max?: number | null
  service_type?: string | null
  annees_experience?: number | null
  is_early_adopter?: boolean
  instagram_url?: string | null
  facebook_url?: string | null
  website_url?: string | null
  linkedin_url?: string | null
  tiktok_url?: string | null
  cultures: Array<{ id: string; label: string }>
  zones: Array<{ id: string; label: string }>
  tags: ProviderTag[]
  completionPercentage?: number
}

// Utiliser la constante partagée (déjà importée)

// Pays organisés par continents
const COUNTRIES_BY_CONTINENT: Record<string, string[]> = {
  'afrique': [
    'Maroc', 'Algérie', 'Tunisie', 'Sénégal', 'Cameroun', 'Côte d\'Ivoire',
    'Mali', 'Burkina Faso', 'Niger', 'Tchad', 'Guinée', 'Bénin', 'Togo',
    'Gabon', 'Congo', 'Madagascar', 'Mauritanie', 'Autre'
  ],
  'asie': [
    'Inde', 'Pakistan', 'Bangladesh', 'Chine', 'Japon', 'Corée du Sud',
    'Vietnam', 'Thaïlande', 'Philippines', 'Indonésie', 'Malaisie', 'Singapour',
    'Sri Lanka', 'Népal', 'Autre'
  ],
  'europe': [
    'France', 'Italie', 'Espagne', 'Portugal', 'Allemagne', 'Belgique',
    'Suisse', 'Royaume-Uni', 'Pays-Bas', 'Grèce', 'Pologne', 'Roumanie',
    'Bulgarie', 'Autre'
  ],
  'amerique': [
    'États-Unis', 'Canada', 'Brésil', 'Mexique', 'Argentine', 'Colombie',
    'Chili', 'Pérou', 'Venezuela', 'Cuba', 'Haïti', 'Jamaïque', 'Autre'
  ],
  'oceanie': [
    'Australie', 'Nouvelle-Zélande', 'Fidji', 'Papouasie-Nouvelle-Guinée',
    'Polynésie française', 'Nouvelle-Calédonie', 'Autre'
  ],
  'moyen-orient': [
    'Turquie', 'Liban', 'Syrie', 'Jordanie', 'Égypte', 'Arabie Saoudite',
    'Émirats arabes unis', 'Koweït', 'Qatar', 'Bahreïn', 'Oman', 'Yémen',
    'Irak', 'Iran', 'Israël', 'Palestine', 'Autre'
  ]
}

const CONTINENTS = [
  { id: 'afrique', label: 'Afrique' },
  { id: 'asie', label: 'Asie' },
  { id: 'europe', label: 'Europe' },
  { id: 'amerique', label: 'Amérique' },
  { id: 'oceanie', label: 'Océanie' },
  { id: 'moyen-orient', label: 'Moyen-Orient' }
]

export default function RecherchePage() {
  const { user } = useUser()
  const isMobile = useIsMobile()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedCulture, setSelectedCulture] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<ProviderTag[]>([])
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false)
  const [openSubDropdown, setOpenSubDropdown] = useState<'metier' | 'culture' | 'pays' | 'tags' | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [portfolio, setPortfolio] = useState<Array<{ id: string; image_url: string; title?: string }>>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Load available tags on mount
  useEffect(() => {
    async function loadTags() {
      const supabase = createClient()
      const { data } = await supabase
        .from('tags')
        .select('id, label, category')
        .order('usage_count', { ascending: false })
        .limit(50)
      if (data) {
        setAvailableTags(data)
      }
    }
    loadTags()
  }, [])

  useEffect(() => {
    if (user) {
      searchProviders()
    }
  }, [user, searchQuery, selectedCategory, selectedCulture, selectedCountry, selectedTags])

  // Fonction pour calculer le pourcentage de complétion du profil
  const calculateProfileCompletion = async (
    profileId: string,
    profile: any,
    culturesCount: number,
    zonesCount: number,
    portfolioCount: number
  ): Promise<number> => {
    const fields = [
      profile.nom_entreprise ? 1 : 0,
      profile.service_type ? 1 : 0,
      profile.ville_principale ? 1 : 0,
      profile.description_courte ? 1 : 0,
      profile.avatar_url ? 1 : 0,
      profile.budget_min || profile.budget_max ? 1 : 0,
      culturesCount > 0 ? 1 : 0,
      zonesCount > 0 ? 1 : 0,
      portfolioCount > 0 ? 1 : 0,
    ]
    
    const completedFields = fields.reduce((sum, val) => sum + val, 0)
    return (completedFields / fields.length) * 100
  }

  const searchProviders = async () => {
    if (!user) return

    setLoading(true)
    const supabase = createClient()

    try {
      // Vérifier d'abord que l'utilisateur est bien authentifié
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.warn('Pas de session utilisateur')
        setProviders([])
        setLoading(false)
        return
      }

      // Construire la requête de base
      let query = supabase
        .from('profiles')
        .select(`
          id,
          nom_entreprise,
          prenom,
          nom,
          avatar_url,
          ville_principale,
          description_courte,
          budget_min,
          budget_max,
          service_type
        `)
        .eq('role', 'prestataire')

      // Filtrer par catégorie si sélectionnée
      if (selectedCategory) {
        query = query.eq('service_type', selectedCategory)
      }

      // Si recherche, filtrer par mots-clés
      if (searchQuery.trim()) {
        const searchTerm = searchQuery.trim().toLowerCase()
        // Syntaxe correcte pour Supabase: colonne.operateur.valeur,colonne.operateur.valeur
        // Les % doivent être dans la chaîne de la requête
        query = query.or(`nom_entreprise.ilike.%${searchTerm}%,ville_principale.ilike.%${searchTerm}%,service_type.ilike.%${searchTerm}%,description_courte.ilike.%${searchTerm}%`)
      }

      const { data: profilesData, error } = await query.limit(50)

      if (error) {
        // Améliorer le logging pour comprendre l'erreur
        const errorInfo = {
          // Ajouter toutes les propriétés disponibles d'abord
          ...error,
          // Puis ajouter les propriétés spécifiques si elles existent
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        }
        
        console.error('Erreur recherche:', errorInfo)
        
        // Codes d'erreur à ignorer (cas normaux)
        const ignorableErrorCodes = ['42P01', 'PGRST116', 'PGRST301', '42501']
        const ignorableMessages = ['does not exist', 'permission denied', 'no rows returned', 'column', 'permission']
        
        const errorCode = error.code || ''
        const errorMessage = error.message || ''
        const errorString = JSON.stringify(error)
        
        const isIgnorableError = ignorableErrorCodes.includes(errorCode) || 
          ignorableMessages.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase())) ||
          ignorableMessages.some(msg => errorString.toLowerCase().includes(msg.toLowerCase()))
        
        if (isIgnorableError) {
          // Erreur ignorable : probablement colonne manquante, permission RLS ou pas de données
          console.warn('Erreur ignorable (probablement RLS ou colonne manquante):', errorInfo)
          setProviders([])
          setLoading(false)
          return
        }
        
        // Vraie erreur : logger et afficher
        console.error('Erreur détaillée:', errorInfo)
        setProviders([])
        setLoading(false)
        return
      }

      if (!profilesData || profilesData.length === 0) {
        setProviders([])
        setLoading(false)
        return
      }


      // Pour chaque profil, récupérer les cultures, zones, tags et portfolio
      const enrichedProviders = await Promise.all(
        profilesData.map(async (profile) => {
          // Récupérer les cultures
          const { data: culturesData } = await supabase
            .from('provider_cultures')
            .select('culture_id')
            .eq('profile_id', profile.id)

          // Récupérer les zones
          const { data: zonesData } = await supabase
            .from('provider_zones')
            .select('zone_id')
            .eq('profile_id', profile.id)

          // Récupérer les tags
          const { data: tagsData } = await supabase
            .from('provider_tags')
            .select('tag_id, tags(id, label, category)')
            .eq('profile_id', profile.id)

          // Récupérer le portfolio pour compter les photos
          const { data: portfolioData } = await supabase
            .from('provider_portfolio')
            .select('id')
            .eq('profile_id', profile.id)
            .limit(1)

          // Mapper les cultures
          const cultures = (culturesData || [])
            .map(c => {
              const culture = CULTURES.find(cult => cult.id === c.culture_id)
              return culture ? { id: c.culture_id, label: culture.label } : null
            })
            .filter(Boolean) as Array<{ id: string; label: string }>

          // Mapper les zones
          const zones = (zonesData || [])
            .map(z => {
              const zone = DEPARTEMENTS.find(dept => dept.id === z.zone_id)
              return zone ? { id: z.zone_id, label: zone.label } : null
            })
            .filter(Boolean) as Array<{ id: string; label: string }>

          // Mapper les tags
          const tags = (tagsData || [])
            .map(t => {
              const tag = t.tags as { id: string; label: string; category?: string } | null
              return tag ? { id: tag.id, label: tag.label, category: tag.category } : null
            })
            .filter(Boolean) as ProviderTag[]

          // Calculer le pourcentage de complétion
          const completionPercentage = await calculateProfileCompletion(
            profile.id,
            profile,
            cultures.length,
            zones.length,
            portfolioData?.length || 0
          )

          // Vérifier si la recherche correspond aussi aux cultures ou zones
          let matchesSearch = true
          if (searchQuery.trim()) {
            const searchLower = searchQuery.toLowerCase()
            const cultureMatch = cultures.some(c => c.label.toLowerCase().includes(searchLower))
            const zoneMatch = zones.some(z => z.label.toLowerCase().includes(searchLower))
            matchesSearch = cultureMatch || zoneMatch || true // On garde tous les résultats de la requête principale
          }

          return {
            ...profile,
            cultures,
            zones,
            tags,
            completionPercentage,
          } as Provider & { completionPercentage: number }
        })
      )

      // Filtrer par complétion minimale de 30% (réduit pour avoir plus de résultats)
      let filteredProviders = enrichedProviders.filter(p => 
        p.completionPercentage >= 30
      )

      // Filtrer par cultures/zones si recherche
      if (searchQuery.trim()) {
        filteredProviders = filteredProviders.filter(p => {
          const searchLower = searchQuery.toLowerCase()
          return (
            p.nom_entreprise?.toLowerCase().includes(searchLower) ||
            p.ville_principale?.toLowerCase().includes(searchLower) ||
            p.service_type?.toLowerCase().includes(searchLower) ||
            p.description_courte?.toLowerCase().includes(searchLower) ||
            p.cultures.some(c => c.label.toLowerCase().includes(searchLower)) ||
            p.zones.some(z => z.label.toLowerCase().includes(searchLower))
          )
        })
      }

      // Filtrer par culture sélectionnée
      if (selectedCulture) {
        filteredProviders = filteredProviders.filter(p => 
          p.cultures.some(c => c.id === selectedCulture)
        )
      }

      // Filtrer par pays sélectionné (via zones ou ville)
      if (selectedCountry) {
        filteredProviders = filteredProviders.filter(p =>
          p.ville_principale?.toLowerCase().includes(selectedCountry.toLowerCase()) ||
          p.zones.some(z => z.label.toLowerCase().includes(selectedCountry.toLowerCase()))
        )
      }

      // Filtrer par tags sélectionnés (doit avoir TOUS les tags sélectionnés)
      if (selectedTags.length > 0) {
        filteredProviders = filteredProviders.filter(p =>
          selectedTags.every(tagId => p.tags.some(t => t.id === tagId))
        )
      }

      setProviders(filteredProviders)
    } catch (error) {
      console.error('Erreur recherche:', error)
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  const handleProviderClick = async (provider: Provider) => {
    // Réinitialiser le portfolio avant de charger le nouveau
    setPortfolio([])
    setSelectedProvider(provider)
    
    const supabase = createClient()
    try {
      // Charger TOUTES les données du profil complet
      const { data: fullProfileData, error: profileError } = await supabase
        .from('profiles')
        .select('bio, annees_experience, is_early_adopter, instagram_url, facebook_url, website_url, linkedin_url, tiktok_url')
        .eq('id', provider.id)
        .single()
      
      // Charger le portfolio du prestataire
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('provider_portfolio')
        .select('id, image_url, title')
        .eq('profile_id', provider.id)
        .order('display_order', { ascending: true })
      
      if (portfolioError) {
        console.error('Erreur chargement portfolio:', portfolioError)
        setPortfolio([])
      } else {
        setPortfolio(portfolioData || [])
      }
      
      // Mettre à jour le provider avec les données complètes
      if (fullProfileData && !profileError) {
        setSelectedProvider({
          ...provider,
          bio: fullProfileData.bio || null,
          annees_experience: fullProfileData.annees_experience || null,
          is_early_adopter: fullProfileData.is_early_adopter || false,
          instagram_url: fullProfileData.instagram_url || null,
          facebook_url: fullProfileData.facebook_url || null,
          website_url: fullProfileData.website_url || null,
          linkedin_url: fullProfileData.linkedin_url || null,
          tiktok_url: fullProfileData.tiktok_url || null,
        } as Provider)
      }
    } catch (error) {
      console.error('Erreur chargement données complètes:', error)
      setPortfolio([])
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <PageTitle 
          title="Rechercher un prestataire"
          description="Trouvez le prestataire parfait pour votre mariage"
        />

        {/* Barre de recherche avec dropdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative space-y-3"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Dropdown filtres avec sous-menus */}
            <Popover open={showFiltersDropdown} onOpenChange={setShowFiltersDropdown}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-14 px-3 sm:px-4 border-2 border-gray-200 hover:border-[#823F91] focus-visible:border-[#823F91] rounded-xl flex items-center gap-2 w-full sm:w-auto sm:min-w-[180px]"
                >
                  <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {selectedCategory || selectedCulture || selectedCountry 
                      ? 'Filtres actifs'
                      : 'Filtres'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400 ml-auto flex-shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[calc(100vw-2rem)] sm:w-[280px] max-w-[calc(100vw-2rem)] p-2 bg-white z-[9999] shadow-lg border border-gray-200 rounded-xl"
                align="start"
                side="bottom"
                collisionPadding={16}
                avoidCollisions={true}
              >
                <div className="space-y-1">
                  {/* Métier */}
                  <Popover open={openSubDropdown === 'metier'} onOpenChange={(open) => setOpenSubDropdown(open ? 'metier' : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-sm font-medium hover:bg-gray-100 text-gray-900"
                      >
                        <span className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-700" />
                          Métier
                            {selectedCategory && (
                              <Badge variant="secondary" className="ml-2 text-xs bg-gray-200 text-gray-900 font-medium">
                                {SERVICE_CATEGORIES.flatMap(c => c.services).find(s => s.value === selectedCategory)?.label}
                              </Badge>
                            )}
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-700" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-[calc(100vw-2rem)] sm:w-[320px] max-w-[calc(100vw-2rem)] p-2 bg-white max-h-[50vh] overflow-y-auto z-[99999] shadow-xl border border-gray-200 rounded-lg" 
                      side={isMobile ? "bottom" : "right"} 
                      align="start" 
                      sideOffset={8}
                      collisionPadding={16}
                      avoidCollisions={true}
                    >
                        <div className="space-y-1">
                          <button
                            className={`w-full text-left px-3 py-2 text-sm font-medium text-black hover:bg-gray-100 rounded-md transition-none ${selectedCategory === null ? "bg-gray-100" : ""}`}
                            onClick={() => {
                              setSelectedCategory(null)
                              setOpenSubDropdown(null)
                            }}
                          >
                            Tous les métiers
                          </button>
                          <div className="border-t border-gray-200 my-2"></div>
                          {SERVICE_CATEGORIES.map((category) => {
                            const CategoryIcon = category.icon
                            return (
                              <div key={category.id} className="space-y-1">
                                <div className="px-2 py-1.5 text-xs font-semibold text-[#823F91] uppercase flex items-center gap-2">
                                  <CategoryIcon className="h-3.5 w-3.5 text-[#823F91]" />
                                  {category.label}
                                </div>
                                {category.services.map((service) => {
                                  const ServiceIcon = service.icon
                                  return (
                                    <button
                                      key={service.value}
                                      className={`w-full text-left px-6 py-2 text-sm text-black hover:bg-gray-100 rounded-md transition-none ${selectedCategory === service.value ? "bg-gray-200" : ""}`}
                                      onClick={() => {
                                        setSelectedCategory(service.value)
                                        setOpenSubDropdown(null)
                                      }}
                                    >
                                      <span className="flex items-center gap-2">
                                        <ServiceIcon className="h-4 w-4 text-black" />
                                        {service.label}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                    </PopoverContent>
                  </Popover>

                  {/* Culture */}
                  <Popover open={openSubDropdown === 'culture'} onOpenChange={(open) => setOpenSubDropdown(open ? 'culture' : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-sm font-medium hover:bg-gray-100 text-gray-900"
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-gray-700" />
                          Culture
                          {selectedCulture && (
                            <Badge variant="secondary" className="ml-2 text-xs bg-gray-200 text-gray-900 font-medium">
                              {CULTURES.find(c => c.id === selectedCulture)?.label}
                            </Badge>
                          )}
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-700" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-[calc(100vw-2rem)] sm:w-[280px] max-w-[calc(100vw-2rem)] p-2 bg-white max-h-[50vh] overflow-y-auto z-[99999] shadow-xl border border-gray-200 rounded-lg" 
                      side={isMobile ? "bottom" : "right"} 
                      align="start" 
                      sideOffset={8}
                      collisionPadding={16}
                      avoidCollisions={true}
                    >
                      <div className="space-y-1">
                        <button
                          className={`w-full text-left px-3 py-2 text-sm font-medium text-black hover:bg-gray-100 rounded-md transition-none ${selectedCulture === null ? "bg-gray-100" : ""}`}
                          onClick={() => {
                            setSelectedCulture(null)
                            setOpenSubDropdown(null)
                          }}
                        >
                          Toutes les cultures
                        </button>
                        {CULTURES.map((culture) => (
                          <button
                            key={culture.id}
                            className={`w-full text-left px-3 py-2 text-sm text-black hover:bg-gray-100 rounded-md transition-none ${selectedCulture === culture.id ? "bg-gray-200" : ""}`}
                            onClick={() => {
                              setSelectedCulture(culture.id)
                              setOpenSubDropdown(null)
                            }}
                          >
                            {culture.label}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Pays */}
                  <Popover open={openSubDropdown === 'pays'} onOpenChange={(open) => setOpenSubDropdown(open ? 'pays' : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-sm font-medium hover:bg-gray-100 text-gray-900"
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-700" />
                          Pays
                          {selectedCountry && (
                            <Badge variant="secondary" className="ml-2 text-xs bg-gray-200 text-gray-900 font-medium">
                              {selectedCountry}
                            </Badge>
                          )}
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-700" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[calc(100vw-2rem)] sm:w-[280px] max-w-[calc(100vw-2rem)] p-2 bg-white max-h-[50vh] overflow-y-auto z-[99999] shadow-xl border border-gray-200 rounded-lg"
                      side={isMobile ? "bottom" : "right"}
                      align="start"
                      sideOffset={8}
                      collisionPadding={16}
                      avoidCollisions={true}
                    >
                      <div className="space-y-1">
                        <button
                          className={`w-full text-left px-3 py-2 text-sm font-medium text-black hover:bg-gray-100 rounded-md transition-none ${selectedCountry === null ? "bg-gray-100" : ""}`}
                          onClick={() => {
                            setSelectedCountry(null)
                            setOpenSubDropdown(null)
                          }}
                        >
                          Tous les pays
                        </button>
                        {CONTINENTS.map((continent) => (
                          <div key={continent.id} className="space-y-1">
                            <div className="px-2 py-1 text-xs font-semibold text-[#823F91] uppercase">
                              {continent.label}
                            </div>
                            {COUNTRIES_BY_CONTINENT[continent.id]?.map((country) => (
                              <button
                                key={country}
                                className={`w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-100 rounded-md transition-none ${selectedCountry === country ? "bg-gray-200" : ""}`}
                                onClick={() => {
                                  setSelectedCountry(country)
                                  setOpenSubDropdown(null)
                                }}
                              >
                                {country}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Tags */}
                  <Popover open={openSubDropdown === 'tags'} onOpenChange={(open) => setOpenSubDropdown(open ? 'tags' : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-sm font-medium hover:bg-gray-100 text-gray-900"
                      >
                        <span className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-gray-700" />
                          Tags
                          {selectedTags.length > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs bg-gray-200 text-gray-900 font-medium">
                              {selectedTags.length}
                            </Badge>
                          )}
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-700" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[calc(100vw-2rem)] sm:w-[280px] max-w-[calc(100vw-2rem)] p-2 bg-white max-h-[50vh] overflow-y-auto z-[99999] shadow-xl border border-gray-200 rounded-lg"
                      side={isMobile ? "bottom" : "right"}
                      align="start"
                      sideOffset={8}
                      collisionPadding={16}
                      avoidCollisions={true}
                    >
                      <div className="space-y-1">
                        <button
                          className={`w-full text-left px-3 py-2 text-sm font-medium text-black hover:bg-gray-100 rounded-md transition-none ${selectedTags.length === 0 ? "bg-gray-100" : ""}`}
                          onClick={() => {
                            setSelectedTags([])
                            setOpenSubDropdown(null)
                          }}
                        >
                          Tous les tags
                        </button>
                        <div className="border-t border-gray-200 my-2"></div>
                        {availableTags.map((tag) => {
                          const isSelected = selectedTags.includes(tag.id)
                          return (
                            <button
                              key={tag.id}
                              className={`w-full text-left px-3 py-2 text-sm text-black hover:bg-gray-100 rounded-md transition-none flex items-center gap-2 ${isSelected ? "bg-purple-100" : ""}`}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedTags(prev => prev.filter(id => id !== tag.id))
                                } else {
                                  setSelectedTags(prev => [...prev, tag.id])
                                }
                              }}
                            >
                              <span className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-[#823F91] border-[#823F91]' : 'border-gray-300'}`}>
                                {isSelected && <X className="h-3 w-3 text-white" />}
                              </span>
                              {tag.label}
                            </button>
                          )
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </PopoverContent>
            </Popover>

            {/* Barre de recherche */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowFiltersDropdown(false)}
                placeholder="Rechercher par nom, ville, culture..."
                className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-14 text-base sm:text-lg border-2 border-gray-200 focus-visible:border-[#823F91] focus-visible:ring-[#823F91] rounded-xl bg-white"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-gray-600 hover:text-gray-900"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Filtres actifs */}
          {(selectedCategory || selectedCulture || selectedCountry || selectedTags.length > 0 || searchQuery) && (
            <div className="flex flex-wrap gap-2">
              {selectedCategory && (
                <Badge
                  variant="secondary"
                  className="px-3 py-1 text-sm cursor-pointer hover:bg-gray-200 text-gray-900"
                  onClick={() => setSelectedCategory(null)}
                >
                  Métier: {SERVICE_CATEGORIES.flatMap(c => c.services).find(s => s.value === selectedCategory)?.label}
                  <X className="h-3 w-3 ml-2" />
                </Badge>
              )}
              {selectedCulture && (
                <Badge
                  variant="secondary"
                  className="px-3 py-1 text-sm cursor-pointer hover:bg-gray-200 text-gray-900"
                  onClick={() => setSelectedCulture(null)}
                >
                  Culture: {CULTURES.find(c => c.id === selectedCulture)?.label}
                  <X className="h-3 w-3 ml-2" />
                </Badge>
              )}
              {selectedCountry && (
                <Badge
                  variant="secondary"
                  className="px-3 py-1 text-sm cursor-pointer hover:bg-gray-200 text-gray-900"
                  onClick={() => setSelectedCountry(null)}
                >
                  Pays: {selectedCountry}
                  <X className="h-3 w-3 ml-2" />
                </Badge>
              )}
              {selectedTags.map(tagId => {
                const tag = availableTags.find(t => t.id === tagId)
                return tag ? (
                  <Badge
                    key={tagId}
                    variant="secondary"
                    className="px-3 py-1 text-sm cursor-pointer hover:bg-gray-200 text-gray-900 bg-purple-100"
                    onClick={() => setSelectedTags(prev => prev.filter(id => id !== tagId))}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag.label}
                    <X className="h-3 w-3 ml-2" />
                  </Badge>
                ) : null
              })}
              {searchQuery && (
                <Badge
                  variant="secondary"
                  className="px-3 py-1 text-sm cursor-pointer hover:bg-gray-200 text-gray-900"
                  onClick={() => setSearchQuery('')}
                >
                  "{searchQuery}"
                  <X className="h-3 w-3 ml-2" />
                </Badge>
              )}
            </div>
          )}
        </motion.div>

        {/* Résultats */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#823F91]"></div>
            <p className="text-gray-600 mt-4">Recherche en cours...</p>
          </div>
        ) : providers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm"
          >
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {searchQuery
                ? 'Aucun prestataire trouvé pour votre recherche.'
                : 'Commencez votre recherche pour trouver des prestataires.'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{providers.length}</span>{' '}
                prestataire{providers.length > 1 ? 's' : ''} trouvé{providers.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {providers.map((provider, index) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="bg-white rounded-xl border border-gray-200 hover:border-[#823F91]/50 hover:shadow-lg transition-all cursor-pointer overflow-hidden flex flex-col h-full"
                  onClick={() => handleProviderClick(provider)}
                >
                  {/* Avatar et image de fond optionnelle */}
                  <div className="relative h-20 sm:h-24 md:h-32 bg-gradient-to-br from-[#823F91]/10 to-[#9D5FA8]/10 flex items-center justify-center">
                    {provider.avatar_url ? (
                      <img
                        src={provider.avatar_url}
                        alt={provider.nom_entreprise}
                        className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full object-cover border-2 sm:border-3 md:border-4 border-white shadow-md"
                      />
                    ) : (
                      <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center border-2 sm:border-3 md:border-4 border-white shadow-md">
                        <span className="text-lg sm:text-xl md:text-2xl font-semibold text-white">
                          {getInitials(provider.nom_entreprise || provider.prenom || 'P')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col">
                    <div className="mb-2 sm:mb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate mb-1">
                        {provider.nom_entreprise || `${provider.prenom || ''} ${provider.nom || ''}`.trim() || 'Prestataire'}
                      </h3>
                      {provider.service_type && (
                        <p className="text-xs sm:text-sm text-gray-900 font-medium flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-gray-700 flex-shrink-0" />
                          <span className="capitalize truncate">{provider.service_type.replace('_', ' ')}</span>
                        </p>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                      {provider.ville_principale && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                          <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                          <span className="truncate max-w-[80px] sm:max-w-none">{provider.ville_principale}</span>
                        </Badge>
                      )}
                      {provider.cultures.slice(0, 1).map((culture) => (
                        <Badge
                          key={culture.id}
                          variant="outline"
                          className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-purple-50 border-purple-200 text-purple-700"
                        >
                          <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                          <span className="truncate max-w-[70px] sm:max-w-none">{culture.label}</span>
                        </Badge>
                      ))}
                      {provider.cultures.length > 1 && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                          +{provider.cultures.length - 1}
                        </Badge>
                      )}
                    </div>

                    {/* Budget */}
                    {(provider.budget_min || provider.budget_max) && (
                      <div className="mt-auto pt-2 sm:pt-3 border-t border-gray-100">
                        <p className="text-xs sm:text-sm text-gray-600">
                          <span className="font-semibold text-gray-900">
                            {provider.budget_min?.toLocaleString('fr-FR')}€
                            {provider.budget_max && ` - ${provider.budget_max.toLocaleString('fr-FR')}€`}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Dialog pour afficher la carte du prestataire */}
        {selectedProvider && user && (
          <ProfilePreviewDialog
            userId={selectedProvider.id}
            profile={{
              nom_entreprise: selectedProvider.nom_entreprise || '',
              service_type: selectedProvider.service_type || '',
              avatar_url: selectedProvider.avatar_url || undefined,
              prenom: selectedProvider.prenom,
              nom: selectedProvider.nom,
              description_courte: selectedProvider.description_courte || undefined,
              bio: selectedProvider.bio || undefined,
              budget_min: selectedProvider.budget_min || undefined,
              budget_max: selectedProvider.budget_max || undefined,
              ville_principale: selectedProvider.ville_principale || undefined,
              annees_experience: selectedProvider.annees_experience || undefined,
              is_early_adopter: selectedProvider.is_early_adopter || false,
              instagram_url: selectedProvider.instagram_url || null,
              facebook_url: selectedProvider.facebook_url || null,
              website_url: selectedProvider.website_url || null,
              linkedin_url: selectedProvider.linkedin_url || null,
              tiktok_url: selectedProvider.tiktok_url || null,
            }}
            cultures={selectedProvider.cultures}
            zones={selectedProvider.zones}
            portfolio={portfolio}
            open={!!selectedProvider}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedProvider(null)
                setPortfolio([]) // Réinitialiser le portfolio quand on ferme
              }
            }}
            showTriggerButton={false}
            isCoupleView={true}
            coupleId={user.id}
          />
        )}
      </div>
    </div>
  )
}
