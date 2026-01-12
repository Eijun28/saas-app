/**
 * Logger conditionnel - Ne log qu'en développement
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  info: (...args: any[]) => {
    if (isDev) console.log('[INFO]', ...args)
  },

  warn: (...args: any[]) => {
    if (isDev) console.warn('[WARN]', ...args)
  },

  error: (message: string, error?: unknown) => {
    if (isDev) {
      console.error('[ERROR]', message, error)
    } else {
      // En production : logger le message et les détails de l'erreur pour debugging
      console.error('[ERROR]', message, error)

      // TODO: Envoyer à un service de monitoring (Sentry, LogRocket, etc.)
      // Exemple : Sentry.captureException(error)
    }
  },

  // Logger critique - toujours actif même en production
  critical: (message: string, details?: any) => {
    console.error('[CRITICAL]', message, details)
    // TODO: Envoyer à un service de monitoring (Sentry, LogRocket, etc.)
  },

  debug: (...args: any[]) => {
    if (isDev) console.debug('[DEBUG]', ...args)
  }
}
