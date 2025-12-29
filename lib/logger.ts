/**
 * Production-safe logger
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info('User signed in', { userId: user.id })
 *   logger.error('Failed to create resource', error, { userId: user.id })
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  /**
   * Log informational messages
   * In dev: console.log with emoji
   * In prod: JSON structured log
   */
  info: (message: string, meta?: any) => {
    if (isDev) {
      console.log(`ℹ️ ${message}`, meta || '')
    } else {
      // Production: JSON structured logging (for Sentry/Datadog/CloudWatch)
      console.log(
        JSON.stringify({
          level: 'info',
          message,
          meta,
          timestamp: new Date().toISOString(),
        })
      )
    }
  },

  /**
   * Log errors
   * In dev: console.error with emoji and full error object
   * In prod: JSON structured log with error details
   */
  error: (message: string, error?: any, meta?: any) => {
    if (isDev) {
      console.error(`❌ ${message}`, error, meta || '')
    } else {
      // Production: JSON structured logging
      console.error(
        JSON.stringify({
          level: 'error',
          message,
          error: error?.message || error,
          stack: error?.stack,
          meta,
          timestamp: new Date().toISOString(),
        })
      )
    }
  },

  /**
   * Log warnings
   * In dev: console.warn with emoji
   * In prod: JSON structured log
   */
  warn: (message: string, meta?: any) => {
    if (isDev) {
      console.warn(`⚠️ ${message}`, meta || '')
    } else {
      // Production: JSON structured logging
      console.warn(
        JSON.stringify({
          level: 'warn',
          message,
          meta,
          timestamp: new Date().toISOString(),
        })
      )
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (message: string, meta?: any) => {
    if (isDev) {
      console.debug(`🐛 ${message}`, meta || '')
    }
    // No debug logs in production
  },
}
