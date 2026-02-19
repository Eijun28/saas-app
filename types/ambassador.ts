// Types pour le programme ambassadeur

export type AmbassadorEarningType = 'signup' | 'conversion' | 'milestone'
export type AmbassadorEarningStatus = 'pending' | 'validated' | 'paid'
export type AmbassadorPayoutStatus = 'pending' | 'processing' | 'done'

export interface AmbassadorEarning {
  id: string
  ambassador_id: string
  referral_usage_id: string | null
  amount: number
  type: AmbassadorEarningType
  status: AmbassadorEarningStatus
  created_at: string
  validated_at: string | null
  paid_at: string | null
}

export interface AmbassadorPayout {
  id: string
  ambassador_id: string
  amount: number
  period_start: string
  period_end: string
  status: AmbassadorPayoutStatus
  note: string | null
  created_at: string
  processed_at: string | null
}

// Vue enrichie pour la liste admin
export interface AmbassadorWithStats {
  provider_id: string
  referral_code: string
  is_ambassador: boolean
  ambassador_active: boolean
  ambassador_since: string | null
  activated_by: string | null
  total_referrals: number
  // Nom du prestataire (jointure profiles)
  prenom: string | null
  nom: string | null
  nom_entreprise: string | null
  email: string
  // Stats calculées
  total_converted: number
  total_earnings: number
  pending_earnings: number
  paid_earnings: number
}

// Vue pour la section paramètres prestataire
export interface AmbassadorDashboard {
  referral_code: string
  is_ambassador: boolean
  ambassador_active: boolean
  ambassador_since: string | null
  total_referrals: number
  total_converted: number
  earnings: {
    total: number
    pending: number
    validated: number
    paid: number
  }
  recent_earnings: AmbassadorEarning[]
}
