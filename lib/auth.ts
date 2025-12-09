import { supabase } from '@/lib/supabase'

export async function signUpCouple(
  email: string,
  password: string,
  prenom?: string,
  nom?: string
) {
  // 1. Signup Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (authError) throw authError
  if (!authData.user) throw new Error('Création utilisateur échouée')

  // 2. Crée le profil
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: email,
      role: 'couple',
      prenom: prenom || null,
      nom: nom || null,
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (profileError) {
    console.error('Erreur profil:', profileError)
    throw profileError
  }

  return authData
}

export async function signUpPrestataire(
  email: string,
  password: string,
  prenom?: string,
  nom?: string
) {
  // 1. Signup Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (authError) throw authError
  if (!authData.user) throw new Error('Création utilisateur échouée')

  // 2. Crée le profil
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: email,
      role: 'prestataire',
      prenom: prenom || null,
      nom: nom || null,
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (profileError) {
    console.error('Erreur profil:', profileError)
    throw profileError
  }

  return authData
}

