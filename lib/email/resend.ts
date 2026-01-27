import { Resend } from 'resend'
import { generateEmailTemplate } from './templates'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@nuply.com'
export const FROM_NAME = process.env.FROM_NAME || 'NUPLY'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

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

/**
 * Envoie un email de bienvenue après inscription
 */
export async function sendWelcomeEmail(
  email: string,
  role: 'couple' | 'prestataire',
  prenom: string,
  nom: string
) {
  try {
    const userName = `${prenom} ${nom}`.trim()
    const roleText = role === 'couple' ? 'couple' : 'prestataire'
    const dashboardUrl = `${siteUrl}/${role === 'couple' ? 'couple' : 'prestataire'}/dashboard`
    
    const subject = `Bienvenue sur Nuply, ${prenom} ! 🎉`
    
    const html = generateEmailTemplate({
      title: 'Bienvenue sur Nuply ! 🎉',
      greeting: `Bonjour ${prenom}`,
      content: `
        <p style="font-size: 16px; margin-bottom: 20px;">
          Nous sommes ravis de vous accueillir sur Nuply, la plateforme qui facilite l'organisation de mariages multiculturels.
        </p>
        <p style="font-size: 16px; margin-bottom: 20px;">
          Votre compte ${roleText} a été créé avec succès. Vous pouvez maintenant commencer à utiliser toutes les fonctionnalités de Nuply.
        </p>
      `,
      buttonText: 'Accéder à mon tableau de bord',
      buttonUrl: dashboardUrl,
      footer: 'L\'équipe Nuply 💜',
    })

    return await sendEmail({
      to: email,
      subject,
      html,
    })
  } catch (error: any) {
    console.error('Erreur envoi email de bienvenue:', error)
    return { success: false, error: error.message }
  }
}
