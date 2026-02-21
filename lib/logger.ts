/**
 * Logger conditionnel - Ne log qu'en développement
 * En production, les erreurs et alertes critiques sont envoyées à Sentry.
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
    console.error('[ERROR]', message, error)
    if (!isDev) {
      try {
        if (error instanceof Error) {
          Sentry.captureException(error, { extra: { message } })
        } else {
          Sentry.captureMessage(message, { level: 'error', extra: { details: error } })
        }
      } catch {
        // Ne pas bloquer si Sentry échoue
      }
    }
  },

  // Logger critique - toujours actif même en production
  critical: (message: string, details?: unknown) => {
    console.error('[CRITICAL]', message, details)
    try {
      Sentry.captureMessage(message, { level: 'fatal', extra: { details } })
    } catch {
      // Ne pas bloquer si Sentry échoue
    }
  },

  debug: (...args: unknown[]) => {
    if (isDev) console.debug('[DEBUG]', ...args)
  },
}
