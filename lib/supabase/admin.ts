import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase Admin avec service_role key
 * ⚠️ NE JAMAIS EXPOSER CE CLIENT AU CLIENT-SIDE
 * Utilisé uniquement dans les API routes/server actions pour bypasser RLS
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
