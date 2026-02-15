import { Resend } from 'resend'

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@nuply.fr'
export const FROM_NAME = process.env.FROM_NAME || 'NUPLY'

// Client Resend créé de manière lazy pour éviter de crasher si la clé n'est pas configurée
let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY non configurée - les emails ne seront pas envoyés')
    return null
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

// Export pour compatibilité (peut être null)
export const resend = getResendClient()

/**
 * Envoie un email via Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}) {
  const client = getResendClient()

  if (!client) {
    console.warn('Email non envoyé (RESEND_API_KEY non configurée):', { to, subject })
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const { data, error } = await client.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(to) ? to : [to],
      replyTo: replyTo || 'contact@nuply.fr',
      subject,
      html,
      text,
      headers: {
        'List-Unsubscribe': '<mailto:contact@nuply.fr?subject=Unsubscribe>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })

    if (error) {
      throw error
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Erreur envoi email Resend:', error)
    return { success: false, error: String(error) }
  }
}
