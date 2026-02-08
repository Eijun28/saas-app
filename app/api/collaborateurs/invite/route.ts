'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { inviteCollaborateurSchema } from '@/lib/validations/collaborateur.schema'
import { Resend } from 'resend'
import { logger } from '@/lib/logger'
import { validateSupabaseConfig, handleApiError } from '@/lib/api-error-handler'
import { escapeHtml } from '@/lib/email/templates'

export async function POST(request: Request) {
  try {
    // Vérifier la configuration Supabase
    const configCheck = validateSupabaseConfig()
    if (!configCheck.valid) {
      logger.error('Configuration Supabase invalide')
      return NextResponse.json(
        { error: 'Configuration serveur invalide' },
        { status: 500 }
      )
    }

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

    // ✅ VALIDATION 1: Vérifier que l'inviteur existe et est un couple
    const { data: inviter, error: inviterError } = await supabase
      .from('couples')
      .select('id, partner_1_name, partner_2_name')
      .eq('user_id', user.id)
      .single()

    if (inviterError || !inviter) {
      return NextResponse.json(
        { error: 'Inviteur non trouvé ou non autorisé' },
        { status: 403 }
      )
    }

    // ✅ VALIDATION 2: Limiter nombre d'invitations par couple
    const { count, error: countError } = await supabase
      .from('collaborateurs')
      .select('*', { count: 'exact', head: true })
      .eq('couple_id', user.id)

    if (countError) {
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des invitations' },
        { status: 500 }
      )
    }

    if (count && count >= 10) {
      return NextResponse.json(
        { error: 'Limite d\'invitations atteinte (max 10)' },
        { status: 429 }
      )
    }

    // ✅ VALIDATION 3: Vérifier que l'email n'existe pas déjà comme utilisateur
    const adminClient = createAdminClient()
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const emailExists = existingUsers?.users?.some(u => u.email === email.toLowerCase())

    if (emailExists) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Générer un token d'invitation unique
    const invitationToken = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expire dans 7 jours
    
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
      logger.error('Erreur lors de la création de l\'invitation', error)
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
        
        // Échapper les inputs utilisateur pour prévenir les injections XSS
        const safeName = escapeHtml(name || 'votre mariage')
        const safeRole = escapeHtml(role)
        const safeMessage = message ? escapeHtml(message) : ''

        await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: `Invitation à collaborer sur ${safeName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #823F91;">Invitation à collaborer</h2>
              <p>Bonjour,</p>
              <p>Vous avez été invité(e) à collaborer sur l'organisation d'un mariage en tant que <strong>${safeRole}</strong>.</p>
              ${safeMessage ? `<p><em>"${safeMessage}"</em></p>` : ''}
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
        logger.error('Erreur envoi email', emailError)
        // Ne pas faire échouer la requête si l'email échoue
        // L'invitation est quand même créée en DB
      }
    } else {
      logger.warn('RESEND_API_KEY non configurée - email non envoyé')
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
    logger.error('Erreur serveur', error)
    return handleApiError(error)
  }
}

