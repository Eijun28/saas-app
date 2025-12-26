export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Couple = {
  id: string
  email: string
  prenom: string | null
  nom: string | null
  date_mariage: string | null
  lieu_marriage: string | null
  budget_total: number | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  email: string
  role: 'prestataire'
  prenom: string | null
  nom: string | null
  nom_entreprise: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'couple' | 'prestataire' | null
          prenom: string | null
          nom: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'couple' | 'prestataire' | null
          prenom?: string | null
          nom?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'couple' | 'prestataire' | null
          prenom?: string | null
          nom?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      couple_profiles: {
        Row: {
          user_id: string
          ville_marriage: string | null
          date_marriage: string | null
          budget_min: number | null
          budget_max: number | null
          culture: string | null
          prestataires_recherches: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          ville_marriage?: string | null
          date_marriage?: string | null
          budget_min?: number | null
          budget_max?: number | null
          culture?: string | null
          prestataires_recherches?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          ville_marriage?: string | null
          date_marriage?: string | null
          budget_min?: number | null
          budget_max?: number | null
          culture?: string | null
          prestataires_recherches?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      prestataire_profiles: {
        Row: {
          user_id: string
          nom_entreprise: string | null
          type_prestation: string | null
          ville_exercice: string | null
          tarif_min: number | null
          tarif_max: number | null
          cultures_gerees: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          nom_entreprise?: string | null
          type_prestation?: string | null
          ville_exercice?: string | null
          tarif_min?: number | null
          tarif_max?: number | null
          cultures_gerees?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          nom_entreprise?: string | null
          type_prestation?: string | null
          ville_exercice?: string | null
          tarif_min?: number | null
          tarif_max?: number | null
          cultures_gerees?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

