import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extrait toutes les propriétés d'une erreur Supabase pour un meilleur débogage
 * Les erreurs Supabase peuvent avoir des propriétés non-énumérables qui ne sont pas visibles dans console.error
 */
export function extractSupabaseError(error: unknown): {
  message: string
  code?: string
  details?: string
  hint?: string
  statusCode?: number
  [key: string]: unknown
} {
  if (!error) {
    return { message: 'Erreur inconnue' }
  }

  // Si c'est une Error standard
  if (error instanceof Error) {
    const errorObj: Record<string, unknown> = {
      message: error.message,
      name: error.name,
      stack: error.stack,
    }

    // Extraire toutes les propriétés propres (y compris non-énumérables)
    const allProps = Object.getOwnPropertyNames(error)
    allProps.forEach((prop) => {
      try {
        const value = (error as unknown as Record<string, unknown>)[prop]
        // Éviter les références circulaires
        if (typeof value !== 'object' || value === null) {
          errorObj[prop] = value
        } else {
          errorObj[prop] = String(value)
        }
      } catch {
        // Ignorer les propriétés qui ne peuvent pas être lues
      }
    })

    // Extraire les propriétés spécifiques à Supabase si elles existent
    const supabaseError = error as unknown as Record<string, unknown>
    if (supabaseError.code) errorObj.code = supabaseError.code
    if (supabaseError.details) errorObj.details = supabaseError.details
    if (supabaseError.hint) errorObj.hint = supabaseError.hint
    if (supabaseError.statusCode) errorObj.statusCode = supabaseError.statusCode

    return errorObj as {
      message: string
      code?: string
      details?: string
      hint?: string
      statusCode?: number
      [key: string]: unknown
    }
  }

  // Si c'est un objet simple
  if (typeof error === 'object') {
    const errorObj: Record<string, unknown> = {}
    const allProps = Object.getOwnPropertyNames(error)
    allProps.forEach((prop) => {
      try {
        const value = (error as Record<string, unknown>)[prop]
        if (typeof value !== 'object' || value === null) {
          errorObj[prop] = value
        } else {
          errorObj[prop] = String(value)
        }
      } catch {
        // Ignorer les propriétés qui ne peuvent pas être lues
      }
    })

    return {
      message: (errorObj.message as string) || (errorObj.error as string) || 'Erreur inconnue',
      ...errorObj,
    } as {
      message: string
      code?: string
      details?: string
      hint?: string
      statusCode?: number
      [key: string]: unknown
    }
  }

  // Si c'est une chaîne ou autre primitive
  return {
    message: String(error),
  }
}