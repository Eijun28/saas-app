import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { getErrorMessage } from '@/lib/utils'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@nuply.fr'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/**
 * Envoie un email de confirmation personnalisé avec Resend
 * Génère le lien de confirmation via l'API admin Supabase
 */
export async function sendConfirmationEmail(
  userId: string,
  email: string,
  prenom: string,
  role?: 'couple' | 'prestataire'
) {
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY non configurée - email de confirmation non envoyé')
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const adminClient = createAdminClient()
    
    // Générer un lien magiclink via l'API admin
    // Note: generateLink({ type: 'magiclink' }) a un effet de bord connu :
    // il marque email_confirmed_at immédiatement côté Supabase.
    // On annule cet effet juste après pour que la confirmation ne se fasse
    // que lorsque l'utilisateur clique réellement sur le lien.
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: role
          ? `${siteUrl}/auth/callback?role=${role}`
          : `${siteUrl}/auth/callback`,
      }
    })

    if (linkError || !linkData?.properties?.action_link) {
      logger.error('Erreur génération lien confirmation:', linkError)
      return { success: false, error: 'Erreur lors de la génération du lien de confirmation' }
    }

    // Annuler la confirmation automatique causée par generateLink
    // L'email ne sera confirmé que lorsque l'utilisateur cliquera sur le lien
    await adminClient.auth.admin.updateUserById(userId, {
      email_confirm: false,
    })

    const confirmationUrl = linkData.properties.action_link

    const resend = new Resend(resendApiKey)

    const subject = `Confirmez votre inscription - Nuply`

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmez votre inscription - Nuply</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f9fc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); overflow: hidden; max-width: 600px;">
       
                <!-- En-tête violet avec logo -->
                <tr>
                  <td style="background: linear-gradient(135deg, #823F91 0%, #c081e3 100%); padding: 50px 30px; text-align: center;">
                    <div style="margin-bottom: 20px;">
                      <svg width="200" height="44" viewBox="0 0 4691 1031" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M879.258 5.41385V648.518C879.258 792.301 751.16 797.529 711.946 685.117C672.732 572.705 497.579 5.41385 497.579 5.41385H146.403L0.000394252 1029.32L306.361 1029.32L361.638 507.348C361.638 507.348 379.902 562.142 427.761 685.117L492.35 847.2C506.986 877.501 544.942 1029.32 837.746 1029.32C1130.55 1029.32 1163.08 847.201 1163.08 847.201C1179.09 805.512 1177.28 742.132 1177.28 685.117V5.41385H879.258Z" fill="#FFFFFF"/>
                        <path d="M4338.55 1030.24H4040.32V764.545L3682.45 5.42188H3980.68L4186.73 409.384L4392.77 5.42188H4691L4338.55 764.545V1030.24Z" fill="#FFFFFF"/>
                        <path d="M1822.6 531.386V5.42188H2120.83V678.19C2120.83 918.358 1973.29 1030.24 1709.74 1030.24C1465.88 1030.24 1312.9 916.867 1312.9 678.19V5.42188H1611.13V531.386C1611.13 661.118 1615.16 764.545 1710.74 764.545C1826.63 764.545 1822.6 655.696 1822.6 531.386Z" fill="#FFFFFF"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M2261.81 1024.82H2559.97V764.545H2750.15C2988.83 764.545 3096.14 612.576 3096.14 368.717C3096.14 105.167 2990.32 0 2750.15 0H2261.81L2261.81 1024.82ZM2795.2 368.717C2795.2 433.785 2733.08 433.785 2603.35 433.785H2559.97V298.227H2603.35C2606.47 298.227 2609.56 298.225 2612.62 298.223C2731.31 298.15 2795.2 298.223 2795.2 368.717Z" fill="#FFFFFF"/>
                        <path d="M3541.27 1028.04H3243.24L3243.24 5.42188H3541.27V1028.04Z" fill="#FFFFFF"/>
                        <path d="M3243.18 732.012V1030.04L3594.92 1030.04C3687.04 1030.04 3841.92 1030.04 3880.3 1030.04L3879.66 764.545H3541.27L3243.18 732.012Z" fill="#FFFFFF"/>
                      </svg>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600;">
                      Bienvenue sur Nuply !
                    </h1>
                  </td>
                </tr>
       
                <!-- Contenu principal -->
                <tr>
                  <td style="padding: 50px 40px;">
                    <h2 style="margin: 0 0 24px 0; color: #823F91; font-size: 24px; font-weight: 600; text-align: center;">
                      Confirmez votre adresse e-mail
                    </h2>
       
                    <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                      Bonjour ${prenom},
                    </p>
       
                    <p style="margin: 0 0 32px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                      Merci de vous être inscrit sur <strong style="color: #823F91;">Nuply</strong> ! Pour activer votre compte et commencer à utiliser nos services, veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous.
                    </p>
       
                    <!-- Bouton CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0;">
                      <tr>
                        <td align="center">
                          <a href="${confirmationUrl}" style="display: inline-block; padding: 18px 48px; background: linear-gradient(135deg, #823F91 0%, #c081e3 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 17px; box-shadow: 0 4px 14px rgba(130, 63, 145, 0.4);">
                            Confirmer mon e-mail
                          </a>
                        </td>
                      </tr>
                    </table>
       
                    <!-- Lien alternatif -->
                    <p style="margin: 0 0 32px 0; color: #718096; font-size: 14px; line-height: 1.6; text-align: center;">
                      Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                      <a href="${confirmationUrl}" style="color: #823F91; word-break: break-all;">${confirmationUrl}</a>
                    </p>
       
                    <!-- Avertissement expiration -->
                    <div style="margin: 40px 0 0 0; padding: 24px; background-color: #f3f4ff; border-left: 4px solid #823F91; border-radius: 6px;">
                      <p style="margin: 0; color: #823F91; font-size: 14px; line-height: 1.6;">
                        <strong>⚠️ Important :</strong> Ce lien de confirmation expire dans <strong>24 heures</strong> pour des raisons de sécurité.
                      </p>
                    </div>
                  </td>
                </tr>
       
                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="border-top: 1px solid #e2e8f0;"></div>
                  </td>
                </tr>
       
                <!-- Pied de page -->
                <tr>
                  <td style="padding: 40px; text-align: center;">
                    <p style="margin: 0 0 20px 0; color: #718096; font-size: 14px; line-height: 1.6;">
                      Vous n'avez pas créé de compte sur Nuply ?<br>Vous pouvez ignorer cet e-mail en toute sécurité.
                    </p>
       
                    <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 12px;">
                      © 2026 Nuply. Tous droits réservés.
                    </p>
       
                    <p style="margin: 0; color: #cbd5e0; font-size: 12px;">
                      <a href="https://nuply.fr" style="color: #823F91; text-decoration: none;">nuply.fr</a>
                    </p>
                  </td>
                </tr>
       
              </table>
       
              <!-- Message support -->
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 20px;">
                <tr>
                  <td align="center" style="padding: 0 30px;">
                    <p style="margin: 0; color: #a0aec0; font-size: 12px; line-height: 1.5;">
                      Des questions ? Contactez-nous à <a href="mailto:support@nuply.fr" style="color: #823F91; text-decoration: none;">support@nuply.fr</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    await resend.emails.send({
      from: `NUPLY <${fromEmail}>`,
      to: email,
      replyTo: 'support@nuply.fr',
      subject,
      html,
      headers: {
        'List-Unsubscribe': '<mailto:contact@nuply.fr?subject=Unsubscribe>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })

    logger.info('✅ Email de confirmation envoyé avec succès', { email, userId })
    return { success: true }
  } catch (error: unknown) {
    logger.error('Erreur envoi email de confirmation:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}
