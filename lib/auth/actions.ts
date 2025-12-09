'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signUp(
  email: string,
  password: string,
  role: 'couple' | 'prestataire',
  profileData: {
    prenom: string
    nom: string
    nomEntreprise?: string
  }
) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      data: {
        role,
        prenom: profileData.prenom,
        nom: profileData.nom,
        nomEntreprise: profileData.nomEntreprise,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // Utiliser le client admin pour bypasser RLS
    // Le trigger handle_new_user() devrait créer automatiquement le profil,
    // mais on fait un upsert avec le client admin pour être sûr
    const adminSupabase = createAdminClient()
    
    // Attendre un peu pour que le trigger s'exécute
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        role,
        prenom: profileData.prenom,
        nom: profileData.nom,
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Erreur lors de la création du profil:', profileError)
      return { error: `Erreur lors de la création du profil: ${profileError.message}` }
    }

    // Si prestataire, créer aussi le profil prestataire
    if (role === 'prestataire' && profileData.nomEntreprise) {
      const { error: prestataireError } = await adminSupabase
        .from('prestataire_profiles')
        .upsert({
          user_id: data.user.id,
          nom_entreprise: profileData.nomEntreprise,
        }, {
          onConflict: 'user_id'
        })

      if (prestataireError) {
        console.error('Erreur lors de la création du profil prestataire:', prestataireError)
        // Ne pas bloquer l'inscription si cette étape échoue, mais logger l'erreur
      }
    }

    revalidatePath('/', 'layout')
    // Rediriger vers la page de confirmation d'email
    redirect('/auth/confirm')
  }

  return { success: true }
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // Récupérer le profil pour connaître le rôle
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile) {
      // Rediriger selon rôle
      const dashboardUrl =
        profile.role === 'couple' ? '/couple/dashboard' : '/prestataire/dashboard'
      revalidatePath('/', 'layout')
      redirect(dashboardUrl)
    } else {
      // Si pas de profil, rediriger vers la page d'accueil
      revalidatePath('/', 'layout')
      redirect('/')
    }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Erreur lors de la déconnexion:', error)
  }
  
  revalidatePath('/', 'layout')
  redirect('/')
}

