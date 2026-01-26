import { Resend } from 'resend'
import { logger } from '@/lib/logger'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/**
 * Envoie une alerte lorsqu'un prestataire reçoit une nouvelle demande
 */
export async function sendNewRequestAlertToProvider(
  providerId: string,
  providerEmail: string,
  coupleName: string,
  requestMessage: string,
  requestId: string
) {
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY non configurée - alerte non envoyée')
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const resend = new Resend(resendApiKey)

    const subject = `🎉 Nouvelle demande reçue de ${coupleName}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #823F91 0%, #c081e3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nouvelle demande ! 🎉</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Bonjour,</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Vous avez reçu une nouvelle demande de <strong>${coupleName}</strong> !
            </p>

            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: 600; color: #823F91;">Message :</p>
              <p style="margin: 0; color: #666; font-style: italic;">"${requestMessage.substring(0, 200)}${requestMessage.length > 200 ? '...' : ''}"</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/prestataire/demandes-recues" 
                 style="display: inline-block; padding: 14px 28px; background-color: #823F91; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Voir la demande
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Répondez rapidement pour augmenter vos chances d'être sélectionné !<br><br>
              L'équipe Nuply 💜
            </p>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: fromEmail,
      to: providerEmail,
      subject,
      html,
    })

    logger.info('✅ Alerte nouvelle demande envoyée au prestataire', { providerId, requestId })
    return { success: true }
  } catch (error: any) {
    logger.error('Erreur envoi alerte demande prestataire:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Envoie une alerte lorsqu'un couple reçoit une réponse à sa demande
 */
export async function sendRequestResponseAlertToCouple(
  coupleEmail: string,
  coupleName: string,
  providerName: string,
  status: 'accepted' | 'rejected',
  requestId: string
) {
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY non configurée - alerte non envoyée')
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const resend = new Resend(resendApiKey)

    const isAccepted = status === 'accepted'
    const subject = isAccepted 
      ? `✅ ${providerName} a accepté votre demande !`
      : `❌ ${providerName} a décliné votre demande`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${isAccepted ? '#10b981' : '#ef4444'} 0%, ${isAccepted ? '#34d399' : '#f87171'} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">
              ${isAccepted ? 'Demande acceptée ! ✅' : 'Demande déclinée'}
            </h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Bonjour ${coupleName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>${providerName}</strong> a ${isAccepted ? 'accepté' : 'décliné'} votre demande.
            </p>

            ${isAccepted ? `
              <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <p style="margin: 0; color: #065f46; font-weight: 600;">🎉 Excellente nouvelle !</p>
                <p style="margin: 10px 0 0 0; color: #047857;">
                  Vous pouvez maintenant contacter ${providerName} via la messagerie pour discuter des détails de votre projet.
                </p>
              </div>
            ` : `
              <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <p style="margin: 0; color: #991b1b;">
                  Ne vous découragez pas ! Il y a beaucoup d'autres prestataires qui pourraient correspondre à votre projet.
                </p>
              </div>
            `}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/couple/demandes" 
                 style="display: inline-block; padding: 14px 28px; background-color: #823F91; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Voir mes demandes
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              L'équipe Nuply 💜
            </p>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: fromEmail,
      to: coupleEmail,
      subject,
      html,
    })

    logger.info('✅ Alerte réponse demande envoyée au couple', { coupleEmail, status, requestId })
    return { success: true }
  } catch (error: any) {
    logger.error('Erreur envoi alerte réponse couple:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Envoie une alerte lorsqu'un nouveau message est reçu
 */
export async function sendNewMessageAlert(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  messagePreview: string,
  conversationId: string,
  isCouple: boolean = false
) {
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY non configurée - alerte non envoyée')
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const resend = new Resend(resendApiKey)

    const subject = `💬 Nouveau message de ${senderName}`
    const messageUrl = isCouple 
      ? `${siteUrl}/couple/messagerie/${conversationId}`
      : `${siteUrl}/prestataire/messagerie/${conversationId}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #823F91 0%, #c081e3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nouveau message 💬</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Bonjour ${recipientName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Vous avez reçu un nouveau message de <strong>${senderName}</strong>.
            </p>

            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #823F91;">
              <p style="margin: 0; color: #666; font-style: italic;">"${messagePreview.substring(0, 200)}${messagePreview.length > 200 ? '...' : ''}"</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${messageUrl}" 
                 style="display: inline-block; padding: 14px 28px; background-color: #823F91; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Répondre
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              L'équipe Nuply 💜
            </p>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject,
      html,
    })

    logger.info('✅ Alerte nouveau message envoyée', { recipientEmail, conversationId })
    return { success: true }
  } catch (error: any) {
    logger.error('Erreur envoi alerte message:', error)
    return { success: false, error: error.message }
  }
}
