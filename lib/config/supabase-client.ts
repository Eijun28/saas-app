/**
 * Configuration Supabase pour le navigateur (client-side)
 * Ne contient pas d'imports serveur (next/headers)
 */

import { createBrowserClient } from '@supabase/ssr'
import { getPublicEnvConfig } from './env'

/**
 * Crée un client Supabase pour le navigateur
 * Utilise la configuration validée au démarrage
 */
export function createBrowserSupabaseClient() {
  const config = getPublicEnvConfig()
  return createBrowserClient(
    config.NEXT_PUBLIC_SUPABASE_URL,
    config.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
