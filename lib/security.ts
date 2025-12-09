/**
 * Fonctions de sécurité pour la validation et la sanitisation
 */

/**
 * Sanitise un message pour prévenir les attaques XSS
 * Échappe les caractères HTML spéciaux
 */
export function sanitizeMessage(message: string): string {
  return message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Valide un sessionId selon le format attendu
 * Format: session_<timestamp>_<random>
 */
export function isValidSessionId(sessionId: string): boolean {
  if (!sessionId || typeof sessionId !== 'string') {
    return false;
  }
  // Format: session_<timestamp>_<alphanumeric>
  return /^session_\d+_[a-z0-9]+$/.test(sessionId);
}

/**
 * Valide un message utilisateur
 * - Doit être une string non vide
 * - Longueur maximale de 1000 caractères
 */
export function isValidMessage(message: unknown): message is string {
  return (
    typeof message === 'string' &&
    message.trim().length > 0 &&
    message.length <= 1000
  );
}

/**
 * Valide une variable d'environnement
 * Lance une erreur si la variable est manquante
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${key}`);
  }
  return value;
}

