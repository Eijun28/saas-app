export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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

