/**
 * Système de gestion d'erreur typé et structuré
 * Remplace les erreurs génériques par des types d'erreur spécifiques
 */

/**
 * Codes d'erreur API standardisés
 */
export enum ApiErrorCode {
  // Erreurs d'authentification (4xx)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Erreurs serveur (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  
  // Erreurs de configuration
  CONFIG_ERROR = 'CONFIG_ERROR',
}

/**
 * Classe d'erreur API typée
 */
export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
    
    // Maintenir la stack trace pour le debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }

  /**
   * Convertit l'erreur en format JSON pour les réponses API
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      }
    }
  }
}

/**
 * Factory functions pour créer des erreurs API typées
 */
export const ApiErrors = {
  unauthorized: (message = 'Non authentifié') =>
    new ApiError(ApiErrorCode.UNAUTHORIZED, message, 401),

  forbidden: (message = 'Accès refusé') =>
    new ApiError(ApiErrorCode.FORBIDDEN, message, 403),

  notFound: (message = 'Ressource non trouvée') =>
    new ApiError(ApiErrorCode.NOT_FOUND, message, 404),

  validation: (message: string, details?: unknown) =>
    new ApiError(ApiErrorCode.VALIDATION_ERROR, message, 400, details),

  rateLimit: (message = 'Trop de requêtes', retryAfter?: number) =>
    new ApiError(
      ApiErrorCode.RATE_LIMIT_EXCEEDED,
      message,
      429,
      retryAfter ? { retryAfter } : undefined
    ),

  internal: (message = 'Erreur serveur interne', details?: unknown) =>
    new ApiError(ApiErrorCode.INTERNAL_ERROR, message, 500, details),

  serviceUnavailable: (message = 'Service temporairement indisponible') =>
    new ApiError(ApiErrorCode.SERVICE_UNAVAILABLE, message, 503),

  timeout: (message = 'La requête a pris trop de temps') =>
    new ApiError(ApiErrorCode.TIMEOUT, message, 504),

  config: (message: string) =>
    new ApiError(ApiErrorCode.CONFIG_ERROR, message, 500),
}

/**
 * Type guard pour vérifier si une erreur est une ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/**
 * Convertit n'importe quelle erreur en ApiError
 */
export function normalizeError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error
  }

  if (error instanceof Error) {
    // En développement, inclure le message d'erreur original
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Une erreur inattendue s\'est produite'

    return new ApiError(
      ApiErrorCode.INTERNAL_ERROR,
      message,
      500,
      process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
    )
  }

  return ApiErrors.internal('Une erreur inattendue s\'est produite')
}
