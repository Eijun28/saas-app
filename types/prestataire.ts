// Types de base
export interface Prestataire {
  id: string
  nom_entreprise: string
  categorie: string
  avatar_url?: string
  description?: string
  created_at: string
}

export interface Demande {
  id: string
  couple_id: string
  provider_id: string
  service_type: string
  message?: string
  wedding_date: string
  guest_count: number | null
  budget_indicatif: number | null
  status: 'pending' | 'viewed' | 'responded' | 'accepted' | 'rejected'
  viewed_at: string | null
  responded_at: string | null
  created_at: string
  updated_at: string
  // Données enrichies (JOIN)
  couple_name?: string
  couple_email?: string
}

export interface Service {
  id: string
  prestataire_id: string
  nom: string
  description: string
  prix: number
  duree?: string
  inclus?: string[]
}

export interface Evenement {
  id: string
  titre: string
  date: string
  heure_debut: string
  heure_fin?: string
  lieu?: string
  couple_nom?: string
  statut: 'confirme' | 'en_attente' | 'annule'
  notes?: string
}

export interface Conversation {
  id: string
  couple_id: string
  couple_nom: string
  dernier_message: string
  dernier_message_at: string
  non_lu: boolean
  avatar_url?: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'prestataire' | 'couple'
  contenu: string
  created_at: string
  lu: boolean
}

export interface Stats {
  nouvelles_demandes: number
  evenements_a_venir: number
  messages_non_lus: number
  taux_reponse: number
  demandes_ce_mois: number
}

// Types pour les états UI
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface UIState {
  loading: LoadingState
  error: string | null
}

export interface ProviderCulture {
  id: string;
  profile_id: string;
  culture_id: string;
  created_at: string;
}

export interface ProviderZone {
  id: string;
  profile_id: string;
  zone_id: string;
  created_at: string;
}

export interface ProviderPortfolioImage {
  id: string;
  profile_id: string;
  image_url: string;
  image_path: string;
  title?: string;
  display_order: number;
  created_at: string;
}

