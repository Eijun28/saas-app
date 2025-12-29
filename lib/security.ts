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

/**
 * Types de fichiers autorisés pour les uploads
 */
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const,
  documents: ['application/pdf'] as const,
  all: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'] as const,
} as const;

/**
 * Tailles maximales de fichiers (en bytes)
 */
export const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024, // 5 MB
  pdf: 10 * 1024 * 1024, // 10 MB
  default: 5 * 1024 * 1024, // 5 MB
} as const;

/**
 * Valide un fichier uploadé
 * @param file - Le fichier à valider
 * @param options - Options de validation
 * @returns Résultat de validation avec message d'erreur si invalide
 */
export function validateUploadedFile(
  file: File,
  options: {
    allowedTypes?: readonly string[];
    maxSize?: number;
    allowImages?: boolean;
    allowPdfs?: boolean;
  } = {}
): { valid: boolean; error?: string } {
  // Vérifier que le fichier existe
  if (!file || !file.name || file.name.trim().length === 0) {
    return { valid: false, error: 'Fichier invalide' };
  }

  // Déterminer les types autorisés
  let allowedTypes: readonly string[] = [];
  if (options.allowedTypes) {
    allowedTypes = options.allowedTypes;
  } else {
    if (options.allowImages !== false && options.allowPdfs !== false) {
      allowedTypes = ALLOWED_FILE_TYPES.all;
    } else if (options.allowImages) {
      allowedTypes = ALLOWED_FILE_TYPES.images;
    } else if (options.allowPdfs) {
      allowedTypes = ALLOWED_FILE_TYPES.documents;
    } else {
      allowedTypes = ALLOWED_FILE_TYPES.all;
    }
  }

  // Vérifier le type MIME
  if (!allowedTypes.includes(file.type)) {
    const typesList = allowedTypes
      .map(t => {
        if (t.startsWith('image/')) return 'JPG/PNG/WEBP';
        if (t === 'application/pdf') return 'PDF';
        return t;
      })
      .join(', ');
    return {
      valid: false,
      error: `Type de fichier non autorisé. Formats acceptés: ${typesList}`,
    };
  }

  // Déterminer la taille maximale
  let maxSize = options.maxSize;
  if (!maxSize) {
    if (file.type.startsWith('image/')) {
      maxSize = MAX_FILE_SIZES.image;
    } else if (file.type === 'application/pdf') {
      maxSize = MAX_FILE_SIZES.pdf;
    } else {
      maxSize = MAX_FILE_SIZES.default;
    }
  }

  // Vérifier la taille
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille maximale: ${maxSizeMB}MB`,
    };
  }

  // Vérifier que le nom de fichier ne contient pas de caractères dangereux
  const dangerousChars = /[<>:"|?*\x00-\x1f]/;
  if (dangerousChars.test(file.name)) {
    return {
      valid: false,
      error: 'Le nom de fichier contient des caractères non autorisés',
    };
  }

  return { valid: true };
}

