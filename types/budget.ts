// Types pour le budget
export type BudgetCategory = {
  id: string
  user_id: string
  category_name: string
  category_icon?: string
  order_index?: number
  budget_prevu: number
  budget_depense: number
  statut: 'non_defini' | 'en_cours' | 'valide'
  created_at: string
  updated_at: string
}

export type BudgetProvider = {
  id: string
  user_id: string
  provider_name: string
  category: string
  devis: number
  statut: 'contacte' | 'devis_recu' | 'valide' | 'paye'
  notes: string | null
  created_at: string
  updated_at: string
}

export type CoupleBudget = {
  id: string
  user_id: string
  budget_min: number
  budget_max: number
  created_at: string
  updated_at: string
}

export type BudgetData = {
  budget: CoupleBudget | null
  categories: BudgetCategory[]
  providers: BudgetProvider[]
  totalDepense: number
  budgetRestant: number
  pourcentageUtilise: number
}

// Catégories prédéfinies avec icônes
export const DEFAULT_CATEGORIES = [
  { name: 'Lieu de réception', icon: '🏛️' },
  { name: 'Traiteur', icon: '🍽️' },
  { name: 'Photographe/Vidéaste', icon: '📸' },
  { name: 'Fleurs & Décoration', icon: '💐' },
  { name: 'Tenue (robe, costume)', icon: '👗' },
  { name: 'DJ/Musicien', icon: '🎵' },
  { name: 'Alliances', icon: '💍' },
  { name: 'Faire-part', icon: '✉️' },
  { name: 'Cadeau invités', icon: '🎁' },
  { name: 'Coiffure/Maquillage', icon: '💄' },
  { name: 'Transport', icon: '🚗' },
  { name: 'Hébergement', icon: '🏨' },
  { name: 'Autre', icon: '📦' },
]

// Liste simple pour compatibilité
export const PREDEFINED_CATEGORIES = DEFAULT_CATEGORIES.map(c => c.name)

