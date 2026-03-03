import { Resend } from 'resend'
import { generateEmailTemplate, generateContentBlock, generateMessagePreview } from './templates'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { getErrorMessage } from '@/lib/utils'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@nuply.fr'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/**
 * Envoie un email au prestataire lorsqu'il reçoit une nouvelle demande
 */
export async function sendNewRequestEmail(
  providerId: string,
  coupleId: string,
  requestId: string,
  requestMessage?: string
) {
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY non configurée - email non envoyé')
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const adminClient = createAdminClient()

    // Récupérer les informations du prestataire
    const { data: provider } = await adminClient
      .from('profiles')
      .select('id, prenom, nom, email')
      .eq('id', providerId)
      .single()

    if (!provider || !provider.email) {
      logger.warn('Prestataire non trouvé ou email manquant', { providerId })
      return { success: false, error: 'Prestataire non trouvé' }
    }

    // Récupérer les informations du couple
    const { data: couple } = await adminClient
      .from('couples')
      .select('partner_1_name, partner_2_name')
      .eq('user_id', coupleId)
      .single()

    const coupleName = couple
      ? `${couple.partner_1_name}${couple.partner_2_name ? ` et ${couple.partner_2_name}` : ''}`
      : 'un couple'

    const resend = new Resend(resendApiKey)
    const subject = `🎉 Nouvelle demande reçue de ${coupleName}`

    const messageContent = requestMessage
      ? generateContentBlock(
          `<p style="margin: 0 0 10px 0; font-weight: 600; color: #823F91;">Message :</p>
           ${generateMessagePreview(requestMessage)}`,
          '#823F91'
        )
      : ''

    const html = generateEmailTemplate({
      title: 'Nouvelle demande ! 🎉',
      greeting: `Bonjour ${provider.prenom || ''}`,
      content: `
        <p style="font-size: 16px; margin-bottom: 20px;">
          Vous avez reçu une nouvelle demande de <strong>${coupleName}</strong> !
        </p>
        ${messageContent}
        <p style="font-size: 16px; margin-bottom: 20px;">
          Répondez rapidement pour augmenter vos chances d'être sélectionné !
        </p>
      `,
      buttonText: 'Voir la demande',
      buttonUrl: `${siteUrl}/prestataire/demandes-recues`,
      footer: 'Répondez rapidement pour augmenter vos chances d\'être sélectionné !<br><br>L\'équipe Nuply 💜',
    })

    await resend.emails.send({
      from: fromEmail,
      to: provider.email,
      subject,
      html,
    })

    // Log l'email envoyé
    await adminClient.from('email_logs').insert({
      user_id: providerId,
      email_type: 'new_request',
      metadata: { requestId, coupleId }
    })

    logger.info('✅ Email nouvelle demande envoyé au prestataire', { providerId, requestId })
    return { success: true }
  } catch (error: unknown) {
    logger.error('Erreur envoi email nouvelle demande:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Envoie un email au couple lorsque sa demande est acceptée
 */
export async function sendRequestAcceptedEmail(
  coupleId: string,
  providerId: string,
  requestId: string
) {
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY non configurée - email non envoyé')
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const adminClient = createAdminClient()

    // Récupérer les informations du couple
    const { data: couple } = await adminClient
      .from('couples')
      .select('email, partner_1_name, partner_2_name')
      .eq('user_id', coupleId)
      .single()

    if (!couple || !couple.email) {
      logger.warn('Couple non trouvé ou email manquant', { coupleId })
      return { success: false, error: 'Couple non trouvé' }
    }

    // Récupérer les informations du prestataire
    const { data: provider } = await adminClient
      .from('profiles')
      .select('nom_entreprise, prenom, nom')
      .eq('id', providerId)
      .single()

    const providerName = provider?.nom_entreprise || `${provider?.prenom || ''} ${provider?.nom || ''}`.trim() || 'le prestataire'
    const coupleName = `${couple.partner_1_name}${couple.partner_2_name ? ` et ${couple.partner_2_name}` : ''}`

    const resend = new Resend(resendApiKey)
    const subject = `✅ ${providerName} a accepté votre demande !`

    const html = generateEmailTemplate({
      title: 'Demande acceptée ! ✅',
      greeting: `Bonjour ${coupleName}`,
      content: `
        <p style="font-size: 16px; margin-bottom: 20px;">
          <strong>${providerName}</strong> a accepté votre demande.
        </p>
        ${generateContentBlock(
          `<p style="margin: 0; color: #065f46; font-weight: 600;">🎉 Excellente nouvelle !</p>
           <p style="margin: 10px 0 0 0; color: #047857;">
             Vous pouvez maintenant contacter ${providerName} via la messagerie pour discuter des détails de votre projet.
           </p>`,
          '#10b981'
        )}
      `,
      buttonText: 'Ouvrir la messagerie',
      buttonUrl: `${siteUrl}/couple/messagerie`,
      footer: 'L\'équipe Nuply 💜',
    })

    await resend.emails.send({
      from: fromEmail,
      to: couple.email,
      subject,
      html,
    })

    logger.info('✅ Email demande acceptée envoyé au couple', { coupleId, requestId })
    return { success: true }
  } catch (error: unknown) {
    logger.error('Erreur envoi email demande acceptée:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Envoie un email au couple lorsque sa demande est refusée
 */
export async function sendRequestRejectedEmail(
  coupleId: string,
  providerId: string,
  requestId: string
) {
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY non configurée - email non envoyé')
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const adminClient = createAdminClient()

    // Récupérer les informations du couple
    const { data: couple } = await adminClient
      .from('couples')
      .select('email, partner_1_name, partner_2_name')
      .eq('user_id', coupleId)
      .single()

    if (!couple || !couple.email) {
      logger.warn('Couple non trouvé ou email manquant', { coupleId })
      return { success: false, error: 'Couple non trouvé' }
    }

    // Récupérer les informations du prestataire
    const { data: provider } = await adminClient
      .from('profiles')
      .select('nom_entreprise, prenom, nom')
      .eq('id', providerId)
      .single()

    const providerName = provider?.nom_entreprise || `${provider?.prenom || ''} ${provider?.nom || ''}`.trim() || 'le prestataire'
    const coupleName = `${couple.partner_1_name}${couple.partner_2_name ? ` et ${couple.partner_2_name}` : ''}`

    const resend = new Resend(resendApiKey)
    const subject = `❌ ${providerName} a décliné votre demande`

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
      footer: 'L\'équipe Nuply 💜',
    })

    await resend.emails.send({
      from: fromEmail,
      to: couple.email,
      subject,
      html,
    })

    logger.info('✅ Email demande refusée envoyé au couple', { coupleId, requestId })
    return { success: true }
  } catch (error: unknown) {
    logger.error('Erreur envoi email demande refusée:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Envoie un email au destinataire lorsqu'un nouveau message est reçu (si non lu après 5min)
 * Note: Cette fonction doit être appelée via un système de vérification périodique ou un webhook
 */
export async function sendNewMessageEmail(
  recipientId: string,
  senderId: string,
  conversationId: string,
  messagePreview: string,
  isRecipientCouple: boolean
) {
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY non configurée - email non envoyé')
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const adminClient = createAdminClient()

    // Récupérer les informations du destinataire
    let recipient: { email: string; [key: string]: any } | null = null
    
    if (isRecipientCouple) {
      const { data: coupleRecipient } = await adminClient
        .from('couples')
        .select('email, partner_1_name, partner_2_name')
        .eq('user_id', recipientId)
        .single()
      recipient = coupleRecipient
    } else {
      const { data: profileRecipient } = await adminClient
        .from('profiles')
        .select('email, prenom, nom')
        .eq('id', recipientId)
        .single()
      recipient = profileRecipient
    }

    if (!recipient || !recipient.email) {
      logger.warn('Destinataire non trouvé ou email manquant', { recipientId })
      return { success: false, error: 'Destinataire non trouvé' }
    }

    // Récupérer les informations de l'expéditeur
    let senderName: string
    
    if (isRecipientCouple) {
      // L'expéditeur est un prestataire
      const { data: sender } = await adminClient
        .from('profiles')
        .select('nom_entreprise, prenom, nom')
        .eq('id', senderId)
        .single()
      
      senderName = sender?.nom_entreprise || `${sender?.prenom || ''} ${sender?.nom || ''}`.trim() || 'le prestataire'
    } else {
      // L'expéditeur est un couple
      const { data: sender } = await adminClient
        .from('couples')
        .select('partner_1_name, partner_2_name')
        .eq('user_id', senderId)
        .single()
      
      senderName = sender ? `${sender.partner_1_name}${sender.partner_2_name ? ` et ${sender.partner_2_name}` : ''}` : 'un couple'
    }

    const recipientName = isRecipientCouple
      ? `${(recipient as any).partner_1_name || ''}${(recipient as any).partner_2_name ? ` et ${(recipient as any).partner_2_name}` : ''}`
      : ((recipient as any).prenom || '')

    const resend = new Resend(resendApiKey)
    const subject = `💬 Nouveau message de ${senderName}`

    const messageUrl = isRecipientCouple
      ? `${siteUrl}/couple/messagerie/${conversationId}`
      : `${siteUrl}/prestataire/messagerie/${conversationId}`

    const html = generateEmailTemplate({
      title: 'Nouveau message 💬',
      greeting: `Bonjour ${recipientName}`,
      content: `
        <p style="font-size: 16px; margin-bottom: 20px;">
          Vous avez reçu un nouveau message de <strong>${senderName}</strong>.
        </p>
        ${generateContentBlock(
          generateMessagePreview(messagePreview),
          '#823F91'
        )}
      `,
      buttonText: 'Répondre',
      buttonUrl: messageUrl,
      footer: 'L\'équipe Nuply 💜',
    })

    await resend.emails.send({
      from: fromEmail,
      to: recipient.email,
      subject,
      html,
    })

    logger.info('✅ Email nouveau message envoyé', { recipientId, conversationId })
    return { success: true }
  } catch (error: unknown) {
    logger.error('Erreur envoi email nouveau message:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Envoie un email au couple lorsqu'un nouveau devis est reçu
 */
export async function sendNewDevisEmail(
  coupleId: string,
  providerId: string,
  devisId: string,
  amount?: number
) {
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY non configurée - email non envoyé')
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const adminClient = createAdminClient()

    // Récupérer les informations du couple
    const { data: couple } = await adminClient
      .from('couples')
      .select('email, partner_1_name, partner_2_name')
      .eq('user_id', coupleId)
      .single()

    if (!couple || !couple.email) {
      logger.warn('Couple non trouvé ou email manquant', { coupleId })
      return { success: false, error: 'Couple non trouvé' }
    }

    // Récupérer les informations du prestataire
    const { data: provider } = await adminClient
      .from('profiles')
      .select('nom_entreprise, prenom, nom')
      .eq('id', providerId)
      .single()

    const providerName = provider?.nom_entreprise || `${provider?.prenom || ''} ${provider?.nom || ''}`.trim() || 'le prestataire'
    const coupleName = `${couple.partner_1_name}${couple.partner_2_name ? ` et ${couple.partner_2_name}` : ''}`

    const resend = new Resend(resendApiKey)
    const subject = `💰 Nouveau devis reçu de ${providerName}`

    const amountContent = amount
      ? `<p style="margin: 10px 0 0 0; color: #047857; font-size: 18px; font-weight: 600;">
           Montant : ${amount.toLocaleString('fr-FR')} €
         </p>`
      : ''

    const html = generateEmailTemplate({
      title: 'Nouveau devis reçu 💰',
      greeting: `Bonjour ${coupleName}`,
      content: `
        <p style="font-size: 16px; margin-bottom: 20px;">
          Vous avez reçu un nouveau devis de <strong>${providerName}</strong>.
        </p>
        ${generateContentBlock(
          `<p style="margin: 0; color: #065f46; font-weight: 600;">📋 Nouveau devis disponible</p>
           ${amountContent}
           <p style="margin: 10px 0 0 0; color: #047857;">
             Consultez les détails et répondez au prestataire pour finaliser votre projet.
           </p>`,
          '#10b981'
        )}
      `,
      buttonText: 'Voir le devis',
      buttonUrl: `${siteUrl}/couple/demandes`,
      footer: 'L\'équipe Nuply 💜',
    })

    await resend.emails.send({
      from: fromEmail,
      to: couple.email,
      subject,
      html,
    })

    logger.info('✅ Email nouveau devis envoyé au couple', { coupleId, devisId })
    return { success: true }
  } catch (error: unknown) {
    logger.error('Erreur envoi email nouveau devis:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Envoie un email au couple lorsque le prestataire répond à son avis
 */
export async function sendReviewResponseEmail(
  coupleId: string,
  providerId: string,
  reviewId: string,
  providerResponse: string
) {
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY non configurée - email non envoyé')
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const adminClient = createAdminClient()

    // Récupérer l'email du couple via profiles
    const { data: coupleProfile } = await adminClient
      .from('profiles')
      .select('id, prenom, nom, email')
      .eq('id', coupleId)
      .single()

    if (!coupleProfile || !coupleProfile.email) {
      logger.warn('Couple non trouvé ou email manquant', { coupleId })
      return { success: false, error: 'Couple non trouvé' }
    }

    // Récupérer le nom du prestataire
    const { data: provider } = await adminClient
      .from('profiles')
      .select('prenom, nom')
      .eq('id', providerId)
      .single()

    const providerName = provider
      ? `${provider.prenom || ''} ${provider.nom || ''}`.trim() || 'Le prestataire'
      : 'Le prestataire'

    const coupleName = coupleProfile.prenom || 'Bonjour'

    const resend = new Resend(resendApiKey)
    const subject = `💬 ${providerName} a répondu à votre avis`

    const html = generateEmailTemplate({
      title: 'Réponse à votre avis',
      greeting: `Bonjour ${coupleName}`,
      content: `
        <p style="font-size: 16px; margin-bottom: 20px;">
          <strong>${providerName}</strong> a répondu à l'avis que vous avez laissé.
        </p>
        ${generateContentBlock(
          `<p style="margin: 0; color: #6D3478; font-weight: 600;">Leur réponse :</p>
           ${generateMessagePreview(providerResponse)}`,
          '#823F91'
        )}
      `,
      buttonText: 'Voir le profil',
      buttonUrl: `${siteUrl}/couple/recherche`,
      footer: "Merci d'utiliser Nuply !<br><br>L'équipe Nuply 💜",
      hideUnsubscribe: true,
    })

    await resend.emails.send({
      from: fromEmail,
      to: coupleProfile.email,
      subject,
      html,
    })

    logger.info('✅ Email réponse avis envoyé au couple', { coupleId, reviewId })
    return { success: true }
  } catch (error: unknown) {
    logger.error('Erreur envoi email réponse avis:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}
