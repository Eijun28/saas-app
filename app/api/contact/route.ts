import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { contactFormSchema } from '@/lib/validations/contact.schema'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const contactEmail = 'contact@nuply.fr'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validation avec Zod
    const validationResult = contactFormSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      )
    }

    const { name, email, subject, message } = validationResult.data

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY non configurée - email de contact non envoyé')
      return NextResponse.json(
        { error: 'Service temporairement indisponible' },
        { status: 503 }
      )
    }

    const resend = new Resend(resendApiKey)

    // Envoyer l'email à contact@nuply.fr
    await resend.emails.send({
      from: fromEmail,
      to: contactEmail,
      replyTo: email,
      subject: `[Contact Nuply] ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #823F91 0%, #c081e3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Nouveau message de contact</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <div style="margin-bottom: 20px;">
                <p style="font-size: 16px; margin-bottom: 10px;"><strong>Nom :</strong> ${name}</p>
                <p style="font-size: 16px; margin-bottom: 10px;"><strong>Email :</strong> ${email}</p>
                <p style="font-size: 16px; margin-bottom: 20px;"><strong>Sujet :</strong> ${subject}</p>
              </div>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #823F91; font-size: 18px; margin-top: 0; margin-bottom: 10px;">Message :</h2>
                <p style="font-size: 16px; white-space: pre-wrap; margin: 0;">${message.replace(/\n/g, '<br>')}</p>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Vous pouvez répondre directement à cet email pour contacter ${name} (${email}).
              </p>
            </div>
          </body>
        </html>
      `,
    })

    // Envoyer un email de confirmation à l'utilisateur
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Votre message a bien été reçu - Nuply',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #823F91 0%, #c081e3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Message reçu !</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Bonjour ${name},</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                Nous avons bien reçu votre message concernant : <strong>${subject}</strong>
              </p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                Notre équipe va examiner votre demande et vous répondre dans les plus brefs délais.
              </p>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                L'équipe Nuply 💜<br>
                <a href="mailto:contact@nuply.fr" style="color: #823F91;">contact@nuply.fr</a>
              </p>
            </div>
          </body>
        </html>
      `,
    })

    return NextResponse.json({
      success: true,
      message: 'Votre message a été envoyé avec succès',
    })
  } catch (error: any) {
    console.error('Erreur envoi email de contact:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'envoi de votre message. Veuillez réessayer plus tard.' },
      { status: 500 }
    )
  }
}
