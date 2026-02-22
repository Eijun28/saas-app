/**
 * Utilitaires centralisés pour le formatage des dates.
 * Remplace les appels éparpillés à toLocaleDateString('fr-FR') et date-fns.
 */

const FR_LOCALE = 'fr-FR'

/**
 * Formate une date en format court français : "15/03/2025"
 */
export function formatDateFr(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString(FR_LOCALE)
}

/**
 * Formate une date en format long français : "15 mars 2025"
 */
export function formatDateLongFr(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString(FR_LOCALE, { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Formate une date avec l'heure : "15/03/2025 à 14:30"
 */
export function formatDateTimeFr(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  return `${d.toLocaleDateString(FR_LOCALE)} à ${d.toLocaleTimeString(FR_LOCALE, { hour: '2-digit', minute: '2-digit' })}`
}

/**
 * Retourne l'instant actuel en ISO string (UTC).
 * Remplace les `new Date().toISOString()` éparpillés.
 */
export function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Vérifie si une date (string ou Date) est dans le passé.
 */
export function isPast(date: Date | string | null | undefined): boolean {
  if (!date) return false
  const d = date instanceof Date ? date : new Date(date)
  return d < new Date()
}

/**
 * Retourne le nombre de jours restants entre aujourd'hui et une date future.
 * Retourne 0 si la date est dans le passé.
 */
export function daysUntil(date: Date | string | null | undefined): number {
  if (!date) return 0
  const d = date instanceof Date ? date : new Date(date)
  const diff = d.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
