import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

/**
 * Envoie un email de bienvenue après inscription
 */
export async function sendWelcomeEmail(
  email: string,
  role: 'couple' | 'prestataire',
  prenom: string,
  nom?: string
) {
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY non configurée - email de bienvenue non envoyé')
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const resend = new Resend(resendApiKey)

    const isCouple = role === 'couple'
    const subject = isCouple 
      ? `Bienvenue sur Nuply, ${prenom} ! 🎉`
      : `Bienvenue sur Nuply, ${prenom} ! 🚀`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #823F91 0%, #c081e3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Bienvenue sur Nuply !</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Bonjour ${prenom}${nom ? ` ${nom}` : ''},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              ${isCouple 
                ? 'Nous sommes ravis de vous accueillir sur Nuply, la plateforme qui vous aide à organiser votre mariage de rêve !'
                : 'Nous sommes ravis de vous accueillir sur Nuply, la plateforme qui connecte les prestataires avec les couples qui partagent leurs valeurs culturelles !'
              }
            </p>

            ${isCouple ? `
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #823F91; font-size: 20px; margin-top: 0;">🎯 Vos prochaines étapes :</h2>
                <ul style="padding-left: 20px;">
                  <li style="margin-bottom: 10px;">Complétez votre profil pour personnaliser votre expérience</li>
                  <li style="margin-bottom: 10px;">Décrivez votre mariage en quelques secondes</li>
                  <li style="margin-bottom: 10px;">Laissez notre IA trouver les prestataires parfaits pour vous</li>
                </ul>
              </div>
            ` : `
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #823F91; font-size: 20px; margin-top: 0;">🎯 Vos prochaines étapes :</h2>
                <ul style="padding-left: 20px;">
                  <li style="margin-bottom: 10px;">Complétez votre profil prestataire</li>
                  <li style="margin-bottom: 10px;">Ajoutez vos photos et votre portfolio</li>
                  <li style="margin-bottom: 10px;">Recevez des demandes qualifiées de couples</li>
                </ul>
              </div>
            `}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${isCouple ? 'couple' : 'prestataire'}/dashboard" 
                 style="display: inline-block; padding: 14px 28px; background-color: #823F91; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Accéder à mon tableau de bord
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Si vous avez des questions, n'hésitez pas à nous contacter. Nous sommes là pour vous aider !<br><br>
              L'équipe Nuply 💜
            </p>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject,
      html,
    })

    return { success: true }
  } catch (error: any) {
    console.error('Erreur envoi email de bienvenue:', error)
    return { success: false, error: error.message }
  }
}
