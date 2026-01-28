/**
 * Template HTML de base réutilisable pour les emails Nuply
 * Utilise le même style que sendWelcomeEmail (gradient #823F91 → #c081e3)
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export interface EmailTemplateOptions {
  title: string
  greeting?: string
  content: string
  buttonText?: string
  buttonUrl?: string
  footer?: string
}

/**
 * Génère un email HTML avec le branding Nuply
 */
export function generateEmailTemplate(options: EmailTemplateOptions): string {
  const {
    title,
    greeting = 'Bonjour',
    content,
    buttonText,
    buttonUrl,
    footer = 'L\'équipe Nuply 💜',
  } = options

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #823F91 0%, #c081e3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${title}</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">${greeting},</p>
          
          ${content}

          ${buttonText && buttonUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${buttonUrl}" 
                 style="display: inline-block; padding: 14px 28px; background-color: #823F91; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                ${buttonText}
              </a>
            </div>
          ` : ''}

          <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            ${footer}
          </p>
        </div>
      </body>
    </html>
  `
}

/**
 * Génère un bloc de contenu avec fond gris clair
 */
export function generateContentBlock(content: string, borderColor?: string): string {
  const borderStyle = borderColor ? `border-left: 4px solid ${borderColor};` : ''
  return `
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; ${borderStyle}">
      ${content}
    </div>
  `
}

/**
 * Génère un bloc de message avec style italic
 */
export function generateMessagePreview(message: string, maxLength: number = 200): string {
  const truncated = message.length > maxLength ? `${message.substring(0, maxLength)}...` : message
  return `
    <p style="margin: 0; color: #666; font-style: italic;">"${truncated}"</p>
  `
}
