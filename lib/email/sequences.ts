/**
 * Séquences d'emails automatiques pour Nuply
 */

import { Resend } from 'resend'
import { generateEmailTemplate, generateContentBlock } from './templates'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@nuply.fr'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Helper pour récupérer l'email d'un utilisateur via auth.users
async function getUserEmail(adminClient: ReturnType<typeof createAdminClient>, userId: string): Promise<string | null> {
  try {
    const { data } = await adminClient.auth.admin.getUserById(userId)
    return data?.user?.email || null
  } catch {
    return null
  }
}

// ============================================================================
// RELANCES PROFILS INCOMPLETS - PRESTATAIRES
// ============================================================================

export async function sendProviderIncompleteProfileReminder(
  providerId: string,
  reminderNumber: 1 | 2 | 3
) {
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY non configurée')
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const adminClient = createAdminClient()

    // Récupérer l'email via auth.users
    const email = await getUserEmail(adminClient, providerId)
    if (!email) {
      return { success: false, error: 'Email non trouvé' }
    }

    // Récupérer le profil
    const { data: profile } = await adminClient
      .from('profiles')
      .select('prenom, nom')
      .eq('id', providerId)
      .single()

    const { data: prestataireProfile } = await adminClient
      .from('prestataire_profiles')
      .select('nom_entreprise, type_prestation')
      .eq('user_id', providerId)
      .single()

    // Déterminer ce qui manque
    const missingItems: string[] = []
    if (!prestataireProfile?.nom_entreprise) missingItems.push('Nom de votre entreprise')
    if (!prestataireProfile?.type_prestation) missingItems.push('Type de prestation')

    const subjects = {
      1: `${profile?.prenom || 'Bonjour'}, finalisez votre profil Nuply !`,
      2: `Rappel : Votre profil Nuply attend d'être complété`,
      3: `Dernier rappel : Ne manquez pas les demandes de couples !`,
    }

    const intros = {
      1: `Nous avons remarqué que votre profil n'est pas encore complet.`,
      2: `Votre profil Nuply est toujours incomplet. Les couples ne peuvent pas vous trouver !`,
      3: `C'est notre dernier rappel. Complétez votre profil pour recevoir des demandes de couples.`,
    }

    const missingList = missingItems.length > 0
      ? `<ul style="margin: 10px 0; padding-left: 20px;">
           ${missingItems.map(item => `<li style="color: #dc2626; margin: 5px 0;">${item}</li>`).join('')}
         </ul>`
      : ''

    const resend = new Resend(resendApiKey)
    const html = generateEmailTemplate({
      title: 'Complétez votre profil',
      greeting: `Bonjour ${profile?.prenom || ''}`,
      content: `
        <p style="font-size: 16px; margin-bottom: 20px;">
          ${intros[reminderNumber]}
        </p>
        ${missingItems.length > 0 ? generateContentBlock(
          `<p style="margin: 0 0 10px 0; font-weight: 600; color: #991b1b;">Il vous manque :</p>
           ${missingList}`,
          '#ef4444'
        ) : ''}
        <p style="font-size: 16px; margin-bottom: 20px;">
          Un profil complet augmente vos chances d'être contacté par des couples.
        </p>
      `,
      buttonText: 'Compléter mon profil',
      buttonUrl: `${siteUrl}/prestataire/profil`,
      footer: 'L\'équipe Nuply',
    })

    await resend.emails.send({
      from: `NUPLY <${fromEmail}>`,
      to: email,
      subject: subjects[reminderNumber],
      html,
    })

    // Log l'email envoyé (silencieux si table n'existe pas)
    await adminClient
      .from('email_logs')
      .insert({
        user_id: providerId,
        email_type: 'provider_incomplete_profile',
        reminder_number: reminderNumber,
        sent_at: new Date().toISOString(),
      })
      .catch(() => {})

    logger.info('Email relance profil envoyé', { providerId, reminderNumber })
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    logger.error('Erreur envoi relance profil prestataire:', error)
    return { success: false, error: message }
  }
}

// ============================================================================
// RELANCES PROFILS INCOMPLETS - COUPLES
// ============================================================================

export async function sendCoupleIncompleteProfileReminder(
  coupleUserId: string,
  reminderNumber: 1 | 2 | 3
) {
  if (!resendApiKey) {
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const adminClient = createAdminClient()

    const email = await getUserEmail(adminClient, coupleUserId)
    if (!email) {
      return { success: false, error: 'Email non trouvé' }
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('prenom')
      .eq('id', coupleUserId)
      .single()

    const { data: coupleProfile } = await adminClient
      .from('couple_profiles')
      .select('date_marriage, ville_marriage, budget_min, culture')
      .eq('user_id', coupleUserId)
      .single()

    const missingItems: string[] = []
    if (!coupleProfile?.date_marriage) missingItems.push('Date de votre mariage')
    if (!coupleProfile?.ville_marriage) missingItems.push('Lieu de votre mariage')
    if (!coupleProfile?.budget_min) missingItems.push('Votre budget')

    const subjects = {
      1: `${profile?.prenom || 'Bonjour'}, finalisez votre profil !`,
      2: `Rappel : Complétez votre profil Nuply`,
      3: `Dernier rappel : Trouvez vos prestataires de mariage !`,
    }

    const missingList = missingItems.length > 0
      ? `<ul style="margin: 10px 0; padding-left: 20px;">
           ${missingItems.map(item => `<li style="color: #dc2626; margin: 5px 0;">${item}</li>`).join('')}
         </ul>`
      : ''

    const resend = new Resend(resendApiKey)
    const html = generateEmailTemplate({
      title: 'Complétez votre profil',
      greeting: `Bonjour ${profile?.prenom || ''}`,
      content: `
        <p style="font-size: 16px; margin-bottom: 20px;">
          Complétez votre profil pour que les prestataires puissent mieux comprendre votre projet.
        </p>
        ${missingItems.length > 0 ? generateContentBlock(
          `<p style="margin: 0 0 10px 0; font-weight: 600; color: #991b1b;">Informations manquantes :</p>
           ${missingList}`,
          '#ef4444'
        ) : ''}
      `,
      buttonText: 'Compléter mon profil',
      buttonUrl: `${siteUrl}/couple/profil`,
      footer: 'L\'équipe Nuply',
    })

    await resend.emails.send({
      from: `NUPLY <${fromEmail}>`,
      to: email,
      subject: subjects[reminderNumber],
      html,
    })

    await adminClient
      .from('email_logs')
      .insert({
        user_id: coupleUserId,
        email_type: 'couple_incomplete_profile',
        reminder_number: reminderNumber,
        sent_at: new Date().toISOString(),
      })
      .catch(() => {})

    logger.info('Email relance profil couple envoyé', { coupleUserId, reminderNumber })
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    logger.error('Erreur envoi relance profil couple:', error)
    return { success: false, error: message }
  }
}

// ============================================================================
// RELANCE INACTIVITE
// ============================================================================

export async function sendInactivityReminder(
  userId: string,
  role: 'couple' | 'prestataire',
  daysSinceLastActivity: number
) {
  if (!resendApiKey) {
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const adminClient = createAdminClient()

    const email = await getUserEmail(adminClient, userId)
    if (!email) {
      return { success: false, error: 'Email non trouvé' }
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('prenom')
      .eq('id', userId)
      .single()

    const resend = new Resend(resendApiKey)

    const content = role === 'couple'
      ? `<p style="font-size: 16px; margin-bottom: 20px;">
           Cela fait ${daysSinceLastActivity} jours que vous n'avez pas visité Nuply.
           De nouveaux prestataires ont rejoint la plateforme !
         </p>`
      : `<p style="font-size: 16px; margin-bottom: 20px;">
           Cela fait ${daysSinceLastActivity} jours que vous n'avez pas consulté vos demandes.
           Des couples vous attendent peut-être !
         </p>`

    const html = generateEmailTemplate({
      title: 'Vous nous manquez !',
      greeting: `Bonjour ${profile?.prenom || ''}`,
      content,
      buttonText: role === 'couple' ? 'Découvrir les prestataires' : 'Voir mes demandes',
      buttonUrl: role === 'couple'
        ? `${siteUrl}/couple/recherche`
        : `${siteUrl}/prestataire/demandes-recues`,
      footer: 'L\'équipe Nuply',
    })

    await resend.emails.send({
      from: `NUPLY <${fromEmail}>`,
      to: email,
      subject: `${profile?.prenom || 'Bonjour'}, revenez sur Nuply !`,
      html,
    })

    logger.info('Email inactivité envoyé', { userId, role })
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    logger.error('Erreur envoi email inactivité:', error)
    return { success: false, error: message }
  }
}

// ============================================================================
// RAPPEL DEMANDES EN ATTENTE
// ============================================================================

export async function sendPendingRequestsReminder(providerId: string, pendingCount: number) {
  if (!resendApiKey) {
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const adminClient = createAdminClient()

    const email = await getUserEmail(adminClient, providerId)
    if (!email) {
      return { success: false, error: 'Email non trouvé' }
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('prenom')
      .eq('id', providerId)
      .single()

    const resend = new Resend(resendApiKey)

    const html = generateEmailTemplate({
      title: `${pendingCount} demande${pendingCount > 1 ? 's' : ''} en attente`,
      greeting: `Bonjour ${profile?.prenom || ''}`,
      content: `
        <p style="font-size: 16px; margin-bottom: 20px;">
          Vous avez <strong>${pendingCount} demande${pendingCount > 1 ? 's' : ''}</strong> de couples en attente de réponse.
        </p>
        ${generateContentBlock(
          `<p style="margin: 0; color: #b45309; font-weight: 600;">Répondez vite !</p>
           <p style="margin: 10px 0 0 0; color: #92400e;">
             Une réponse rapide augmente vos chances d'être sélectionné.
           </p>`,
          '#f59e0b'
        )}
      `,
      buttonText: 'Voir mes demandes',
      buttonUrl: `${siteUrl}/prestataire/demandes-recues`,
      footer: 'L\'équipe Nuply',
    })

    await resend.emails.send({
      from: `NUPLY <${fromEmail}>`,
      to: email,
      subject: `${pendingCount} demande${pendingCount > 1 ? 's' : ''} attendent votre réponse !`,
      html,
    })

    logger.info('Email rappel demandes envoyé', { providerId, pendingCount })
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    logger.error('Erreur envoi rappel demandes:', error)
    return { success: false, error: message }
  }
}

// ============================================================================
// EMAIL ONBOARDING COMPLETE
// ============================================================================

export async function sendOnboardingCompleteEmail(
  userId: string,
  role: 'couple' | 'prestataire'
) {
  if (!resendApiKey) {
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const adminClient = createAdminClient()

    const email = await getUserEmail(adminClient, userId)
    if (!email) {
      return { success: false, error: 'Email non trouvé' }
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('prenom')
      .eq('id', userId)
      .single()

    const resend = new Resend(resendApiKey)

    const content = role === 'couple'
      ? `<p style="font-size: 16px; margin-bottom: 20px;">
           Votre profil est maintenant complet ! Vous pouvez commencer à rechercher
           des prestataires qui correspondent à votre projet de mariage.
         </p>`
      : `<p style="font-size: 16px; margin-bottom: 20px;">
           Votre profil prestataire est maintenant visible par les couples !
         </p>`

    const html = generateEmailTemplate({
      title: 'Profil complété !',
      greeting: `Félicitations ${profile?.prenom || ''} !`,
      content,
      buttonText: role === 'couple' ? 'Rechercher des prestataires' : 'Voir mon profil',
      buttonUrl: role === 'couple'
        ? `${siteUrl}/couple/recherche`
        : `${siteUrl}/prestataire/profil`,
      footer: 'L\'équipe Nuply',
    })

    await resend.emails.send({
      from: `NUPLY <${fromEmail}>`,
      to: email,
      subject: `${profile?.prenom || ''}, votre profil Nuply est prêt !`,
      html,
    })

    logger.info('Email onboarding complete envoyé', { userId, role })
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    logger.error('Erreur envoi email onboarding:', error)
    return { success: false, error: message }
  }
}
