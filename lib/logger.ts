/**
 * Logger conditionnel - Ne log qu'en développement
 * En production, les erreurs et critiques sont envoyés à Sentry
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
      if (error instanceof Error) {
        Sentry.captureException(error, { extra: { message } })
      } else {
        Sentry.captureMessage(message, { level: 'error', extra: { error } })
      }
    }
  },

  critical: (message: string, details?: Record<string, unknown>) => {
    console.error('[CRITICAL]', message, details)
    Sentry.captureMessage(message, { level: 'fatal', extra: details })
  },

  debug: (...args: unknown[]) => {
    if (isDev) console.debug('[DEBUG]', ...args)
  }
}
