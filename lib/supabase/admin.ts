import { createClient } from '@supabase/supabase-js'

import { requireEnv } from '@/lib/security'



const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')

const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')



export function createAdminClient() {

  return createClient(supabaseUrl, supabaseServiceKey, {

    auth: {

      autoRefreshToken: false,

      persistSession: false

    }

  })

}

