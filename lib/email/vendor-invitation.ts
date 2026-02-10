/**
 * Email d'invitation prestataire - Optimisé pour la délivrabilité
 *
 * Bonnes pratiques anti-spam appliquées :
 * - Header List-Unsubscribe (RFC 8058)
 * - Ratio texte/HTML correct
 * - Pas de mots déclencheurs de spam
 * - From: avec nom d'expéditeur clair
 * - Reply-To fonctionnel
 * - Contenu transactionnel (invitation, pas marketing)
 */

import { Resend } from 'resend'
import { generateEmailTemplate, generateContentBlock, escapeHtml } from './templates'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { getServiceTypeLabel } from '@/lib/constants/service-types'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@nuply.fr'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

interface SendVendorInvitationEmailParams {
  recipientEmail: string
  recipientPrenom?: string
  nomEntreprise?: string
  serviceType?: string
  invitationToken: string
  invitedByName?: string
  personalMessage?: string
}

export async function sendVendorInvitationEmail(params: SendVendorInvitationEmailParams) {
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY non configurée - email non envoyé')
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  const {
    recipientEmail,
    recipientPrenom,
    nomEntreprise,
    serviceType,
    invitationToken,
    invitedByName,
    personalMessage,
  } = params

  try {
    const resend = new Resend(resendApiKey)
    const invitationUrl = `${siteUrl}/rejoindre/${invitationToken}`

    const greeting = recipientPrenom
      ? `Bonjour ${escapeHtml(recipientPrenom)}`
      : 'Bonjour'

    const serviceLabel = serviceType ? getServiceTypeLabel(serviceType) : null

    // Construire le contenu de l'email
    let contentParts: string[] = []

    if (invitedByName) {
      contentParts.push(`
        <p style="font-size: 16px; margin-bottom: 20px;">
          <strong>${escapeHtml(invitedByName)}</strong> vous invite à rejoindre Nuply,
          la plateforme qui connecte les couples avec les meilleurs prestataires de mariage.
        </p>
      `)
    } else {
      contentParts.push(`
        <p style="font-size: 16px; margin-bottom: 20px;">
          Vous êtes invité(e) à rejoindre Nuply,
          la plateforme qui connecte les couples avec les meilleurs prestataires de mariage.
        </p>
      `)
    }

    // Message personnel
    if (personalMessage) {
      contentParts.push(
        generateContentBlock(
          `<p style="margin: 0 0 8px 0; font-weight: 600; color: #823F91;">Message :</p>
           <p style="margin: 0; color: #666; font-style: italic;">"${escapeHtml(personalMessage)}"</p>`,
          '#823F91'
        )
      )
    }

    // Informations pré-remplies
    const prefilledParts: string[] = []
    if (nomEntreprise) {
      prefilledParts.push(`<li>Entreprise : <strong>${escapeHtml(nomEntreprise)}</strong></li>`)
    }
    if (serviceLabel) {
      prefilledParts.push(`<li>Service : <strong>${escapeHtml(serviceLabel)}</strong></li>`)
    }

    if (prefilledParts.length > 0) {
      contentParts.push(
        generateContentBlock(
          `<p style="margin: 0 0 10px 0; font-weight: 600; color: #065f46;">Votre profil est déjà pré-rempli :</p>
           <ul style="margin: 0; padding-left: 20px; color: #047857;">
             ${prefilledParts.join('')}
           </ul>
           <p style="margin: 10px 0 0 0; font-size: 13px; color: #6B7280;">
             Vous pourrez modifier ces informations à tout moment.
           </p>`,
          '#10b981'
        )
      )
    }

    // Avantages
    contentParts.push(`
      <div style="margin: 20px 0;">
        <p style="font-size: 15px; font-weight: 600; margin-bottom: 12px;">Pourquoi rejoindre Nuply ?</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 12px; vertical-align: top; width: 30px;">
              <span style="font-size: 18px;">&#10003;</span>
            </td>
            <td style="padding: 8px 0; font-size: 14px; color: #4A4A4A;">
              Recevez des demandes de couples qualifiés
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; vertical-align: top; width: 30px;">
              <span style="font-size: 18px;">&#10003;</span>
            </td>
            <td style="padding: 8px 0; font-size: 14px; color: #4A4A4A;">
              Profil professionnel gratuit et visible
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; vertical-align: top; width: 30px;">
              <span style="font-size: 18px;">&#10003;</span>
            </td>
            <td style="padding: 8px 0; font-size: 14px; color: #4A4A4A;">
              Messagerie intégrée et gestion de devis
            </td>
          </tr>
        </table>
      </div>
    `)

    const html = generateEmailTemplate({
      title: 'Rejoignez Nuply',
      greeting,
      content: contentParts.join(''),
      buttonText: 'Créer mon profil prestataire',
      buttonUrl: invitationUrl,
      footer: `
        <p style="margin: 0 0 8px 0;">Ce lien est valide pendant 14 jours.</p>
        <p style="margin: 0 0 8px 0;">Ou copiez ce lien dans votre navigateur :</p>
        <p style="margin: 0; font-size: 12px; color: #999; word-break: break-all;">${invitationUrl}</p>
        <br>
        L'équipe Nuply
      `,
      hideUnsubscribe: true, // Email transactionnel d'invitation
    })

    // Sujet sobre et professionnel (pas de spam triggers)
    const subject = invitedByName
      ? `${escapeHtml(invitedByName)} vous invite sur Nuply`
      : 'Invitation à rejoindre Nuply - Plateforme prestataires mariage'

    // Envoi avec headers anti-spam
    await resend.emails.send({
      from: `NUPLY <${fromEmail}>`,
      to: recipientEmail,
      replyTo: 'contact@nuply.fr',
      subject,
      html,
      headers: {
        'List-Unsubscribe': `<mailto:contact@nuply.fr?subject=Unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Entity-Ref-ID': invitationToken,
      },
    })

    // Log l'email envoyé
    const adminClient = createAdminClient()
    await adminClient.from('email_logs').insert({
      user_id: null,
      email_type: 'vendor_invitation',
      metadata: {
        recipientEmail,
        invitationToken,
        channel: 'email',
      },
    })

    logger.info('Email invitation prestataire envoyé', { recipientEmail })
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    logger.error('Erreur envoi email invitation prestataire:', error)
    return { success: false, error: message }
  }
}
