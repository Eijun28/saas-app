import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@nuply.com'
export const FROM_NAME = process.env.FROM_NAME || 'NUPLY'

/**
 * Envoie un email via Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    })

    if (error) {
      throw error
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Erreur envoi email Resend:', error)
    throw error
  }
}
