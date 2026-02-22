'use client'

/**
 * Gestion d'erreurs côté client — centralise les appels toast.error.
 * Remplace le pattern répété :
 *   catch (error) { toast.error(error.message || 'Erreur générique') }
 *
 * Usage :
 *   import { handleClientError, showSuccess } from '@/lib/errors/client-error'
 *
 *   } catch (error: unknown) {
 *     handleClientError(error)          // toast automatique
 *   }
 *
 *   handleClientError(error, 'Impossible de supprimer le collaborateur')
 */

import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/utils'

/**
 * Affiche un toast d'erreur à partir d'une erreur inconnue.
 * @param error   L'erreur capturée dans un catch block
 * @param fallback Message affiché si l'erreur ne contient pas de message (défaut générique)
 */
export function handleClientError(error: unknown, fallback = 'Une erreur est survenue'): void {
  const message = getErrorMessage(error, fallback)
  toast.error(message)
}

/**
 * Affiche un toast de succès.
 * Centralise les appels toast.success pour cohérence.
 */
export function showSuccess(message: string): void {
  toast.success(message)
}

/**
 * Gère la réponse d'une server action (format { success, error }).
 * Affiche automatiquement le toast approprié.
 *
 * @returns true si succès, false si erreur
 */
export function handleActionResult(
  result: { success?: boolean; error?: string } | null | undefined,
  successMessage: string,
  fallbackError = 'Une erreur est survenue'
): boolean {
  if (!result) {
    toast.error(fallbackError)
    return false
  }
  if (result.error) {
    toast.error(result.error)
    return false
  }
  if (result.success) {
    toast.success(successMessage)
    return true
  }
  toast.error(fallbackError)
  return false
}
