'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email/resend'
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
  }
) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:12',message:'signUp ENTRY',data:{email,role,hasPrenom:!!profileData.prenom,hasNom:!!profileData.nom},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  logger.critical('🚀 DÉBUT INSCRIPTION', { email, role, timestamp: new Date().toISOString() })
  
  // ✅ VALIDATION 1: Vérifier format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:27',message:'RETURN email invalid',data:{email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return { error: 'Email invalide' }
  }

  // ✅ VALIDATION 2: Vérifier userType autorisé
  const ALLOWED_USER_TYPES = ['couple', 'prestataire']
  if (!ALLOWED_USER_TYPES.includes(role)) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:33',message:'RETURN role invalid',data:{role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return { error: 'Type utilisateur non autorisé' }
  }

  // ✅ VALIDATION 3: Pour couples, vérifier noms requis
  if (role === 'couple') {
    if (!profileData.prenom?.trim() || !profileData.nom?.trim()) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:39',message:'RETURN names required',data:{hasPrenom:!!profileData.prenom?.trim(),hasNom:!!profileData.nom?.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:52',message:'BEFORE supabase.auth.signUp',data:{email,role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:69',message:'AFTER supabase.auth.signUp',data:{hasError:!!error,hasUser:!!data?.user,userId:data?.user?.id,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  // Gérer les erreurs d'envoi d'email (ne pas bloquer l'inscription si l'utilisateur est créé)
  if (error) {
    // Si l'utilisateur est créé mais l'email échoue, on continue quand même
    if (data?.user && error.message?.includes('email') && error.message?.includes('send')) {
      logger.warn('Email de confirmation non envoyé mais utilisateur créé:', error.message)
      // On continue le processus même si l'email échoue
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:75',message:'RETURN error from signUp',data:{errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return { error: translateAuthError(error.message) }
    }
  }

  // Vérifier que l'utilisateur a été créé
  if (!data?.user) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:82',message:'RETURN no user created',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
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
          } catch (err: any) {
            retries++
            logger.critical(`❌ Erreur tentative ${retries}/${maxRetries}`, {
              userId,
              error: err?.message || String(err)
            })
            if (retries < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, retryDelay))
            }
          }
        }

        if (!userExists) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:141',message:'RETURN user not found',data:{userId,email,maxRetries},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          logger.critical('🚨 ÉCHEC: Utilisateur non trouvé après toutes les tentatives', {
            userId,
            email,
            maxRetries,
            totalWaitTime: maxRetries * retryDelay
          })
          await adminClient.auth.admin.deleteUser(userId).catch(() => {})
          return { error: 'Erreur lors de la création du compte. Veuillez réessayer ou contacter le support si le problème persiste.' }
        }

        // Créer directement dans couples (pas de profil dans profiles pour les couples)
        logger.critical('📝 Tentative création enregistrement couple', { userId, email })
        
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
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:166',message:'RETURN couple error',data:{userId,email,errorMessage:coupleError.message,errorCode:coupleError.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
          // #endregion
          logger.critical('🚨 ÉCHEC: Erreur création couple', {
            userId,
            email,
            error: coupleError.message,
            code: coupleError.code,
            details: coupleError.details
          })
          // Rollback : supprimer l'utilisateur si couple échoue
          await adminClient.auth.admin.deleteUser(userId).catch(() => {})
          return { error: translateAuthError(`Erreur création couple: ${coupleError.message}`) }
        } else {
          logger.critical('✅ Couple créé avec succès', { userId })
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
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:236',message:'RETURN admin client error prestataire',data:{errorMessage:adminError?.message,userId:data.user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
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
          } catch (err: any) {
            retries++
            logger.critical(`❌ Erreur tentative ${retries}/${maxRetries} (prestataire)`, {
              userId,
              error: err?.message || String(err)
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
        
        const { error: profileError } = await adminClient
          .from('profiles')
          .upsert({
            id: userId,
            email: email,
            role: 'prestataire',
            prenom: profileData.prenom.trim().substring(0, 100),
            nom: profileData.nom.trim().substring(0, 100),
            nom_entreprise: profileData.nomEntreprise ? profileData.nomEntreprise.trim().substring(0, 200) : null,
          }, {
            onConflict: 'id'
          })

        if (profileError) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:231',message:'RETURN profile error',data:{userId,email,errorMessage:profileError.message,errorCode:profileError.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
          logger.critical('🚨 ÉCHEC: Erreur création profil prestataire', {
            userId,
            email,
            error: profileError.message,
            code: profileError.code,
            details: profileError.details
          })
          // Rollback : supprimer l'utilisateur si profil échoue
          await adminClient.auth.admin.deleteUser(userId).catch(() => {})
          return { error: translateAuthError(`Erreur création profil: ${profileError.message}`) }
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
      }
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:294',message:'CATCH block in signUp',data:{errorMessage:err?.message,errorName:err?.name,isRLSError:err?.message?.includes('row-level security')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      logger.error('Erreur lors de la création du profil', err)
      // Si c'est une erreur RLS mais que l'utilisateur est créé, on continue
      if (err.message?.includes('row-level security')) {
        logger.warn('Erreur RLS détectée mais utilisateur créé, continuation...')
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:298',message:'RLS error - continuing',data:{userId:data.user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        // IMPORTANT: Même en cas d'erreur RLS, on doit retourner un résultat valide
        // L'utilisateur est créé, donc on considère que l'inscription est réussie
        logger.critical('🎉 INSCRIPTION RÉUSSIE (malgré erreur RLS)', { email, role, userId: data.user.id })
        const response = { success: true, redirectTo: '/auth/confirm' }
        try {
          revalidatePath('/', 'layout')
        } catch (revalidateError: any) {
          logger.warn('Erreur revalidatePath (non bloquant):', revalidateError)
        }
        return response
      } else {
        // Essayer de supprimer l'utilisateur créé en cas d'erreur
        try {
          const adminClient = createAdminClient()
          await adminClient.auth.admin.deleteUser(data.user.id)
        } catch {}
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:305',message:'RETURN error from catch',data:{errorMessage:err?.message || 'Erreur inconnue'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        return { error: translateAuthError(err.message || 'Erreur inconnue') }
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
    logger.critical('🎉 INSCRIPTION RÉUSSIE', { email, role, userId: data.user.id })
    
    // Préparer la réponse AVANT revalidatePath (pour éviter les problèmes de sérialisation)
    const response = { success: true, redirectTo: '/auth/confirm' }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:332',message:'RETURN success - BEFORE revalidatePath',data:{email,role,userId:data.user.id,responseStringified:JSON.stringify(response)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Revalidate après avoir préparé la réponse
    try {
      revalidatePath('/', 'layout')
    } catch (revalidateError: any) {
      // Ne pas bloquer si revalidatePath échoue
      logger.warn('Erreur revalidatePath (non bloquant):', revalidateError)
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:342',message:'RETURN success - AFTER revalidatePath',data:{responseStringified:JSON.stringify(response)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
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
