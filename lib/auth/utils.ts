/**
 * Utilitaires server-only pour l'authentification et les rôles utilisateur.
 *
 * IMPORTANT: Ce fichier est importé par des server actions et route handlers.
 * Ne PAS importer de client browser ici — cela casserait le bundling serveur.
 */

import { createClient } from '@/lib/supabase/server'

export type UserRole = 'couple' | 'prestataire' | null

export interface UserRoleCheckResult {
  role: UserRole
  coupleId?: string
  profileId?: string
  error?: string
}

/**
 * Vérifie le rôle d'un utilisateur (couple ou prestataire)
 * Utilise le client serveur Supabase
 */
export async function getUserRoleServer(userId: string): Promise<UserRoleCheckResult> {
  try {
    const supabase = await createClient()

    const [{ data: couple, error: coupleError }, { data: profile, error: profileError }] = await Promise.all([
      supabase.from('couples').select('id').eq('user_id', userId).maybeSingle(),
      supabase.from('profiles').select('id').eq('id', userId).maybeSingle(),
    ])

    if (couple && !coupleError) {
      return { role: 'couple', coupleId: couple.id }
    }

    if (profile && !profileError) {
      return { role: 'prestataire', profileId: profile.id }
    }

    return { role: null, error: 'Aucun profil trouvé pour cet utilisateur' }
  } catch (error: unknown) {
    return {
      role: null,
      error: error instanceof Error ? error.message : 'Erreur lors de la vérification du rôle',
    }
  }
}

/**
 * Obtient l'URL de redirection appropriée selon le rôle de l'utilisateur
 */
export function getDashboardUrl(role: UserRole): string {
  switch (role) {
    case 'couple':
      return '/couple/dashboard'
    case 'prestataire':
      return '/prestataire/dashboard'
    default:
      return '/'
  }
}
