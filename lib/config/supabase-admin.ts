/**
 * Configuration Supabase admin (service role)
 * Peut être utilisé côté serveur uniquement
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getServerEnvConfig } from './env'

/**
 * Crée un client Supabase admin (service role)
 * Utilise la configuration validée au démarrage
 */
export function createAdminSupabaseClient() {
  const config = getServerEnvConfig()
  return createSupabaseClient(
    config.NEXT_PUBLIC_SUPABASE_URL,
    config.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
