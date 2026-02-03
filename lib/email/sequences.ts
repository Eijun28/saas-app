/**
 * Séquences d'emails automatiques pour Nuply
 * - Relances profils incomplets (prestataires et couples)
 * - Emails d'onboarding
 * - Rappels d'inactivité
 */

import { Resend } from 'resend'
import { generateEmailTemplate, generateContentBlock } from './templates'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@nuply.fr'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// ============================================================================
// RELANCES PROFILS INCOMPLETS - PRESTATAIRES
// ============================================================================

/**
 * Envoie un email de relance aux prestataires avec profil incomplet
 * Séquence: J+1, J+3, J+7
 */
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

    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, email, prenom, nom')
      .eq('id', providerId)
      .single()

    if (!profile?.email) {
      return { success: false, error: 'Email non trouvé' }
    }

    const { data: prestataireProfile } = await adminClient
      .from('prestataire_profiles')
      .select('nom_entreprise, type_prestation, description, photos')
      .eq('user_id', providerId)
      .single()

    // Déterminer ce qui manque
    const missingItems: string[] = []
    if (!prestataireProfile?.nom_entreprise) missingItems.push('Nom de votre entreprise')
    if (!prestataireProfile?.type_prestation) missingItems.push('Type de prestation')
    if (!prestataireProfile?.description) missingItems.push('Description de vos services')
    if (!prestataireProfile?.photos?.length) missingItems.push('Photos de vos réalisations')

    const subjects = {
      1: `${profile.prenom}, finalisez votre profil Nuply !`,
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
      greeting: `Bonjour ${profile.prenom || 'cher prestataire'}`,
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
      footer: 'L\'équipe Nuply 💜',
    })

    await resend.emails.send({
      from: `NUPLY <${fromEmail}>`,
      to: profile.email,
      subject: subjects[reminderNumber],
      html,
    })

    // Marquer l'email comme envoyé
    await adminClient
      .from('email_logs')
      .insert({
        user_id: providerId,
        email_type: 'provider_incomplete_profile',
        reminder_number: reminderNumber,
        sent_at: new Date().toISOString(),
      })

    logger.info('Email relance profil envoyé', { providerId, reminderNumber })
    return { success: true }
  } catch (error: any) {
    logger.error('Erreur envoi relance profil prestataire:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// RELANCES PROFILS INCOMPLETS - COUPLES
// ============================================================================

/**
 * Envoie un email de relance aux couples avec profil incomplet
 */
export async function sendCoupleIncompleteProfileReminder(
  coupleUserId: string,
  reminderNumber: 1 | 2 | 3
) {
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY non configurée')
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const adminClient = createAdminClient()

    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, email, prenom')
      .eq('id', coupleUserId)
      .single()

    if (!profile?.email) {
      return { success: false, error: 'Email non trouvé' }
    }

    const { data: coupleProfile } = await adminClient
      .from('couple_profiles')
      .select('date_marriage, ville_marriage, budget_min, culture')
      .eq('user_id', coupleUserId)
      .single()

    const missingItems: string[] = []
    if (!coupleProfile?.date_marriage) missingItems.push('Date de votre mariage')
    if (!coupleProfile?.ville_marriage) missingItems.push('Lieu de votre mariage')
    if (!coupleProfile?.budget_min) missingItems.push('Votre budget')
    if (!coupleProfile?.culture) missingItems.push('Vos cultures')

    const subjects = {
      1: `${profile.prenom}, finalisez votre profil pour trouver vos prestataires !`,
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
      greeting: `Bonjour ${profile.prenom || ''}`,
      content: `
        <p style="font-size: 16px; margin-bottom: 20px;">
          Complétez votre profil pour que les prestataires puissent mieux comprendre votre projet de mariage.
        </p>
        ${missingItems.length > 0 ? generateContentBlock(
          `<p style="margin: 0 0 10px 0; font-weight: 600; color: #991b1b;">Informations manquantes :</p>
           ${missingList}`,
          '#ef4444'
        ) : ''}
      `,
      buttonText: 'Compléter mon profil',
      buttonUrl: `${siteUrl}/couple/profil`,
      footer: 'L\'équipe Nuply 💜',
    })

    await resend.emails.send({
      from: `NUPLY <${fromEmail}>`,
      to: profile.email,
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

    logger.info('Email relance profil couple envoyé', { coupleUserId, reminderNumber })
    return { success: true }
  } catch (error: any) {
    logger.error('Erreur envoi relance profil couple:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// RELANCE INACTIVITE
// ============================================================================

/**
 * Envoie un email aux utilisateurs inactifs depuis X jours
 */
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

    const { data: profile } = await adminClient
      .from('profiles')
      .select('email, prenom')
      .eq('id', userId)
      .single()

    if (!profile?.email) {
      return { success: false, error: 'Email non trouvé' }
    }

    const resend = new Resend(resendApiKey)

    const content = role === 'couple'
      ? `<p style="font-size: 16px; margin-bottom: 20px;">
           Cela fait ${daysSinceLastActivity} jours que vous n'avez pas visité Nuply.
           De nouveaux prestataires ont rejoint la plateforme et pourraient correspondre à votre projet !
         </p>`
      : `<p style="font-size: 16px; margin-bottom: 20px;">
           Cela fait ${daysSinceLastActivity} jours que vous n'avez pas consulté vos demandes.
           Des couples vous attendent peut-être !
         </p>`

    const html = generateEmailTemplate({
      title: 'Vous nous manquez !',
      greeting: `Bonjour ${profile.prenom || ''}`,
      content,
      buttonText: role === 'couple' ? 'Découvrir les prestataires' : 'Voir mes demandes',
      buttonUrl: role === 'couple'
        ? `${siteUrl}/couple/recherche`
        : `${siteUrl}/prestataire/demandes-recues`,
      footer: 'L\'équipe Nuply 💜',
    })

    await resend.emails.send({
      from: `NUPLY <${fromEmail}>`,
      to: profile.email,
      subject: `${profile.prenom}, revenez sur Nuply !`,
      html,
    })

    logger.info('Email inactivité envoyé', { userId, role })
    return { success: true }
  } catch (error: any) {
    logger.error('Erreur envoi email inactivité:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// RAPPEL DEMANDE EN ATTENTE (pour prestataires)
// ============================================================================

/**
 * Rappelle aux prestataires qu'ils ont des demandes en attente
 */
export async function sendPendingRequestsReminder(providerId: string, pendingCount: number) {
  if (!resendApiKey) {
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const adminClient = createAdminClient()

    const { data: profile } = await adminClient
      .from('profiles')
      .select('email, prenom')
      .eq('id', providerId)
      .single()

    if (!profile?.email) {
      return { success: false, error: 'Email non trouvé' }
    }

    const resend = new Resend(resendApiKey)

    const html = generateEmailTemplate({
      title: `${pendingCount} demande${pendingCount > 1 ? 's' : ''} en attente`,
      greeting: `Bonjour ${profile.prenom || ''}`,
      content: `
        <p style="font-size: 16px; margin-bottom: 20px;">
          Vous avez <strong>${pendingCount} demande${pendingCount > 1 ? 's' : ''}</strong> de couples en attente de réponse.
        </p>
        ${generateContentBlock(
          `<p style="margin: 0; color: #b45309; font-weight: 600;">⏰ Répondez vite !</p>
           <p style="margin: 10px 0 0 0; color: #92400e;">
             Les couples attendent votre réponse. Une réponse rapide augmente vos chances d'être sélectionné.
           </p>`,
          '#f59e0b'
        )}
      `,
      buttonText: 'Voir mes demandes',
      buttonUrl: `${siteUrl}/prestataire/demandes-recues`,
      footer: 'L\'équipe Nuply 💜',
    })

    await resend.emails.send({
      from: `NUPLY <${fromEmail}>`,
      to: profile.email,
      subject: `${pendingCount} demande${pendingCount > 1 ? 's' : ''} attendent votre réponse !`,
      html,
    })

    logger.info('Email rappel demandes envoyé', { providerId, pendingCount })
    return { success: true }
  } catch (error: any) {
    logger.error('Erreur envoi rappel demandes:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// EMAIL DE BIENVENUE POST-ONBOARDING
// ============================================================================

/**
 * Email envoyé après complétion de l'onboarding
 */
export async function sendOnboardingCompleteEmail(
  userId: string,
  role: 'couple' | 'prestataire'
) {
  if (!resendApiKey) {
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const adminClient = createAdminClient()

    const { data: profile } = await adminClient
      .from('profiles')
      .select('email, prenom')
      .eq('id', userId)
      .single()

    if (!profile?.email) {
      return { success: false, error: 'Email non trouvé' }
    }

    const resend = new Resend(resendApiKey)

    const content = role === 'couple'
      ? `<p style="font-size: 16px; margin-bottom: 20px;">
           Votre profil est maintenant complet ! Vous pouvez commencer à rechercher
           des prestataires qui correspondent à votre projet de mariage multiculturel.
         </p>
         ${generateContentBlock(
           `<p style="margin: 0; color: #065f46; font-weight: 600;">🎯 Prochaine étape</p>
            <p style="margin: 10px 0 0 0; color: #047857;">
              Explorez notre catalogue de prestataires et envoyez vos premières demandes !
            </p>`,
           '#10b981'
         )}`
      : `<p style="font-size: 16px; margin-bottom: 20px;">
           Votre profil prestataire est maintenant visible par les couples !
           Assurez-vous d'avoir ajouté des photos et une description attractive.
         </p>
         ${generateContentBlock(
           `<p style="margin: 0; color: #065f46; font-weight: 600;">💡 Conseils</p>
            <p style="margin: 10px 0 0 0; color: #047857;">
              Ajoutez des photos de vos réalisations et répondez rapidement aux demandes pour maximiser vos chances.
            </p>`,
           '#10b981'
         )}`

    const html = generateEmailTemplate({
      title: 'Profil complété ! 🎉',
      greeting: `Félicitations ${profile.prenom || ''} !`,
      content,
      buttonText: role === 'couple' ? 'Rechercher des prestataires' : 'Voir mon profil',
      buttonUrl: role === 'couple'
        ? `${siteUrl}/couple/recherche`
        : `${siteUrl}/prestataire/profil`,
      footer: 'L\'équipe Nuply 💜',
    })

    await resend.emails.send({
      from: `NUPLY <${fromEmail}>`,
      to: profile.email,
      subject: `${profile.prenom}, votre profil Nuply est prêt ! 🎉`,
      html,
    })

    logger.info('Email onboarding complete envoyé', { userId, role })
    return { success: true }
  } catch (error: any) {
    logger.error('Erreur envoi email onboarding:', error)
    return { success: false, error: error.message }
  }
}
