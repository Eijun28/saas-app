import {
  Camera, Video, UtensilsCrossed, Music, Flower2, ClipboardList, Building2,
  Scissors, Cake, Tent, UserRound, Music2, PenTool, Pen,
  Sparkles, Shirt, Gem, FileText, Scroll, Car, Sparkle, Crown, Star,
  Drama, Palette, Heart, HandMetal, Lightbulb, Gift
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Liste complète des types de services pour prestataires
// Organisée en catégories avec sous-catégories

export interface ServiceCategory {
  id: string
  label: string
  icon: LucideIcon
  services: Array<{ value: string; label: string; icon: LucideIcon }>
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'photo_video',
    label: 'Photo & Vidéo',
    icon: Camera,
    services: [
      { value: 'photographe', label: 'Photographe', icon: Camera },
      { value: 'videaste', label: 'Vidéaste', icon: Video },
    ],
  },
  {
    id: 'traiteur_patisserie',
    label: 'Traiteur & Pâtisserie',
    icon: UtensilsCrossed,
    services: [
      { value: 'traiteur', label: 'Traiteur', icon: UtensilsCrossed },
      { value: 'patissier', label: 'Pâtissier (Wedding cake)', icon: Cake },
    ],
  },
  {
    id: 'musique_animation',
    label: 'Musique & Animation',
    icon: Music,
    services: [
      { value: 'dj', label: 'DJ / Musicien', icon: Music },
      { value: 'animation', label: 'Animation (photobooth, jeux...)', icon: Sparkles },
    ],
  },
  {
    id: 'beaute_style',
    label: 'Beauté & Style',
    icon: Scissors,
    services: [
      { value: 'coiffure_maquillage', label: 'Coiffeur / Maquilleur', icon: Scissors },
      { value: 'robe_mariee', label: 'Robe de mariée / Costume', icon: Shirt },
      { value: 'bijoutier', label: 'Bijoutier', icon: Gem },
    ],
  },
  {
    id: 'decoration_fleurs',
    label: 'Décoration & Fleurs',
    icon: Flower2,
    services: [
      { value: 'fleuriste', label: 'Décorateur / Fleuriste', icon: Flower2 },
    ],
  },
  {
    id: 'lieux_materiel',
    label: 'Lieux & Matériel',
    icon: Building2,
    services: [
      { value: 'salle', label: 'Salle de réception', icon: Building2 },
      { value: 'location_materiel', label: 'Location de matériel', icon: Tent },
      { value: 'location_vehicules', label: 'Location de véhicules', icon: Car },
    ],
  },
  {
    id: 'maghreb_oriental',
    label: 'Traditions Maghreb & Orient',
    icon: Crown,
    services: [
      // Neggafa & Accompagnement
      { value: 'neggafa', label: 'Neggafa / Nekkacha', icon: Crown },
      { value: 'negafa_algerienne', label: 'Negafa algérienne', icon: Crown },
      { value: 'negafa_marocaine', label: 'Negafa marocaine', icon: Crown },
      { value: 'negafa_tunisienne', label: 'Negafa tunisienne', icon: Crown },

      // Tenues traditionnelles
      { value: 'caftan', label: 'Créateur/Location Caftan', icon: Shirt },
      { value: 'takchita', label: 'Créateur/Location Takchita', icon: Shirt },
      { value: 'karakou', label: 'Créateur/Location Karakou', icon: Shirt },
      { value: 'keswa', label: 'Créateur/Location Keswa', icon: Shirt },
      { value: 'bindalli', label: 'Créateur/Location Bindalli (turc)', icon: Shirt },
      { value: 'jabador', label: 'Créateur/Location Jabador homme', icon: Shirt },
      { value: 'burnous', label: 'Créateur/Location Burnous', icon: Shirt },
      { value: 'location_tenues_traditionnelles', label: 'Location tenues traditionnelles', icon: Shirt },

      // Henné & Soins
      { value: 'henna_artiste', label: 'Artiste Henné', icon: PenTool },
      { value: 'henna_marocain', label: 'Henné marocain (Fassi)', icon: PenTool },
      { value: 'henna_indien', label: 'Mehndi / Henné indien', icon: PenTool },
      { value: 'henna_soudanais', label: 'Henné soudanais', icon: PenTool },
      { value: 'hammam', label: 'Hammam / Spa traditionnel', icon: Sparkles },

      // Musique & Animation orientale
      { value: 'zaffa', label: 'Zaffa / Procession musicale', icon: Music2 },
      { value: 'musicien_traditionnel', label: 'Musicien traditionnel (Oud, Darbouka...)', icon: Music2 },
      { value: 'groupe_chaabi', label: 'Groupe Chaabi', icon: Music2 },
      { value: 'groupe_andalou', label: 'Groupe Andalou', icon: Music2 },
      { value: 'groupe_gnawa', label: 'Groupe Gnawa', icon: Music2 },
      { value: 'danseuse_orientale', label: 'Danseuse orientale / Belly dancer', icon: Star },
      { value: 'troupe_folklorique', label: 'Troupe folklorique', icon: Drama },

      // Décoration orientale
      { value: 'decorateur_maghrebin', label: 'Décorateur mariages maghrébins', icon: Flower2 },
      { value: 'location_amariya', label: 'Location Amariya / Trône', icon: Crown },
      { value: 'calligraphe', label: 'Calligraphe arabe', icon: Pen },

      // Organisation
      { value: 'organisateur_ceremonie', label: 'Organisateur cérémonies traditionnelles', icon: ClipboardList },
    ],
  },
  {
    id: 'afrique_subsaharienne',
    label: 'Traditions Afrique',
    icon: Star,
    services: [
      { value: 'griot', label: 'Griot / Djeli', icon: Music2 },
      { value: 'couturier_africain', label: 'Créateur tenues africaines', icon: Shirt },
      { value: 'styliste_wax', label: 'Styliste Wax / Pagne', icon: Palette },
      { value: 'coiffure_africaine', label: 'Coiffure africaine (tresses, locks...)', icon: Scissors },
      { value: 'danseurs_africains', label: 'Danseurs africains', icon: Drama },
      { value: 'percussionnistes', label: 'Percussionnistes / Djembé', icon: HandMetal },
      { value: 'decorateur_africain', label: 'Décorateur mariages africains', icon: Flower2 },
      { value: 'traiteur_africain', label: 'Traiteur africain', icon: UtensilsCrossed },
    ],
  },
  {
    id: 'asie_inde',
    label: 'Traditions Asie & Inde',
    icon: Sparkles,
    services: [
      // Inde
      { value: 'pandit', label: 'Pandit / Officiant hindou', icon: Scroll },
      { value: 'mehndi_artist', label: 'Artiste Mehndi', icon: PenTool },
      { value: 'sangeet_dj', label: 'DJ Sangeet / Bollywood', icon: Music },
      { value: 'danseurs_bollywood', label: 'Danseurs Bollywood', icon: Drama },
      { value: 'styliste_sari', label: 'Styliste Sari / Lehenga', icon: Shirt },
      { value: 'decorateur_indien', label: 'Décorateur mariages indiens', icon: Flower2 },
      { value: 'traiteur_indien', label: 'Traiteur indien', icon: UtensilsCrossed },

      // Asie de l'Est & Sud-Est
      { value: 'ceremonie_the', label: 'Cérémonie du thé', icon: Gift },
      { value: 'calligraphe_asiatique', label: 'Calligraphe asiatique', icon: Pen },
      { value: 'musicien_asiatique', label: 'Musicien traditionnel asiatique', icon: Music2 },
      { value: 'traiteur_asiatique', label: 'Traiteur asiatique', icon: UtensilsCrossed },
    ],
  },
  {
    id: 'autres_traditions',
    label: 'Autres traditions',
    icon: Heart,
    services: [
      // Antilles & Caraïbes
      { value: 'groupe_zouk', label: 'Groupe Zouk / Kompa', icon: Music2 },
      { value: 'styliste_antillais', label: 'Styliste tenues antillaises', icon: Shirt },
      { value: 'traiteur_antillais', label: 'Traiteur antillais / créole', icon: UtensilsCrossed },

      // Europe de l'Est
      { value: 'musicien_klezmer', label: 'Musicien Klezmer', icon: Music2 },
      { value: 'musicien_slave', label: 'Musicien slave traditionnel', icon: Music2 },

      // Amérique latine
      { value: 'mariachi', label: 'Mariachi', icon: Music2 },
      { value: 'danseurs_latino', label: 'Danseurs latino (salsa, bachata...)', icon: Drama },

      // Général
      { value: 'couturier_traditionnel', label: 'Couturier traditionnel (autre)', icon: Shirt },
      { value: 'musicien_folk', label: 'Musicien folk traditionnel', icon: Music2 },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    icon: ClipboardList,
    services: [
      { value: 'wedding_planner', label: 'Wedding Planner', icon: ClipboardList },
      { value: 'faire_part', label: 'Faire-part / Papeterie', icon: FileText },
      { value: 'officiant', label: 'Officiant de cérémonie', icon: Scroll },
      { value: 'autre', label: 'Autre', icon: Sparkle },
    ],
  },
]

// Liste plate de tous les services (pour compatibilité)
export const SERVICE_TYPES = SERVICE_CATEGORIES.flatMap(category => category.services)

// Liste simple pour les selects (sans icônes) - pour compatibilité
export const SERVICE_TYPES_LIST = SERVICE_TYPES.map(s => s.label)

// Valeurs pour le schéma Zod
export const SERVICE_TYPE_VALUES = SERVICE_TYPES.map(s => s.value) as [string, ...string[]]

// Fonction pour obtenir le label à partir de la value
export const getServiceTypeLabel = (value: string): string => {
  return SERVICE_TYPES.find(s => s.value === value)?.label || value
}

// Fonction pour obtenir l'icône Lucide React à partir de la value
export const getServiceTypeIcon = (value: string): LucideIcon => {
  return SERVICE_TYPES.find(s => s.value === value)?.icon || Sparkle
}

// Fonction pour obtenir la catégorie d'un service
export const getServiceCategory = (value: string): ServiceCategory | undefined => {
  return SERVICE_CATEGORIES.find(category => 
    category.services.some(service => service.value === value)
  )
}
