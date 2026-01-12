/**
 * Compatibilité: ancien import utilisé dans certaines routes API.
 * Redirige vers le nouveau système d'erreurs typé.
 */

import { getServerEnvConfig } from './config/env'
import { withErrorHandling, handleApiError } from './errors/error-handler'
import { ApiErrors, ApiError, ApiErrorCode, isApiError, normalizeError } from './errors/api-errors'

// Compat export
export { withErrorHandling, handleApiError }
export { ApiErrors, ApiError, ApiErrorCode, isApiError, normalizeError }

// Compat: ancienne fonction utilisée dans certaines routes
export function validateSupabaseConfig(): { valid: boolean; error?: string } {
  try {
    const cfg = getServerEnvConfig()
    const valid =
      !!cfg.NEXT_PUBLIC_SUPABASE_URL &&
      !!cfg.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !!cfg.SUPABASE_SERVICE_ROLE_KEY &&
      !!cfg.NEXT_PUBLIC_SITE_URL
    return valid ? { valid: true } : { valid: false, error: 'Configuration Supabase incomplète' }
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

