'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email/resend'
import { logger } from '@/lib/logger'

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
  // ✅ VALIDATION 1: Vérifier format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Email invalide' }
  }

  // ✅ VALIDATION 2: Vérifier userType autorisé
  const ALLOWED_USER_TYPES = ['couple', 'prestataire']
  if (!ALLOWED_USER_TYPES.includes(role)) {
    return { error: 'Type utilisateur non autorisé' }
  }

  // ✅ VALIDATION 3: Pour couples, vérifier noms requis
  if (role === 'couple') {
    if (!profileData.prenom?.trim() || !profileData.nom?.trim()) {
      return { error: 'Les noms des partenaires sont requis' }
    }

    // Sanitize les noms (protection XSS)
    profileData.prenom = profileData.prenom.trim().substring(0, 100)
    profileData.nom = profileData.nom.trim().substring(0, 100)
  }

  // ✅ VALIDATION 4: Pour prestataires, vérifier nom entreprise si fourni
  if (role === 'prestataire' && profileData.nomEntreprise) {
    profileData.nomEntreprise = profileData.nomEntreprise.trim().substring(0, 200)
  }

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
      logger.warn('Email de confirmation non envoyé mais utilisateur créé:', error.message)
      // On continue le processus même si l'email échoue
    } else {
      return { error: error.message }
    }
  }

  // Vérifier que l'utilisateur a été créé
  if (!data?.user) {
    logger.error('Aucun utilisateur créé après signUp')
    return { error: 'Échec de la création du compte. Veuillez réessayer.' }
  }

  // Créer le profil utilisateur selon le rôle
  try {
      if (role === 'couple') {
        // Créer le client admin pour contourner les politiques RLS
        let adminClient
        try {
          adminClient = createAdminClient()
        } catch (adminError: any) {
          logger.error('Erreur création client admin:', adminError)
          // Essayer de supprimer l'utilisateur créé
          try {
            const tempAdmin = createAdminClient()
            await tempAdmin.auth.admin.deleteUser(data.user.id)
          } catch {}
          return { error: 'Erreur de configuration serveur. Veuillez contacter le support.' }
        }
        
        const userId = data.user.id

        // Vérifier que l'utilisateur existe bien dans auth.users avant d'insérer
        // (nécessaire pour la contrainte couples_user_id_fkey qui référence auth.users(id))
        let userExists = false
        let retries = 0
        const maxRetries = 5
        
        while (!userExists && retries < maxRetries) {
          try {
            const { data: userData, error: userCheckError } = await adminClient.auth.admin.getUserById(userId)
            if (userData && userData.user && !userCheckError) {
              userExists = true
            } else {
              retries++
              await new Promise(resolve => setTimeout(resolve, 100))
            }
          } catch (err) {
            retries++
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }

        if (!userExists) {
          logger.error('Utilisateur non trouvé dans auth.users après plusieurs tentatives')
          await adminClient.auth.admin.deleteUser(userId).catch(() => {})
          return { error: 'Erreur lors de la création du compte. Veuillez réessayer.' }
        }

        // Créer directement dans couples (pas de profil dans profiles pour les couples)
        const { error: coupleError } = await adminClient
          .from('couples')
          .insert({
            id: userId,
            user_id: userId, // ✅ Utiliser user_id - référence auth.users(id)
            email: email,
            partner_1_name: profileData.prenom || null,
            partner_2_name: profileData.nom || null,
          })

        // ✅ NE PAS ignorer les erreurs silencieusement
        if (coupleError) {
          // Rollback : supprimer l'utilisateur si couple échoue
          await adminClient.auth.admin.deleteUser(userId).catch(() => {})
          return { error: `Erreur création couple: ${coupleError.message}` }
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
            logger.warn('Erreur création préférences (non bloquant):', prefError)
          }
        }
      } else {
        // Créer le client admin
        let adminClient
        try {
          adminClient = createAdminClient()
        } catch (adminError: any) {
          logger.error('Erreur création client admin:', adminError)
          // Essayer de supprimer l'utilisateur créé
          try {
            const tempAdmin = createAdminClient()
            await tempAdmin.auth.admin.deleteUser(data.user.id)
          } catch {}
          return { error: 'Erreur de configuration serveur. Veuillez contacter le support.' }
        }
        
        const userId = data.user.id

        // Insérer dans la table profiles (prestataires)
        const { error: profileError } = await adminClient
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            role: 'prestataire',
            prenom: profileData.prenom.trim().substring(0, 100),
            nom: profileData.nom.trim().substring(0, 100),
            nom_entreprise: profileData.nomEntreprise ? profileData.nomEntreprise.trim().substring(0, 200) : null,
          })

        if (profileError) {
          // Rollback : supprimer l'utilisateur si profil échoue
          await adminClient.auth.admin.deleteUser(userId).catch(() => {})
          return { error: `Erreur création profil: ${profileError.message}` }
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
          logger.warn('Erreur lors de l\'attribution du badge Early Adopter (non bloquant):', earlyAdopterError)
        }
      }
    } catch (err: any) {
      logger.error('Erreur lors de la création du profil', err)
      // Si c'est une erreur RLS mais que l'utilisateur est créé, on continue
      if (err.message?.includes('row-level security')) {
        logger.warn('Erreur RLS détectée mais utilisateur créé, continuation...')
      } else {
        // Essayer de supprimer l'utilisateur créé en cas d'erreur
        try {
          const adminClient = createAdminClient()
          await adminClient.auth.admin.deleteUser(data.user.id)
        } catch {}
        return { error: `Erreur lors de la création du profil: ${err.message || 'Erreur inconnue'}` }
      }
    }

    // Envoyer l'email de bienvenue avec Resend (non bloquant)
    try {
      logger.info('📧 Tentative d\'envoi email de bienvenue Resend pour:', email)
      const emailResult = await sendWelcomeEmail(
        email,
        role,
        profileData.prenom,
        profileData.nom
      )
      if (emailResult.success) {
        logger.info('✅ Email de bienvenue Resend envoyé avec succès')
      } else {
        logger.warn('⚠️ Email de bienvenue Resend non envoyé:', emailResult.error)
      }
    } catch (emailError) {
      // Ne pas bloquer l'inscription si l'email échoue
      logger.error('❌ Erreur lors de l\'envoi email de bienvenue (non bloquant)', emailError)
    }

    // Succès - retourner avec redirection
    revalidatePath('/', 'layout')
    return { success: true, redirectTo: '/auth/confirm' }
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
    logger.error('Erreur lors de la déconnexion', error)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
