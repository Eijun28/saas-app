'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email/resend'
import { sendConfirmationEmail } from '@/lib/email/confirmation'
import { logger } from '@/lib/logger'
import { translateAuthError } from '@/lib/auth/error-translations'
import { getUserRoleServer, getDashboardUrl } from '@/lib/auth/utils'

import { revalidatePath } from 'next/cache'

import { redirect } from 'next/navigation'

// ---------------------------------------------------------------------------
// Helpers extraits pour supprimer la duplication couple/prestataire
// ---------------------------------------------------------------------------

/**
 * Crée un client admin Supabase de manière sûre.
 * Retourne null si la création échoue (au lieu de planter).
 */
function getAdminClient(userId?: string): ReturnType<typeof createAdminClient> | null {
  try {
    return createAdminClient()
  } catch (err: any) {
    logger.critical('🚨 Erreur création client admin', { userId, error: err?.message })
    return null
  }
}

/**
 * Attend que l'utilisateur soit disponible dans auth.users (réplication async Supabase).
 * Utilise un backoff exponentiel au lieu d'un délai fixe.
 */
async function waitForUserInAuth(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  label: string
): Promise<boolean> {
  const MAX_RETRIES = 8
  const BASE_DELAY = 100 // ms

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data: userData, error: userCheckError } = await adminClient.auth.admin.getUserById(userId)
      if (userData?.user && !userCheckError) {
        logger.info(`✅ Utilisateur trouvé dans auth.users (${label})`, { userId, attempt })
        return true
      }
    } catch (err: any) {
      logger.warn(`⏳ Tentative ${attempt}/${MAX_RETRIES} - ${label}`, {
        userId,
        error: err?.message || String(err)
      })
    }

    if (attempt < MAX_RETRIES) {
      // Backoff exponentiel : 100, 200, 400, 800, 1600, 3200, 6400 ms
      await new Promise(resolve => setTimeout(resolve, BASE_DELAY * Math.pow(2, attempt - 1)))
    }
  }

  logger.critical(`🚨 Utilisateur non trouvé après ${MAX_RETRIES} tentatives (${label})`, { userId })
  return false
}

/**
 * Rollback propre : supprime l'utilisateur si la création du profil échoue.
 */
async function rollbackUser(adminClient: ReturnType<typeof createAdminClient>, userId: string) {
  try {
    await adminClient.auth.admin.deleteUser(userId)
    logger.warn('🧹 Utilisateur supprimé (rollback)', { userId })
  } catch (deleteError) {
    logger.error('Erreur rollback utilisateur:', deleteError)
  }
}

// ---------------------------------------------------------------------------
// Sanitization commune
// ---------------------------------------------------------------------------

function sanitizeProfileData(profileData: {
  prenom: string
  nom: string
  nomEntreprise?: string
  siret?: string
  referralCode?: string
}): { error?: string } {
  if (!profileData.prenom?.trim() || !profileData.nom?.trim()) {
    return { error: 'Le prénom et le nom sont requis' }
  }

  // Protection XSS
  profileData.prenom = profileData.prenom.trim().substring(0, 100)
  profileData.nom = profileData.nom.trim().substring(0, 100)

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

  return {}
}

// ---------------------------------------------------------------------------
// Création de profil par rôle
// ---------------------------------------------------------------------------

async function createCoupleProfile(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string,
  profileData: { prenom: string; nom: string }
): Promise<{ error?: string }> {
  // Supprimer tout profil "profiles" créé par erreur par le trigger
  try {
    await adminClient.from('profiles').delete().eq('id', userId)
  } catch {
    // Non bloquant
  }

  const fullName = `${profileData.prenom} ${profileData.nom}`.trim()

  const { error: coupleError } = await adminClient
    .from('couples')
    .upsert({
      id: userId,
      user_id: userId,
      email,
      partner_1_name: fullName || null,
      partner_2_name: null,
    }, { onConflict: 'user_id' })

  if (coupleError) {
    logger.critical('🚨 Erreur création couple', {
      userId, email,
      error: coupleError.message,
      code: coupleError.code,
    })
    return { error: 'Erreur lors de la création de votre compte couple. Veuillez réessayer.' }
  }

  logger.info('✅ Couple créé avec succès', { userId })

  // Créer les préférences vides (non bloquant)
  try {
    await adminClient
      .from('couple_preferences')
      .upsert({
        couple_id: userId,
        languages: ['français'],
        essential_services: [],
        optional_services: [],
        cultural_preferences: {},
        service_priorities: {},
        budget_breakdown: {},
        profile_completed: false,
        completion_percentage: 0,
        onboarding_step: 0,
      }, { onConflict: 'couple_id' })
  } catch (prefError: any) {
    logger.warn('Erreur création préférences couple (non bloquant):', prefError?.message)
  }

  return {}
}

async function createPrestataireProfile(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string,
  profileData: { prenom: string; nom: string; nomEntreprise?: string; siret?: string; referralCode?: string }
): Promise<{ error?: string }> {
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id: userId,
      email,
      role: 'prestataire' as const,
      prenom: profileData.prenom || null,
      nom: profileData.nom || null,
      nom_entreprise: profileData.nomEntreprise || null,
      siret: profileData.siret || null,
    }, { onConflict: 'id' })

  if (profileError) {
    logger.critical('🚨 Erreur création profil prestataire', {
      userId, email,
      error: profileError.message,
      code: profileError.code,
    })
    return { error: 'Erreur lors de la création de votre profil prestataire. Veuillez réessayer.' }
  }

  logger.info('✅ Profil prestataire créé avec succès', { userId })

  // Early Adopter : incrément atomique pour éviter la race condition
  await tryAssignEarlyAdopter(adminClient, userId)

  // Parrainage
  if (profileData.referralCode) {
    await tryProcessReferral(adminClient, profileData.referralCode, userId)
  }

  return {}
}

/**
 * Incrémente atomiquement le compteur Early Adopter.
 * Utilise un optimistic lock (eq sur used_slots) pour éviter la race condition
 * où deux inscriptions simultanées pourraient dépasser total_slots.
 */
async function tryAssignEarlyAdopter(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string
) {
  try {
    const { data: programData } = await adminClient
      .from('early_adopter_program')
      .select('id, total_slots, used_slots, program_active')
      .single()

    if (!programData?.program_active || programData.used_slots >= programData.total_slots) {
      return
    }

    // Optimistic lock : n'incrémente QUE si used_slots n'a pas changé entre-temps
    const { data: updated } = await adminClient
      .from('early_adopter_program')
      .update({
        used_slots: programData.used_slots + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', programData.id)
      .eq('used_slots', programData.used_slots) // <-- verrou optimiste
      .select('id')

    // Si aucune row modifiée, un autre process a pris la place → pas de badge
    if (!updated || updated.length === 0) {
      logger.info('Early Adopter slot pris par un autre inscrit (race condition évitée)', { userId })
      return
    }

    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 90)

    await adminClient
      .from('profiles')
      .update({
        is_early_adopter: true,
        early_adopter_enrolled_at: new Date().toISOString(),
        early_adopter_trial_end_date: trialEndDate.toISOString(),
        subscription_tier: 'early_adopter'
      })
      .eq('id', userId)

    await adminClient
      .from('early_adopter_notifications')
      .insert({ user_id: userId, notification_type: 'welcome' })
      .catch(() => {})

    logger.info('✅ Badge Early Adopter attribué', { userId })
  } catch (err) {
    logger.warn('Erreur Early Adopter (non bloquant):', err)
  }
}

async function tryProcessReferral(
  adminClient: ReturnType<typeof createAdminClient>,
  referralCode: string,
  userId: string
) {
  try {
    const { data: referralData } = await adminClient
      .from('provider_referrals')
      .select('referral_code, provider_id, total_referrals')
      .eq('referral_code', referralCode.toUpperCase())
      .maybeSingle()

    if (!referralData) return

    // Enregistrer l'usage et incrémenter en parallèle
    await Promise.all([
      adminClient.from('referral_usages').insert({
        referral_code: referralData.referral_code,
        referrer_id: referralData.provider_id,
        referred_user_id: userId,
      }),
      adminClient.from('provider_referrals').update({
        total_referrals: (referralData.total_referrals || 0) + 1,
        updated_at: new Date().toISOString(),
      }).eq('provider_id', referralData.provider_id),
    ])

    logger.info('Parrainage enregistré', {
      referrer: referralData.provider_id,
      referred: userId,
      code: referralData.referral_code,
    })
  } catch (err) {
    logger.warn('Erreur parrainage (non bloquant):', err)
  }
}

// ---------------------------------------------------------------------------
// Fonction principale signUp
// ---------------------------------------------------------------------------

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

  // --- Validations ---
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Email invalide' }
  }

  const ALLOWED_USER_TYPES = ['couple', 'prestataire']
  if (!ALLOWED_USER_TYPES.includes(role)) {
    return { error: 'Type utilisateur non autorisé' }
  }

  // Sanitize commune (couple ET prestataire)
  const sanitizeResult = sanitizeProfileData(profileData)
  if (sanitizeResult.error) return sanitizeResult

  // Validation prestataire-spécifique
  if (role === 'prestataire' && (!profileData.nomEntreprise || profileData.nomEntreprise.trim().length < 2)) {
    return { error: 'Le nom de l\'entreprise est requis pour les prestataires' }
  }

  // --- Création auth user ---
  const supabase = await createClient()

  let { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      data: {
        role,
        prenom: profileData.prenom,
        nom: profileData.nom,
        nom_entreprise: profileData.nomEntreprise || null,
        siret: profileData.siret || null,
      }
    },
  })

  // Gérer les erreurs Supabase Auth
  if (error) {
    logger.critical('⚠️ Erreur signUp', { email, role, error: error.message, hasUser: !!data?.user })

    // Email échoué mais user créé → on continue
    if (data?.user && error.message?.includes('email') && error.message?.includes('send')) {
      logger.warn('Email de confirmation non envoyé mais utilisateur créé:', error.message)
    }
    // Erreur DB trigger → fallback admin sans role metadata
    else if (error.message?.toLowerCase().includes('database error')) {
      logger.critical('🔄 Erreur DB trigger, fallback admin API...', { email, role })
      try {
        const adminClient = createAdminClient()
        const { data: adminData, error: adminError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: false,
          user_metadata: {
            prenom: profileData.prenom,
            nom: profileData.nom,
            nom_entreprise: profileData.nomEntreprise || null,
            siret: profileData.siret || null,
          }
        })
        if (adminError) {
          if (adminError.message?.toLowerCase().includes('already') || adminError.message?.toLowerCase().includes('exists')) {
            return { error: 'Cet email est déjà utilisé. Si vous avez déjà un compte, connectez-vous.' }
          }
          return { error: translateAuthError(adminError.message) }
        }
        if (!adminData?.user) {
          return { error: 'Échec de la création du compte. Veuillez réessayer.' }
        }

        data = { ...data, user: adminData.user }

        // Ajouter le rôle aux metadata (le trigger ne se re-déclenche pas sur UPDATE)
        await adminClient.auth.admin.updateUserById(adminData.user.id, {
          user_metadata: {
            role,
            prenom: profileData.prenom,
            nom: profileData.nom,
            nom_entreprise: profileData.nomEntreprise || null,
            siret: profileData.siret || null,
          }
        })
      } catch (adminFallbackError: any) {
        logger.critical('🚨 Fallback admin exception', { error: adminFallbackError?.message })
        return { error: 'Échec de la création du compte. Veuillez réessayer.' }
      }
    }
    // Autre erreur → stop
    else {
      return { error: translateAuthError(error.message) }
    }
  }

  // Vérifier que l'utilisateur a été créé
  if (!data?.user) {
    return { error: 'Échec de la création du compte. Veuillez réessayer.' }
  }

  // Détecter "user already registered" (Supabase renvoie identities vide)
  if (data.user.identities && data.user.identities.length === 0) {
    return {
      error: 'Cet email est déjà utilisé. Si vous avez déjà un compte, connectez-vous. Sinon, utilisez une autre adresse email.'
    }
  }

  const userId = data.user.id
  logger.critical('👤 Utilisateur créé', { userId, role, email })

  // --- Email de confirmation (non bloquant, fire-and-forget) ---
  if (!data.user.email_confirmed_at) {
    sendConfirmationEmail(userId, email, profileData.prenom).catch((err) => {
      logger.warn('⚠️ Erreur envoi email confirmation (non bloquant):', err)
    })
  }

  // --- Création du profil ---
  try {
    const adminClient = getAdminClient(userId)
    if (!adminClient) {
      return { error: 'Erreur de configuration serveur. Veuillez contacter le support.' }
    }

    // Attendre que le user soit disponible dans auth.users (réplication async)
    const userReady = await waitForUserInAuth(adminClient, userId, role)
    if (!userReady) {
      await rollbackUser(adminClient, userId)
      return { error: 'Erreur lors de la création du compte. Veuillez réessayer ou contacter le support si le problème persiste.' }
    }

    // Créer le profil selon le rôle
    let profileResult: { error?: string }
    if (role === 'couple') {
      profileResult = await createCoupleProfile(adminClient, userId, email, profileData)
    } else {
      profileResult = await createPrestataireProfile(adminClient, userId, email, profileData)
    }

    if (profileResult.error) {
      await rollbackUser(adminClient, userId)
      return profileResult
    }
  } catch (err: any) {
    logger.error('Erreur lors de la création du profil', err)
    const adminClient = getAdminClient()

    // Erreur RLS : vérifier si le profil existe quand même
    if (err.message?.includes('row-level security') && adminClient) {
      const table = role === 'couple' ? 'couples' : 'profiles'
      const column = role === 'couple' ? 'user_id' : 'id'

      const { data: profileCheck } = await adminClient
        .from(table)
        .select('id')
        .eq(column, userId)
        .maybeSingle()

      if (profileCheck) {
        logger.info('✅ Profil existant malgré erreur RLS', { userId, role })
        try { revalidatePath('/', 'layout') } catch {}
        return { success: true, redirectTo: '/auth/confirm' }
      }
    }

    // Rollback
    if (adminClient) {
      await rollbackUser(adminClient, userId)
    }
    return { error: 'Une erreur est survenue lors de la création de votre compte. Veuillez réessayer.' }
  }

  // --- Email de bienvenue (non bloquant, fire-and-forget) ---
  sendWelcomeEmail(email, role, profileData.prenom, profileData.nom).catch((err) => {
    logger.warn('⚠️ Email de bienvenue non envoyé (non bloquant):', err)
  })

  // --- Succès ---
  logger.critical('🎉 INSCRIPTION RÉUSSIE', { email, role, userId })

  const response = { success: true, redirectTo: '/auth/confirm' }

  try {
    revalidatePath('/', 'layout')
  } catch {
    // Non bloquant
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

  if (data.user) {
    const roleCheck = await getUserRoleServer(data.user.id)

    revalidatePath('/', 'layout')

    if (roleCheck.role) {
      const dashboardUrl = getDashboardUrl(roleCheck.role)
      return { success: true, redirectTo: dashboardUrl }
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
