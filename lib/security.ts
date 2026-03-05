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
 * Sanitise un input utilisateur avant de l'envoyer à un LLM.
 * - Supprime les tentatives d'injection de prompt connues
 * - Supprime les balises HTML/script
 * - Limite la longueur
 */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /ignore\s+(all\s+)?prior\s+instructions/gi,
  /oublie\s+(toutes?\s+)?(les\s+)?instructions\s+pr[eé]c[eé]dentes/gi,
  /you\s+are\s+now\s+/gi,
  /tu\s+es\s+maintenant\s+/gi,
  /new\s+system\s+prompt/gi,
  /nouveau\s+prompt\s+syst[eè]me/gi,
  /system:\s*/gi,
  /\[SYSTEM\]/gi,
  /\[INST\]/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /```system/gi,
  /act\s+as\s+(if\s+you\s+are\s+)?a\s+/gi,
  /pretend\s+(you\s+are|to\s+be)\s+/gi,
  /fais\s+comme\s+si\s+tu\s+[eé]tais\s+/gi,
  /r[eé]p[eè]te\s+(moi\s+)?(le|ton|ta)\s+(system\s+)?prompt/gi,
  /repeat\s+(your\s+)?(system\s+)?prompt/gi,
  /what\s+(are|is)\s+your\s+(system\s+)?(prompt|instructions)/gi,
  /quelles?\s+sont\s+tes\s+instructions/gi,
  /DAN\s+mode/gi,
  /jailbreak/gi,
];

export function sanitizeAIInput(input: string, maxLength = 2000): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input;

  // Supprimer HTML/script
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Supprimer les tentatives d'injection de prompt
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Limiter la longueur
  sanitized = sanitized.slice(0, maxLength).trim();

  return sanitized;
}

/**
 * Valide et sanitise un tableau de messages chatbot.
 * Retourne les messages nettoyés ou null si invalide.
 */
export function sanitizeChatMessages(
  messages: unknown,
  maxMessages = 50,
  maxMessageLength = 2000
): Array<{ role: 'user' | 'assistant'; content: string }> | null {
  if (!Array.isArray(messages) || messages.length === 0) return null;

  const cleaned = messages
    .slice(-maxMessages) // garder les N derniers messages
    .filter(
      (msg): msg is { role: string; content: string } =>
        msg &&
        typeof msg === 'object' &&
        typeof msg.content === 'string' &&
        msg.content.trim().length > 0
    )
    .map((msg) => ({
      role: (msg.role === 'bot' || msg.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content:
        msg.role === 'bot' || msg.role === 'assistant'
          ? String(msg.content).trim().slice(0, maxMessageLength)
          : sanitizeAIInput(msg.content, maxMessageLength),
    }))
    .filter((msg) => msg.content.length > 0);

  return cleaned.length > 0 ? cleaned : null;
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

