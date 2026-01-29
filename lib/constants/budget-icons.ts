/**
 * Mapping des icônes de catégories de budget
 * Utilise exclusivement Lucide React selon les règles UI strictes
 */

import {
  Building2,
  UtensilsCrossed,
  Camera,
  Flower2,
  Shirt,
  Music,
  Gem,
  Mail,
  Gift,
  Scissors,
  Car,
  Hotel,
  Package,
  type LucideIcon,
} from 'lucide-react'

/**
 * Mapping des noms de catégories vers les icônes Lucide React
 */
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  'Lieu de réception': Building2,
  'Traiteur': UtensilsCrossed,
  'Photographe/Vidéaste': Camera,
  'Fleurs & Décoration': Flower2,
  'Tenue (robe, costume)': Shirt,
  'DJ/Musicien': Music,
  'Alliances': Gem,
  'Faire-part': Mail,
  'Cadeau invités': Gift,
  'Coiffure/Maquillage': Scissors,
  'Transport': Car,
  'Hébergement': Hotel,
  'Autre': Package,
}

/**
 * Mapping des emojis vers les icônes Lucide (pour migration/rétrocompatibilité)
 */
export const EMOJI_TO_ICON_MAP: Record<string, LucideIcon> = {
  '🏛️': Building2,
  '🍽️': UtensilsCrossed,
  '📸': Camera,
  '💐': Flower2,
  '👗': Shirt,
  '🎵': Music,
  '💍': Gem,
  '✉️': Mail,
  '🎁': Gift,
  '💄': Scissors,
  '🚗': Car,
  '🏨': Hotel,
  '📦': Package,
}

/**
 * Liste des icônes disponibles pour sélection
 */
export const AVAILABLE_ICONS: Array<{ name: string; icon: LucideIcon; label: string }> = [
  { name: 'Building2', icon: Building2, label: 'Bâtiment' },
  { name: 'UtensilsCrossed', icon: UtensilsCrossed, label: 'Traiteur' },
  { name: 'Camera', icon: Camera, label: 'Photo/Vidéo' },
  { name: 'Flower2', icon: Flower2, label: 'Fleurs' },
  { name: 'Shirt', icon: Shirt, label: 'Tenue' },
  { name: 'Music', icon: Music, label: 'Musique' },
  { name: 'Gem', icon: Gem, label: 'Bijoux' },
  { name: 'Mail', icon: Mail, label: 'Courrier' },
  { name: 'Gift', icon: Gift, label: 'Cadeau' },
  { name: 'Scissors', icon: Scissors, label: 'Coiffure' },
  { name: 'Car', icon: Car, label: 'Transport' },
  { name: 'Hotel', icon: Hotel, label: 'Hébergement' },
  { name: 'Package', icon: Package, label: 'Autre' },
]

/**
 * Obtient l'icône Lucide pour une catégorie
 * Gère la rétrocompatibilité avec les emojis existants
 */
export function getCategoryIcon(
  categoryName?: string,
  categoryIcon?: string
): LucideIcon {
  // D'abord, essayer de trouver par nom de catégorie
  if (categoryName && CATEGORY_ICON_MAP[categoryName]) {
    return CATEGORY_ICON_MAP[categoryName]
  }

  // Ensuite, essayer de mapper depuis l'emoji si présent
  if (categoryIcon && EMOJI_TO_ICON_MAP[categoryIcon]) {
    return EMOJI_TO_ICON_MAP[categoryIcon]
  }

  // Par défaut, utiliser Package
  return Package
}

/**
 * Obtient le nom de l'icône Lucide pour stockage
 */
export function getIconName(icon: LucideIcon): string {
  const entry = AVAILABLE_ICONS.find((item) => item.icon === icon)
  return entry?.name || 'Package'
}
