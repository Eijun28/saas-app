'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { inviteCollaborateurSchema } from '@/lib/validations/collaborateur.schema'
import { logger } from '@/lib/logger'

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
      logger.error('Erreur lors de la création de l\'invitation', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'invitation' },
        { status: 500 }
      )
    }

    // Construire l'URL d'invitation
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const invitationUrl = `${baseUrl}/invitation/${invitationToken}`

    // TODO: Envoyer l'email d'invitation via un service d'email (Resend, SendGrid, etc.)
    // En production, ne pas retourner l'URL dans la réponse

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
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

