/**
 * Configuration des administrateurs autorisés
 * Ajoutez les adresses email des administrateurs ici
 */
export const ADMIN_EMAILS = [
  'contact@nuply.fr',
]

/**
 * Vérifie si un email est autorisé à accéder à l'admin
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
