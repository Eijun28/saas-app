/**
 * Gestionnaire d'erreur centralisé pour les routes API
 * Utilise le système d'erreur typé
 */

import { NextResponse } from 'next/server'
import { ApiError, normalizeError, isApiError } from './api-errors'
import { logger } from '../logger'

/**
 * Gère une erreur et retourne une réponse Next.js appropriée
 */
export function handleApiError(error: unknown): NextResponse {
  const apiError = normalizeError(error)

  // Logger l'erreur
  if (apiError.statusCode >= 500) {
    // Erreurs serveur - toujours logger
    logger.error(`[API Error ${apiError.code}]`, {
      message: apiError.message,
      statusCode: apiError.statusCode,
      details: apiError.details,
    })
  } else {
    // Erreurs client - logger seulement en développement
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`[API Error ${apiError.code}]`, {
        message: apiError.message,
        statusCode: apiError.statusCode,
      })
    }
  }

  // Retourner la réponse JSON
  return NextResponse.json(
    apiError.toJSON(),
    {
      status: apiError.statusCode,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        // Ajouter Retry-After pour les erreurs de rate limit
        ...(apiError.code === 'RATE_LIMIT_EXCEEDED' && apiError.details && typeof apiError.details === 'object' && 'retryAfter' in apiError.details
          ? { 'Retry-After': String(apiError.details.retryAfter) }
          : {}),
      },
    }
  )
}

/**
 * Wrapper pour les handlers de route API
 * Capture automatiquement toutes les erreurs
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
