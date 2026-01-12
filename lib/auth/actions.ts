'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email/resend'

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
        role: role,
        prenom: profileData.prenom,
        nom: profileData.nom,
        nom_entreprise: profileData.nomEntreprise || null,
      }
    },
  })

  // Gérer les erreurs d'envoi d'email (ne pas bloquer l'inscription si l'utilisateur est créé)
  if (error) {
    // Si l'utilisateur est créé mais l'email échoue, on continue quand même
    if (data?.user && error.message?.includes('email') && error.message?.includes('send')) {
      console.warn('Email de confirmation non envoyé mais utilisateur créé:', error.message)
      // On continue le processus même si l'email échoue
    } else {
      return { error: error.message }
    }
  }

  if (data.user) {
    try {
      if (role === 'couple') {
        // Utiliser le client admin pour contourner les politiques RLS
        const adminClient = createAdminClient()
        
        // Insérer dans la table couples (nouvelle structure)
        // Note: currency a une valeur par défaut 'EUR' dans le schéma
        const { error: coupleError } = await adminClient
          .from('couples')
          .insert({
            id: data.user.id,
            user_id: data.user.id,
            email: email,
            partner_1_name: profileData.prenom || null,
            partner_2_name: profileData.nom || null, // Temporairement, on met le nom ici
          })

        if (coupleError) {
          console.error('Erreur création couple:', coupleError)
          // Ne pas bloquer si l'utilisateur existe déjà (peut arriver si le trigger a créé le profil)
          if (!coupleError.message.includes('duplicate key') && !coupleError.message.includes('already exists')) {
            return { error: `Erreur lors de la création du profil: ${coupleError.message}` }
          }
        } else {
          // Créer les préférences vides pour le nouveau couple
          try {
            await adminClient
              .from('couple_preferences')
              .insert({
                couple_id: data.user.id,
                languages: ['français'],
                essential_services: [],
                optional_services: [],
                cultural_preferences: {},
                service_priorities: {},
                budget_breakdown: {},
                profile_completed: false,
                completion_percentage: 0,
                onboarding_step: 0,
              })
          } catch (prefError) {
            // Ne pas bloquer l'inscription si les préférences échouent
            console.warn('Erreur création préférences (non bloquant):', prefError)
          }
        }
      } else {
        // Utiliser le client admin pour contourner les politiques RLS
        const adminClient = createAdminClient()
        
        // Insérer dans la table profiles (prestataires)
        const { error: profileError } = await adminClient
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            role: 'prestataire',
            prenom: profileData.prenom,
            nom: profileData.nom,
            nom_entreprise: profileData.nomEntreprise || null,
          })

        if (profileError) {
          console.error('Erreur création prestataire:', profileError)
          // Ne pas bloquer si l'utilisateur existe déjà
          if (!profileError.message.includes('duplicate key') && !profileError.message.includes('already exists')) {
            return { error: `Erreur lors de la création du profil: ${profileError.message}` }
          }
        }

        // NOUVELLE LOGIQUE : Vérifier les places Early Adopter disponibles
        try {
          const { data: programData } = await adminClient
            .from('early_adopter_program')
            .select('id, total_slots, used_slots, program_active')
            .single()
          
          const isEarlyAdopterSlotAvailable = 
            programData?.program_active && 
            programData.used_slots < programData.total_slots
          
          if (isEarlyAdopterSlotAvailable) {
            // Ce prestataire obtient le badge !
            const trialEndDate = new Date()
            trialEndDate.setDate(trialEndDate.getDate() + 90) // +3 mois
            
            await adminClient
              .from('profiles')
              .update({
                is_early_adopter: true,
                early_adopter_enrolled_at: new Date().toISOString(),
                early_adopter_trial_end_date: trialEndDate.toISOString(),
                subscription_tier: 'early_adopter'
              })
              .eq('id', data.user.id)
            
            // Incrémenter le compteur
            await adminClient
              .from('early_adopter_program')
              .update({ 
                used_slots: programData.used_slots + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', programData.id)
            
            // Créer notification de bienvenue
            await adminClient
              .from('early_adopter_notifications')
              .insert({
                user_id: data.user.id,
                notification_type: 'welcome'
              })
          }
        } catch (earlyAdopterError) {
          // Ne pas bloquer l'inscription si la logique Early Adopter échoue
          console.warn('Erreur lors de l\'attribution du badge Early Adopter (non bloquant):', earlyAdopterError)
        }
      }
    } catch (err: any) {
      console.error('Erreur lors de la création du profil:', err)
      // Si c'est une erreur RLS mais que l'utilisateur est créé, on continue
      if (err.message?.includes('row-level security')) {
        console.warn('Erreur RLS détectée mais utilisateur créé, continuation...')
      } else {
        return { error: `Erreur lors de la création du profil: ${err.message}` }
      }
    }

    // Envoyer l'email de bienvenue avec Resend (non bloquant)
    try {
      console.log('📧 Tentative d\'envoi email de bienvenue Resend pour:', email)
      const emailResult = await sendWelcomeEmail(
        email,
        role,
        profileData.prenom,
        profileData.nom
      )
      if (emailResult.success) {
        console.log('✅ Email de bienvenue Resend envoyé avec succès')
      } else {
        console.warn('⚠️ Email de bienvenue Resend non envoyé:', emailResult.error)
      }
    } catch (emailError) {
      // Ne pas bloquer l'inscription si l'email échoue
      console.error('❌ Erreur lors de l\'envoi email de bienvenue (non bloquant):', emailError)
    }

    revalidatePath('/', 'layout')
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
    // Vérifier d'abord dans la table couples
    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .eq('user_id', data.user.id)
      .single()

    if (couple) {
      revalidatePath('/', 'layout')
      return { success: true, redirectTo: '/couple/dashboard' }
    }

    // Sinon vérifier dans profiles (prestataires uniquement)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .eq('role', 'prestataire')
      .single()

    revalidatePath('/', 'layout')

    if (profile && profile.role === 'prestataire') {
      return { success: true, redirectTo: '/prestataire/dashboard' }
    }

    return { success: true, redirectTo: '/' }
  }

  return { success: true, redirectTo: '/' }
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
