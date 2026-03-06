'use server'

import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendConfirmationEmail } from '@/lib/email/confirmation'
import { logger } from '@/lib/logger'
import { translateAuthError } from '@/lib/auth/error-translations'

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
    siret?: string
    referralCode?: string
  }
) {
  logger.critical('🚀 DÉBUT INSCRIPTION', { email, role, timestamp: new Date().toISOString() })
  
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

  // ✅ VALIDATION 4: Pour prestataires, vérifier et sanitizer les données
  if (role === 'prestataire') {
    // Vérifier que prenom et nom sont fournis (requis pour prestataires aussi)
    if (!profileData.prenom?.trim() || !profileData.nom?.trim()) {
      return { error: 'Le prénom et le nom sont requis pour les prestataires' }
    }
    
    // Sanitize les noms (protection XSS)
    profileData.prenom = profileData.prenom.trim().substring(0, 100)
    profileData.nom = profileData.nom.trim().substring(0, 100)
    
    // Sanitize nom entreprise si fourni
    if (profileData.nomEntreprise) {
      profileData.nomEntreprise = profileData.nomEntreprise.trim().substring(0, 200)
    }

    if (profileData.siret) {
      const sanitizedSiret = profileData.siret.replace(/\D/g, '')
      if (sanitizedSiret.length !== 14) {
        return { error: 'Le numéro SIRET doit contenir 14 chiffres' }
      }
      profileData.siret = sanitizedSiret
    }
  }

  // Créer l'utilisateur via l'API admin pour éviter l'envoi automatique
  // de l'email de confirmation par Supabase (on utilise Resend à la place)
  logger.critical('📧 Création utilisateur via admin API (sans email natif)...', { email, role })
  const signupAdminClient = createAdminClient()

  let data: { user: User | null } = { user: null }

  const { data: adminData, error: adminError } = await signupAdminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: false, // Ne PAS confirmer l'email automatiquement
    user_metadata: {
      role: role,
      prenom: profileData.prenom,
      nom: profileData.nom,
      nom_entreprise: profileData.nomEntreprise || null,
      siret: profileData.siret || null,
    }
  })

  if (adminError) {
    logger.critical('⚠️ Erreur lors de la création utilisateur', { email, role, error: adminError.message })
    if (adminError.message?.toLowerCase().includes('already') || adminError.message?.toLowerCase().includes('exists')) {
      return { error: 'Cet email est déjà utilisé. Si vous avez déjà un compte, connectez-vous.' }
    }
    return { error: translateAuthError(adminError.message) }
  }

  if (!adminData?.user) {
    return { error: 'Échec de la création du compte. Veuillez réessayer.' }
  }

  data.user = adminData.user

  logger.critical('📧 Utilisateur créé avec succès', {
    email,
    role,
    userId: data.user.id,
  })

  logger.critical('👤 Utilisateur créé, rôle:', { userId: data.user.id, role, email })

  // Envoyer l'email de confirmation personnalisé (si l'utilisateur n'est pas encore confirmé)
  let confirmationEmailFailed = false
  if (data.user && !data.user.email_confirmed_at) {
    try {
      await sendConfirmationEmail(data.user.id, email, profileData.prenom, role)
      logger.info('✅ Email de confirmation personnalisé envoyé', { email, userId: data.user.id })
    } catch (emailError: unknown) {
      // Ne pas bloquer l'inscription si l'email échoue, mais informer l'utilisateur
      confirmationEmailFailed = true
      logger.warn('⚠️ Erreur envoi email confirmation personnalisé (non bloquant):', emailError)
    }
  }

  // Créer le client admin une seule fois pour toute la logique de profil
  let adminClient: ReturnType<typeof createAdminClient> | null = null
  try {
    adminClient = createAdminClient()
  } catch (adminError: unknown) {
    logger.error('Erreur création client admin:', adminError)
    // Impossible de nettoyer l'utilisateur sans client admin - loguer l'utilisateur orphelin
    logger.error('UTILISATEUR ORPHELIN - suppression manuelle requise:', { userId: data.user.id, email })
    return { error: 'Erreur de configuration serveur. Veuillez contacter le support.' }
  }

  // Créer le profil utilisateur selon le rôle
  try {
      if (role === 'couple') {
        logger.critical('👥 Traitement inscription COUPLE', { userId: data.user.id })
        
        const userId = data.user.id

        // Vérifier que l'utilisateur existe bien dans auth.users avant d'insérer
        // (nécessaire pour la contrainte couples_user_id_fkey qui référence auth.users(id))
        let userExists = false
        let retries = 0
        const maxRetries = 10 // Augmenté de 5 à 10 pour production mobile
        const retryDelay = 200 // Augmenté de 100ms à 200ms pour latence réseau mobile
        
        logger.critical('🔍 Vérification existence utilisateur dans auth.users', { userId, email })
        
        while (!userExists && retries < maxRetries) {
          try {
            const { data: userData, error: userCheckError } = await adminClient.auth.admin.getUserById(userId)
            if (userData && userData.user && !userCheckError) {
              userExists = true
              logger.critical('✅ Utilisateur trouvé dans auth.users', { userId, attemptNumber: retries + 1 })
            } else {
              retries++
              logger.critical(`⏳ Tentative ${retries}/${maxRetries} - utilisateur non encore disponible`, {
                userId,
                error: userCheckError?.message
              })
              if (retries < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay))
              }
            }
          } catch (err: unknown) {
            retries++
            logger.critical(`❌ Erreur tentative ${retries}/${maxRetries}`, {
              userId,
              error: err instanceof Error ? err.message : String(err)
            })
            if (retries < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, retryDelay))
            }
          }
        }

        if (!userExists) {
          // #region agent log
          logger.critical('🚨 ÉCHEC: Utilisateur non trouvé après toutes les tentatives', {
            userId,
            email,
            maxRetries,
            totalWaitTime: maxRetries * retryDelay
          })
          await adminClient.auth.admin.deleteUser(userId).catch(() => {})
          return { error: 'Erreur lors de la création du compte. Veuillez réessayer ou contacter le support si le problème persiste.' }
        }

        // ⚠️ PROTECTION: Supprimer tout profil créé par erreur dans profiles pour les couples
        // (au cas où le trigger handle_new_user aurait créé un profil)
        try {
          await adminClient
            .from('profiles')
            .delete()
            .eq('id', userId)
          logger.critical('🧹 Nettoyage: Profil supprimé de profiles (si existait)', { userId })
        } catch (cleanupError) {
          // Ne pas bloquer si la suppression échoue (peut-être que le profil n'existe pas)
          logger.warn('Nettoyage profil profiles (non bloquant):', cleanupError)
        }

        // Créer directement dans couples (pas de profil dans profiles pour les couples)
        logger.critical('📝 Tentative création enregistrement couple', { userId, email })
        
        // ✅ FIX: Stocker le prénom et nom dans partner_1_name uniquement
        // Le partner_2_name sera complété plus tard dans le profil
        const fullName = `${profileData.prenom || ''} ${profileData.nom || ''}`.trim()
        
        const { error: coupleError } = await adminClient
          .from('couples')
          .upsert({
            id: userId,
            user_id: userId,
            email: email,
            partner_1_name: fullName || null,
            partner_2_name: null,
          }, {
            onConflict: 'user_id'
          })

        if (coupleError) {
          logger.critical('🚨 ÉCHEC: Erreur création couple', {
            userId,
            email,
            error: coupleError.message,
            code: coupleError.code,
            details: coupleError.details
          })
          // Rollback : supprimer l'utilisateur si couple échoue
          await adminClient.auth.admin.deleteUser(userId).catch(() => {})
          return { error: 'Erreur lors de la création de votre compte couple. Veuillez réessayer.' }
        } else {
          logger.critical('✅ Couple créé avec succès', { userId })
          // Créer les préférences vides pour le nouveau couple
          try {
            const { error: prefError, data: prefData } = await adminClient
              .from('couple_preferences')
              .upsert({
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
              }, {
                onConflict: 'couple_id'
              })
              .select()
              .single()

            if (prefError) {
              logger.error('Erreur création préférences couple:', {
                userId,
                error: prefError.message,
                code: prefError.code,
                details: prefError.details,
                hint: prefError.hint
              })
            } else {
              logger.critical('✅ Préférences couple créées avec succès', {
                userId,
                preferencesId: prefData?.id
              })
            }
          } catch (prefError: unknown) {
            logger.error('Erreur inattendue création préférences (non bloquant):', {
              userId,
              error: prefError instanceof Error ? prefError.message : String(prefError),
              stack: prefError instanceof Error ? prefError.stack : undefined
            })
          }
        }
      } else {
        logger.critical('💼 Traitement inscription PRESTATAIRE', { userId: data.user.id, email })

        const userId = data.user.id

        // Vérifier que l'utilisateur existe bien dans auth.users avant d'insérer
        // (nécessaire pour la contrainte profiles_id_fkey qui référence auth.users(id))
        let userExists = false
        let retries = 0
        const maxRetries = 10 // Augmenté de 5 à 10 pour production mobile
        const retryDelay = 200 // Augmenté de 100ms à 200ms pour latence réseau mobile
        
        logger.critical('🔍 Vérification existence utilisateur dans auth.users (prestataire)', { userId, email })
        
        while (!userExists && retries < maxRetries) {
          try {
            const { data: userData, error: userCheckError } = await adminClient.auth.admin.getUserById(userId)
            if (userData && userData.user && !userCheckError) {
              userExists = true
              logger.critical('✅ Utilisateur trouvé dans auth.users (prestataire)', { userId, attemptNumber: retries + 1 })
            } else {
              retries++
              logger.critical(`⏳ Tentative ${retries}/${maxRetries} - utilisateur non encore disponible (prestataire)`, {
                userId,
                error: userCheckError?.message
              })
              if (retries < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay))
              }
            }
          } catch (err: unknown) {
            retries++
            logger.critical(`❌ Erreur tentative ${retries}/${maxRetries} (prestataire)`, {
              userId,
              error: err instanceof Error ? err.message : String(err)
            })
            if (retries < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, retryDelay))
            }
          }
        }

        if (!userExists) {
          logger.critical('🚨 ÉCHEC: Utilisateur non trouvé après toutes les tentatives (prestataire)', {
            userId,
            email,
            maxRetries,
            totalWaitTime: maxRetries * retryDelay
          })
          await adminClient.auth.admin.deleteUser(userId).catch(() => {})
          return { error: 'Erreur lors de la création du compte. Veuillez réessayer ou contacter le support si le problème persiste.' }
        }

        // Insérer ou mettre à jour dans la table profiles (prestataires)
        logger.critical('📝 Tentative création/mise à jour profil prestataire', { userId, email })
        
        // Préparer les données du profil (déjà sanitizées dans les validations)
        // Note: Le trigger peut avoir déjà créé un profil basique, l'upsert le complétera
        const profileInsertData = {
          id: userId,
          email: email,
          role: 'prestataire' as const,
          prenom: profileData.prenom || null,
          nom: profileData.nom || null,
          nom_entreprise: profileData.nomEntreprise || null,
          siret: profileData.siret || null,
        }
        
        const { error: profileError } = await adminClient
          .from('profiles')
          .upsert(profileInsertData, {
            onConflict: 'id'
          })

        if (profileError) {
          // Logger toutes les informations de l'erreur pour debugging
          logger.critical('🚨 ÉCHEC: Erreur création profil prestataire', {
            userId,
            email,
            error: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint,
            fullError: JSON.stringify(profileError, null, 2)
          })
          
          // Rollback : supprimer l'utilisateur si profil échoue
          await adminClient.auth.admin.deleteUser(userId).catch(() => {})
          return { error: 'Erreur lors de la création de votre profil prestataire. Veuillez réessayer.' }
        } else {
          logger.critical('✅ Profil prestataire créé avec succès', { userId })
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

        // Traiter le code de parrainage si fourni
        if (profileData.referralCode) {
          try {
            const { data: referralData } = await adminClient
              .from('provider_referrals')
              .select('referral_code, provider_id, total_referrals')
              .eq('referral_code', profileData.referralCode.toUpperCase())
              .maybeSingle()

            if (referralData) {
              // Enregistrer l'usage du parrainage
              const { data: usageData } = await adminClient
                .from('referral_usages')
                .insert({
                  referral_code: referralData.referral_code,
                  referrer_id: referralData.provider_id,
                  referred_user_id: data.user.id,
                })
                .select('id')
                .single()

              // Incrémenter le compteur
              await adminClient
                .from('provider_referrals')
                .update({
                  total_referrals: (referralData.total_referrals || 0) + 1,
                  updated_at: new Date().toISOString(),
                })
                .eq('provider_id', referralData.provider_id)

              logger.info('Parrainage enregistré', {
                referrer: referralData.provider_id,
                referred: data.user.id,
                code: referralData.referral_code,
              })

              // Bonus ambassadeur : créditer le signup si le parrain est ambassadeur actif
              if (usageData?.id) {
                const { error: bonusError } = await adminClient.rpc(
                  'credit_ambassador_signup_bonus',
                  { p_referral_usage_id: usageData.id }
                )
                if (bonusError) {
                  logger.warn('Erreur credit_ambassador_signup_bonus (non bloquant):', bonusError)
                }
              }
            }
          } catch (referralError) {
            // Ne pas bloquer l'inscription si le parrainage échoue
            logger.warn('Erreur parrainage (non bloquant):', referralError)
          }
        }
      }
    } catch (err: unknown) {
      logger.error('Erreur lors de la création du profil', err)
      const userId = data.user.id
      const errMessage = err instanceof Error ? err.message : String(err)
      
      // Si c'est une erreur RLS, vérifier si le profil a quand même été créé
      if (errMessage.includes('row-level security')) {
        logger.warn('Erreur RLS détectée, vérification si le profil existe quand même...', { userId, role })
        
        // Vérifier si le profil a été créé malgré l'erreur RLS (réutilise le client admin existant)
        try {
          let profileExists = false
          
          if (role === 'couple') {
            const { data: coupleCheck } = await adminClient
              .from('couples')
              .select('id')
              .eq('user_id', userId)
              .maybeSingle()
            profileExists = !!coupleCheck
          } else {
            const { data: profileCheck } = await adminClient
              .from('profiles')
              .select('id')
              .eq('id', userId)
              .maybeSingle()
            profileExists = !!profileCheck
          }
          
          if (profileExists) {
            // Le profil existe malgré l'erreur RLS, l'inscription est réussie
            logger.critical('✅ Profil vérifié et existant malgré erreur RLS', { userId, role })
            const response = { success: true, redirectTo: '/auth/confirm' }
            try {
              revalidatePath('/', 'layout')
            } catch (revalidateError: unknown) {
              logger.warn('Erreur revalidatePath (non bloquant):', revalidateError)
            }
            return response
          } else {
            // Le profil n'existe pas, essayer de le créer avec le client admin
            logger.warn('Profil non trouvé après erreur RLS, tentative de création avec client admin...', { userId, role })
            
            // La création avec adminClient a déjà été tentée dans le bloc try principal
            // Si on arrive ici, c'est que ça a échoué
            // Ne pas retourner succès si le profil n'existe pas
            logger.critical('🚨 ÉCHEC: Profil non créé après erreur RLS', { userId, role, error: errMessage })
            
            // Essayer de supprimer l'utilisateur créé pour éviter un compte orphelin
            try {
              await adminClient.auth.admin.deleteUser(userId)
              logger.warn('Utilisateur supprimé car profil non créé', { userId })
            } catch (deleteError) {
              logger.error('Erreur lors de la suppression de l\'utilisateur orphelin:', deleteError)
            }
            
            return { 
              error: 'Erreur lors de la création de votre profil. Veuillez réessayer ou contacter le support si le problème persiste.' 
            }
          }
        } catch (checkError: unknown) {
          // Erreur lors de la vérification, ne pas retourner succès
          logger.error('Erreur lors de la vérification du profil après erreur RLS:', checkError)
          
          // Essayer de supprimer l'utilisateur créé avec le client admin déjà initialisé
          if (adminClient) {
            try {
              await adminClient.auth.admin.deleteUser(userId)
            } catch (deleteError) {
              logger.error('Erreur suppression utilisateur orphelin:', deleteError)
            }
          }

          return {
            error: 'Erreur lors de la création de votre profil. Veuillez réessayer ou contacter le support si le problème persiste.'
          }
        }
      } else {
        // Erreur non-RLS, essayer de supprimer l'utilisateur créé en cas d'erreur
        if (adminClient) {
          try {
            await adminClient.auth.admin.deleteUser(data.user.id)
            logger.warn('Utilisateur supprimé après erreur non-RLS', { userId: data.user.id })
          } catch (deleteError) {
            logger.error('Erreur lors de la suppression de l\'utilisateur:', deleteError)
          }
        }
        return { error: 'Une erreur est survenue lors de la création de votre compte. Veuillez réessayer.' }
      }
    }

    // Note: L'email de bienvenue n'est plus envoyé ici pour éviter un doublon.
    // L'email de confirmation (sendConfirmationEmail) sert déjà de bienvenue.
    // Si Supabase envoie aussi un email natif, le désactiver dans le dashboard :
    // Authentication > Settings > décocher "Enable email confirmations" (géré par sendConfirmationEmail).

    // Succès - retourner avec redirection
    logger.critical('🎉 INSCRIPTION RÉUSSIE', { email, role, userId: data.user.id })
    
    // Préparer la réponse AVANT revalidatePath (pour éviter les problèmes de sérialisation)
    const response: { success: boolean; redirectTo: string; emailWarning?: string } = { success: true, redirectTo: '/auth/confirm' }
    if (confirmationEmailFailed) {
      response.emailWarning = "Votre compte a ete cree mais l'email de confirmation n'a pas pu etre envoye. Vous pouvez demander un renvoi depuis la page de connexion."
    }
    
    
    // Revalidate après avoir préparé la réponse
    try {
      revalidatePath('/', 'layout')
    } catch (revalidateError: unknown) {
      // Ne pas bloquer si revalidatePath échoue
      logger.warn('Erreur revalidatePath (non bloquant):', revalidateError)
    }
    
    
    return response
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: translateAuthError(error.message) }
  }

  if (!data.user) {
    return { error: 'Échec de la connexion. Veuillez réessayer.' }
  }

  // Utiliser la fonction utilitaire centralisée pour vérifier le rôle
  const roleCheck = await getUserRoleServer(data.user.id)

  revalidatePath('/', 'layout')

  if (roleCheck.role) {
    // Pour les prestataires, vérifier si l'onboarding est terminé
    if (roleCheck.role === 'prestataire') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_step')
        .eq('id', data.user.id)
        .maybeSingle()

      if (!profile || (profile.onboarding_step ?? 0) < 5) {
        return { success: true, redirectTo: '/prestataire/onboarding' }
      }
    }

    const dashboardUrl = getDashboardUrl(roleCheck.role)
    return { success: true, redirectTo: dashboardUrl }
  if (data.user) {
    const userId = data.user.id

    // Vérifier le rôle et l'onboarding en parallèle avec le même client Supabase
    const [{ data: couple }, { data: profile }] = await Promise.all([
      supabase.from('couples').select('id').eq('user_id', userId).maybeSingle(),
      supabase.from('profiles').select('id, onboarding_step').eq('id', userId).maybeSingle(),
    ])

    // Revalider uniquement les chemins concernés (pas tout le layout)
    revalidatePath('/couple/dashboard')
    revalidatePath('/prestataire/dashboard')

    if (couple) {
      return { success: true, redirectTo: '/couple/dashboard' }
    }

    if (profile) {
      if ((profile.onboarding_step ?? 0) < 5) {
        return { success: true, redirectTo: '/prestataire/onboarding' }
      }
      return { success: true, redirectTo: '/prestataire/dashboard' }
    }

    // Compte auth créé mais profil non complété
    return { success: true, redirectTo: '/' }
  }

  // Si ni couple ni prestataire trouvé, rediriger vers la page d'accueil
  // (cas d'un compte auth créé mais profil non complété)
  return { success: true, redirectTo: '/' }
}

export async function signOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    logger.error('Erreur lors de la déconnexion', error)
    return { error: 'Erreur lors de la déconnexion. Veuillez réessayer.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
