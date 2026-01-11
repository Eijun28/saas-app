import { 
  Camera, Video, UtensilsCrossed, Music, Flower2, ClipboardList, Building2, 
  Scissors, Cake, Tent, UserRound, Music2, PenTool, Pen, Violin, 
  Sparkles, Shirt, Gem, FileText, Scroll, Car, Sparkle
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
    id: 'maghreb',
    label: 'Métiers traditionnels du Maghreb',
    icon: Sparkles,
    services: [
      { value: 'neggafa', label: 'Neggafa (Nekkacha)', icon: UserRound },
      { value: 'zaffa', label: 'Zaffa (Procession musicale)', icon: Music2 },
      { value: 'henna_artiste', label: 'Artiste Henna', icon: PenTool },
      { value: 'calligraphe', label: 'Calligraphe', icon: Pen },
      { value: 'musicien_traditionnel', label: 'Musicien traditionnel (Oud, Darbouka...)', icon: Violin },
      { value: 'danseuse_orientale', label: 'Danseuse orientale / Belly dancer', icon: Sparkles },
      { value: 'couturier_traditionnel', label: 'Couturier traditionnel', icon: Shirt },
      { value: 'decorateur_maghrebin', label: 'Décorateur spécialisé mariages maghrébins', icon: Flower2 },
      { value: 'organisateur_ceremonie', label: 'Organisateur de cérémonies traditionnelles', icon: ClipboardList },
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
