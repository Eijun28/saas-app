import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getUser() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    // Si erreur de session manquante, c'est normal pour les utilisateurs non connectés
    if (error && !error.message.includes('Auth session missing')) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    }

    return error ? null : user
  } catch (error: any) {
    // Gérer les erreurs de configuration ou autres erreurs
    if (error.message?.includes('Variables d\'environnement')) {
      console.error('Configuration Supabase invalide:', error)
    }
    return null
  }
}

export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    redirect('/connexion')
  }

  return user
}

