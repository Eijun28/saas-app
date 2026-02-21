/**
 * Utilitaires pour la gestion de l'authentification et des rôles utilisateur
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'

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
 * 
 * @param userId - L'ID de l'utilisateur à vérifier
 * @returns Le rôle de l'utilisateur et les IDs associés
 */
export async function getUserRoleServer(userId: string): Promise<UserRoleCheckResult> {
  try {
    const supabase = await createClient()

    // Interroger les deux tables en parallèle pour éviter la latence séquentielle
    const [{ data: couple, error: coupleError }, { data: profile, error: profileError }] = await Promise.all([
      supabase.from('couples').select('id').eq('user_id', userId).maybeSingle(),
      supabase.from('profiles').select('id').eq('id', userId).maybeSingle(),
    ])

    if (couple && !coupleError) {
      return {
        role: 'couple',
        coupleId: couple.id,
      }
    }

    if (profile && !profileError) {
      return {
        role: 'prestataire',
        profileId: profile.id,
      }
    }

    // Si ni couple ni prestataire trouvé
    return {
      role: null,
      error: 'Aucun profil trouvé pour cet utilisateur',
    }
  } catch (error: any) {
    return {
      role: null,
      error: error?.message || 'Erreur lors de la vérification du rôle',
    }
  }
}

/**
 * Vérifie le rôle d'un utilisateur (couple ou prestataire)
 * Utilise le client client Supabase (pour les composants côté client)
 * 
 * @param userId - L'ID de l'utilisateur à vérifier
 * @returns Le rôle de l'utilisateur et les IDs associés
 */
export async function getUserRoleClient(userId: string): Promise<UserRoleCheckResult> {
  try {
    const supabase = createClientClient()
    
    // Vérifier d'abord dans la table couples
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (couple && !coupleError) {
      return {
        role: 'couple',
        coupleId: couple.id,
      }
    }

    // Sinon vérifier dans profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (profile && !profileError) {
      return {
        role: 'prestataire',
        profileId: profile.id,
      }
    }

    // Si ni couple ni prestataire trouvé
    return {
      role: null,
      error: 'Aucun profil trouvé pour cet utilisateur',
    }
  } catch (error: any) {
    return {
      role: null,
      error: error?.message || 'Erreur lors de la vérification du rôle',
    }
  }
}

/**
 * Obtient l'URL de redirection appropriée selon le rôle de l'utilisateur
 * 
 * @param role - Le rôle de l'utilisateur
 * @returns L'URL de redirection
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
