/**
 * Logger conditionnel avec intégration Sentry
 */

import * as Sentry from '@sentry/nextjs'

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  info: (...args: unknown[]) => {
    if (isDev) console.log('[INFO]', ...args)
  },

  warn: (...args: unknown[]) => {
    if (isDev) console.warn('[WARN]', ...args)
  },

  error: (message: string, error?: unknown) => {
    if (isDev) {
      console.error('[ERROR]', message, error)
    } else {
      console.error('[ERROR]', message, error)

      // Envoyer à Sentry en production
      if (error instanceof Error) {
        Sentry.captureException(error, { extra: { message } })
      } else {
        Sentry.captureMessage(message, { level: 'error', extra: { error } })
      }
    }
  },

  // Logger critique - toujours actif même en production
  critical: (message: string, details?: Record<string, unknown> | string) => {
    console.error('[CRITICAL]', message, details)

    // Toujours envoyer les critiques à Sentry
    Sentry.captureMessage(message, {
      level: 'fatal',
      extra: typeof details === 'string' ? { details } : details,
    })
  },

  debug: (...args: unknown[]) => {
    if (isDev) console.debug('[DEBUG]', ...args)
  }
}
