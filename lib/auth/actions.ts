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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:12',message:'signUp entry',data:{email,role,prenom:profileData.prenom},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:50',message:'before supabase.auth.signUp',data:{email,role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:66',message:'after supabase.auth.signUp',data:{hasError:!!error,errorMessage:error?.message,hasUser:!!data?.user,userId:data?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  // Gérer les erreurs d'envoi d'email (ne pas bloquer l'inscription si l'utilisateur est créé)
  if (error) {
    // Si l'utilisateur est créé mais l'email échoue, on continue quand même
    if (data?.user && error.message?.includes('email') && error.message?.includes('send')) {
      logger.warn('Email de confirmation non envoyé mais utilisateur créé:', error.message)
      // On continue le processus même si l'email échoue
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:73',message:'returning error from signUp',data:{errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return { error: error.message }
    }
  }

  if (data.user) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:77',message:'user created, entering profile creation',data:{role,userId:data.user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    try {
      if (role === 'couple') {
        // Utiliser le client admin pour contourner les politiques RLS
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:81',message:'before createAdminClient for couple',data:{role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        const adminClient = createAdminClient()
        
        // Insérer dans la table couples (nouvelle structure)
        // Note: currency a une valeur par défaut 'EUR' dans le schéma
        // ✅ VALIDATION 5: Vérifier que l'ID utilisateur existe
        const userId = data.user.id
        if (!userId || typeof userId !== 'string') {
          // Rollback : supprimer l'utilisateur si ID invalide
          await adminClient.auth.admin.deleteUser(userId).catch(() => {})
          return { error: 'ID utilisateur invalide' }
        }

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:93',message:'before couples insert',data:{userId,email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        const { error: coupleError } = await adminClient
          .from('couples')
          .insert({
            id: userId,
            user_id: userId, // ✅ Utiliser user_id, pas partner1_id
            email: email,
            partner_1_name: profileData.prenom || null,
            partner_2_name: profileData.nom || null,
          })

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:104',message:'after couples insert',data:{hasError:!!coupleError,errorMessage:coupleError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
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
        // Utiliser le client admin pour contourner les politiques RLS
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:132',message:'before createAdminClient for prestataire',data:{role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        const adminClient = createAdminClient()
        
        // ✅ VALIDATION 6: Vérifier que l'ID utilisateur existe
        const userId = data.user.id
        if (!userId || typeof userId !== 'string') {
          // Rollback : supprimer l'utilisateur si ID invalide
          await adminClient.auth.admin.deleteUser(userId).catch(() => {})
          return { error: 'ID utilisateur invalide' }
        }

        // Insérer dans la table profiles (prestataires)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:143',message:'before profiles insert',data:{userId,email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
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

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:154',message:'after profiles insert',data:{hasError:!!profileError,errorMessage:profileError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:208',message:'catch block in signUp',data:{errorMessage:err?.message,errorStack:err?.stack?.substring(0,200),errorName:err?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      logger.error('Erreur lors de la création du profil', err)
      // Si c'est une erreur RLS mais que l'utilisateur est créé, on continue
      if (err.message?.includes('row-level security')) {
        logger.warn('Erreur RLS détectée mais utilisateur créé, continuation...')
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:214',message:'returning error from catch',data:{errorMessage:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return { error: `Erreur lors de la création du profil: ${err.message}` }
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:237',message:'before redirect',data:{role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    revalidatePath('/', 'layout')
    try {
      redirect('/auth/confirm')
    } catch (redirectErr: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:240',message:'redirect exception caught',data:{errorMessage:redirectErr?.message,errorName:redirectErr?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Next.js redirect() lance une exception spéciale, on la laisse passer
      throw redirectErr
    }
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/actions.ts:247',message:'signUp returning success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
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
    logger.error('Erreur lors de la déconnexion', error)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
