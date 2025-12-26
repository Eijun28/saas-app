import { createBrowserClient } from '@supabase/ssr'

// Instance singleton pour les queries
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables d\'environnement Supabase manquantes. Vérifiez votre configuration dans .env.local')
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
export type SupabaseClient = typeof supabase

// Fonction createClient pour la compatibilité avec le code existant
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
