'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { inviteCollaborateurSchema } from '@/lib/validations/collaborateur.schema'
import { Resend } from 'resend'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validation avec Zod
    const validationResult = inviteCollaborateurSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      )
    }

    const { email, name, role, message } = validationResult.data

    // Générer un token d'invitation unique
    const invitationToken = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expire dans 7 jours

    // Utiliser le client admin pour insérer l'invitation
    const adminClient = createAdminClient()
    
    // Vérifier si une invitation existe déjà pour cet email
    const { data: existingInvitation } = await adminClient
      .from('collaborateurs')
      .select('id')
      .eq('couple_id', user.id)
      .eq('email', email)
      .single()

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Une invitation a déjà été envoyée à cet email' },
        { status: 400 }
      )
    }

    // Insérer l'invitation dans la base de données
    const { data: invitation, error } = await adminClient
      .from('collaborateurs')
      .insert({
        couple_id: user.id,
        email,
        name,
        role,
        invitation_token: invitationToken,
        invitation_expires_at: expiresAt.toISOString(),
        invited_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création de l\'invitation:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'invitation' },
        { status: 500 }
      )
    }

    // Construire l'URL d'invitation
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const invitationUrl = `${baseUrl}/invitation/${invitationToken}`

    // Envoyer l'email d'invitation via Resend
    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@nuply.fr'

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey)
        
        await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: `Invitation à collaborer sur ${name || 'votre mariage'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #823F91;">Invitation à collaborer</h2>
              <p>Bonjour,</p>
              <p>Vous avez été invité(e) à collaborer sur l'organisation d'un mariage en tant que <strong>${role}</strong>.</p>
              ${message ? `<p><em>"${message}"</em></p>` : ''}
              <p>
                <a href="${invitationUrl}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #823F91; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
                  Accepter l'invitation
                </a>
              </p>
              <p>Ou copiez ce lien dans votre navigateur :</p>
              <p style="color: #666; font-size: 12px; word-break: break-all;">${invitationUrl}</p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Cette invitation expire dans 7 jours.
              </p>
            </div>
          `,
        })
      } catch (emailError: any) {
        console.error('Erreur envoi email:', emailError)
        // Ne pas faire échouer la requête si l'email échoue
        // L'invitation est quand même créée en DB
      }
    } else {
      console.warn('RESEND_API_KEY non configurée - email non envoyé')
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        ...(process.env.NODE_ENV === 'development' && { invitationUrl }),
      },
    })
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

