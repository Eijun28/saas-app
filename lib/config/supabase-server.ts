/**
 * Configuration Supabase pour le serveur (server-side)
 * Peut utiliser next/headers car uniquement utilisé côté serveur
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerEnvConfig } from './env'

/**
 * Crée un client Supabase pour le serveur
 * Utilise la configuration validée au démarrage
 */
export async function createServerSupabaseClient() {
  const config = getServerEnvConfig()
  const cookieStore = await cookies()

  return createServerClient(
    config.NEXT_PUBLIC_SUPABASE_URL,
    config.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
