import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables d\'environnement Supabase manquantes. Vérifiez votre configuration dans .env.local')
}

// Fonction createClient - crée une nouvelle instance à chaque appel (requis pour SSR)
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export type SupabaseClient = ReturnType<typeof createClient>
