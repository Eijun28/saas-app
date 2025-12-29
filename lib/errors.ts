/**
 * Erreurs standardisées pour les API
 */

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public userMessage: string,
    public internalMessage?: string,
    public context?: Record<string, any>
  ) {
    super(internalMessage || userMessage)
  }
}

// Erreurs prédéfinies
export const ERRORS = {
  UNAUTHORIZED: new ApiError(401, 'Non authentifié', 'User not authenticated'),
  FORBIDDEN: new ApiError(403, 'Accès refusé', 'Insufficient permissions'),
  NOT_FOUND: new ApiError(404, 'Ressource non trouvée', 'Resource not found'),
  VALIDATION: new ApiError(400, 'Données invalides', 'Validation failed'),
  RATE_LIMIT: new ApiError(429, 'Trop de requêtes', 'Rate limit exceeded'),
  INTERNAL: new ApiError(500, 'Erreur serveur', 'Internal server error'),
  SERVICE_UNAVAILABLE: new ApiError(503, 'Service indisponible', 'Service unavailable'),
}

// Helper pour retourner erreur au client
export function errorResponse(error: ApiError | Error, logger?: any) {
  if (error instanceof ApiError) {
    // Log interne
    if (logger) {
      logger.error(error.internalMessage || error.userMessage, error, error.context)
    }
    
    // Retour client (message générique)
    return {
      error: error.userMessage,
      statusCode: error.statusCode
    }
  }
  
  // Erreur inconnue
  if (logger) {
    logger.error('Erreur inattendue', error)
  }
  
  return {
    error: 'Une erreur inattendue est survenue',
    statusCode: 500
  }
}

