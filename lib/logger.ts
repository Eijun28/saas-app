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
      // En production : logger uniquement le message, pas l'objet complet
      console.error('[ERROR]', message)

      // TODO: Envoyer à un service de monitoring (Sentry, LogRocket, etc.)
      // Exemple : Sentry.captureException(error)
    }
  },

  debug: (...args: any[]) => {
    if (isDev) console.debug('[DEBUG]', ...args)
  }
}
