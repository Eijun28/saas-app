import { Resend } from 'resend'
import { generateEmailTemplate, generateContentBlock, generateMessagePreview } from './templates'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { getErrorMessage } from '@/lib/utils'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@nuply.fr'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Récupère l'email d'un utilisateur via auth.users (source de vérité)
async function getUserEmail(adminClient: ReturnType<typeof createAdminClient>, userId: string): Promise<string | null> {
  try {
    const { data } = await adminClient.auth.admin.getUserById(userId)
    return data?.user?.email ?? null
  } catch {
    return null
  }
}

// Récupère le prénom d'un utilisateur depuis profiles
async function getUserFirstName(adminClient: ReturnType<typeof createAdminClient>, userId: string): Promise<string> {
  const { data } = await adminClient.from('profiles').select('prenom').eq('id', userId).single()
  return data?.prenom ?? ''
}

// Récupère le nom affiché d'un couple (partenaire 1 & 2)
async function getCoupleName(adminClient: ReturnType<typeof createAdminClient>, coupleUserId: string): Promise<string> {
  const { data } = await adminClient
    .from('couples')
    .select('partner_1_name, partner_2_name')
    .eq('user_id', coupleUserId)
    .single()
  if (!data) return 'un couple'
  return data.partner_2_name
    ? `${data.partner_1_name} et ${data.partner_2_name}`
    : data.partner_1_name ?? 'un couple'
}

// Récupère le nom affiché d'un prestataire (nom_entreprise ou prénom+nom)
async function getProviderName(adminClient: ReturnType<typeof createAdminClient>, providerId: string): Promise<string> {
  const { data } = await adminClient
    .from('prestataire_profiles')
    .select('nom_entreprise')
    .eq('user_id', providerId)
    .single()
  if (data?.nom_entreprise) return data.nom_entreprise
  const { data: profile } = await adminClient
    .from('profiles')
    .select('prenom, nom')
    .eq('id', providerId)
    .single()
  return `${profile?.prenom ?? ''} ${profile?.nom ?? ''}`.trim() || 'le prestataire'
}

async function logEmail(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  emailType: string,
  metadata?: Record<string, unknown>
) {
  await adminClient.from('email_logs').insert({
    user_id: userId,
    email_type: emailType,
    sent_at: new Date().toISOString(),
    metadata: metadata ?? {},
  })
}

// ============================================================================
// NOUVELLE DEMANDE → prestataire
// ============================================================================

export async function sendNewRequestEmail(
  providerId: string,
  coupleId: string,
  requestId: string,
  requestMessage?: string
) {
  if (!resendApiKey) return { success: false, error: 'RESEND_API_KEY non configurée' }

  try {
    const adminClient = createAdminClient()

    const [email, prenom, coupleName] = await Promise.all([
      getUserEmail(adminClient, providerId),
      getUserFirstName(adminClient, providerId),
      getCoupleName(adminClient, coupleId),
    ])

    if (!email) {
      logger.warn('sendNewRequestEmail: email prestataire introuvable', { providerId })
      return { success: false, error: 'Email prestataire introuvable' }
    }

    const messageBlock = requestMessage
      ? generateContentBlock(
          `<p style="margin: 0 0 10px 0; font-weight: 600; color: #823F91;">Message :</p>
           ${generateMessagePreview(requestMessage)}`,
          '#823F91'
        )
      : ''

    const html = generateEmailTemplate({
      title: 'Nouvelle demande !',
      greeting: `Bonjour ${prenom}`,
      content: `
        <p style="font-size: 16px; margin-bottom: 20px;">
          Vous avez reçu une nouvelle demande de <strong>${coupleName}</strong> !
        </p>
        ${messageBlock}
        <p style="font-size: 16px; margin-bottom: 20px;">
          Répondez rapidement pour augmenter vos chances d'être sélectionné !
        </p>
      `,
      buttonText: 'Voir la demande',
      buttonUrl: `${siteUrl}/prestataire/demandes-recues`,
      footer: "Répondez rapidement pour augmenter vos chances d'être sélectionné !<br><br>L'équipe Nuply",
    })

    const resend = new Resend(resendApiKey)
    await resend.emails.send({
      from: `NUPLY <${fromEmail}>`,
      to: email,
      subject: `Nouvelle demande reçue de ${coupleName}`,
      html,
    })

    await logEmail(adminClient, providerId, 'new_request', { requestId, coupleId })

    logger.info('Email nouvelle demande envoyé', { providerId, requestId })
    return { success: true }
  } catch (error) {
    logger.error('Erreur sendNewRequestEmail:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}

// ============================================================================
// DEMANDE ACCEPTÉE → couple
// ============================================================================

export async function sendRequestAcceptedEmail(
  coupleId: string,
  providerId: string,
  requestId: string
) {
  if (!resendApiKey) return { success: false, error: 'RESEND_API_KEY non configurée' }

  try {
    const adminClient = createAdminClient()

    const [email, coupleName, providerName] = await Promise.all([
      getUserEmail(adminClient, coupleId),
      getCoupleName(adminClient, coupleId),
      getProviderName(adminClient, providerId),
    ])

    if (!email) {
      logger.warn('sendRequestAcceptedEmail: email couple introuvable', { coupleId })
      return { success: false, error: 'Email couple introuvable' }
    }

    const html = generateEmailTemplate({
      title: 'Demande acceptée !',
      greeting: `Bonjour ${coupleName}`,
      content: `
        <p style="font-size: 16px; margin-bottom: 20px;">
          <strong>${providerName}</strong> a accepté votre demande.
        </p>
        ${generateContentBlock(
          `<p style="margin: 0; color: #065f46; font-weight: 600;">Excellente nouvelle !</p>
           <p style="margin: 10px 0 0 0; color: #047857;">
             Vous pouvez maintenant contacter ${providerName} via la messagerie pour discuter des détails de votre projet.
           </p>`,
          '#10b981'
        )}
      `,
      buttonText: 'Ouvrir la messagerie',
      buttonUrl: `${siteUrl}/couple/messagerie`,
      footer: "L'équipe Nuply",
    })

    const resend = new Resend(resendApiKey)
    await resend.emails.send({
      from: `NUPLY <${fromEmail}>`,
      to: email,
      subject: `${providerName} a accepté votre demande !`,
      html,
    })

    await logEmail(adminClient, coupleId, 'request_accepted', { requestId, providerId })

    logger.info('Email demande acceptée envoyé', { coupleId, requestId })
    return { success: true }
  } catch (error) {
    logger.error('Erreur sendRequestAcceptedEmail:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}

// ============================================================================
// DEMANDE REFUSÉE → couple
// ============================================================================

export async function sendRequestRejectedEmail(
  coupleId: string,
  providerId: string,
  requestId: string
) {
  if (!resendApiKey) return { success: false, error: 'RESEND_API_KEY non configurée' }

  try {
    const adminClient = createAdminClient()

    const [email, coupleName, providerName] = await Promise.all([
      getUserEmail(adminClient, coupleId),
      getCoupleName(adminClient, coupleId),
      getProviderName(adminClient, providerId),
    ])

    if (!email) {
      logger.warn('sendRequestRejectedEmail: email couple introuvable', { coupleId })
      return { success: false, error: 'Email couple introuvable' }
    }

    const html = generateEmailTemplate({
      title: 'Demande déclinée',
      greeting: `Bonjour ${coupleName}`,
      content: `
        <p style="font-size: 16px; margin-bottom: 20px;">
          <strong>${providerName}</strong> a décliné votre demande.
        </p>
        ${generateContentBlock(
          `<p style="margin: 0; color: #991b1b;">
             Ne vous découragez pas ! Il y a beaucoup d'autres prestataires qui pourraient correspondre à votre projet.
           </p>`,
          '#ef4444'
        )}
      `,
      buttonText: 'Voir mes demandes',
      buttonUrl: `${siteUrl}/couple/demandes`,
      footer: "L'équipe Nuply",
    })

    const resend = new Resend(resendApiKey)
    await resend.emails.send({
      from: `NUPLY <${fromEmail}>`,
      to: email,
      subject: `${providerName} a décliné votre demande`,
      html,
    })

    await logEmail(adminClient, coupleId, 'request_rejected', { requestId, providerId })

    logger.info('Email demande refusée envoyé', { coupleId, requestId })
    return { success: true }
  } catch (error) {
    logger.error('Erreur sendRequestRejectedEmail:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}

// ============================================================================
// NOUVEAU MESSAGE → destinataire (couple ou prestataire)
// ============================================================================

export async function sendNewMessageEmail(
  recipientId: string,
  senderId: string,
  conversationId: string,
  messagePreview: string,
  isRecipientCouple: boolean
) {
  if (!resendApiKey) return { success: false, error: 'RESEND_API_KEY non configurée' }

  try {
    const adminClient = createAdminClient()

    const [recipientEmail, senderName] = await Promise.all([
      getUserEmail(adminClient, recipientId),
      isRecipientCouple
        ? getProviderName(adminClient, senderId)
        : getCoupleName(adminClient, senderId),
    ])

    if (!recipientEmail) {
      logger.warn('sendNewMessageEmail: email destinataire introuvable', { recipientId })
      return { success: false, error: 'Email destinataire introuvable' }
    }

    const recipientName = isRecipientCouple
      ? await getCoupleName(adminClient, recipientId)
      : await getUserFirstName(adminClient, recipientId)

    const messageUrl = isRecipientCouple
      ? `${siteUrl}/couple/messagerie/${conversationId}`
      : `${siteUrl}/prestataire/messagerie/${conversationId}`

    const html = generateEmailTemplate({
      title: 'Nouveau message',
      greeting: `Bonjour ${recipientName}`,
      content: `
        <p style="font-size: 16px; margin-bottom: 20px;">
          Vous avez reçu un nouveau message de <strong>${senderName}</strong>.
        </p>
        ${generateContentBlock(generateMessagePreview(messagePreview), '#823F91')}
      `,
      buttonText: 'Répondre',
      buttonUrl: messageUrl,
      footer: "L'équipe Nuply",
    })

    const resend = new Resend(resendApiKey)
    await resend.emails.send({
      from: `NUPLY <${fromEmail}>`,
      to: recipientEmail,
      subject: `Nouveau message de ${senderName}`,
      html,
    })

    await logEmail(adminClient, recipientId, 'new_message', { conversationId, senderId })

    logger.info('Email nouveau message envoyé', { recipientId, conversationId })
    return { success: true }
  } catch (error) {
    logger.error('Erreur sendNewMessageEmail:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}

// ============================================================================
// NOUVEAU DEVIS → couple
// ============================================================================

export async function sendNewDevisEmail(
  coupleId: string,
  providerId: string,
  devisId: string,
  amount?: number
) {
  if (!resendApiKey) return { success: false, error: 'RESEND_API_KEY non configurée' }

  try {
    const adminClient = createAdminClient()

    const [email, coupleName, providerName] = await Promise.all([
      getUserEmail(adminClient, coupleId),
      getCoupleName(adminClient, coupleId),
      getProviderName(adminClient, providerId),
    ])

    if (!email) {
      logger.warn('sendNewDevisEmail: email couple introuvable', { coupleId })
      return { success: false, error: 'Email couple introuvable' }
    }

    const amountContent = amount
      ? `<p style="margin: 10px 0 0 0; color: #047857; font-size: 18px; font-weight: 600;">
           Montant : ${amount.toLocaleString('fr-FR')} €
         </p>`
      : ''

    const html = generateEmailTemplate({
      title: 'Nouveau devis reçu',
      greeting: `Bonjour ${coupleName}`,
      content: `
        <p style="font-size: 16px; margin-bottom: 20px;">
          Vous avez reçu un nouveau devis de <strong>${providerName}</strong>.
        </p>
        ${generateContentBlock(
          `<p style="margin: 0; color: #065f46; font-weight: 600;">Nouveau devis disponible</p>
           ${amountContent}
           <p style="margin: 10px 0 0 0; color: #047857;">
             Consultez les détails et répondez au prestataire pour finaliser votre projet.
           </p>`,
          '#10b981'
        )}
      `,
      buttonText: 'Voir le devis',
      buttonUrl: `${siteUrl}/couple/demandes`,
      footer: "L'équipe Nuply",
    })

    const resend = new Resend(resendApiKey)
    await resend.emails.send({
      from: `NUPLY <${fromEmail}>`,
      to: email,
      subject: `Nouveau devis reçu de ${providerName}`,
      html,
    })

    await logEmail(adminClient, coupleId, 'new_devis', { devisId, providerId, amount })

    logger.info('Email nouveau devis envoyé', { coupleId, devisId })
    return { success: true }
  } catch (error) {
    logger.error('Erreur sendNewDevisEmail:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}
