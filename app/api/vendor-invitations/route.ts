'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { createVendorInvitationSchema } from '@/lib/validations/vendor-invitation.schema'
import { sendVendorInvitationEmail } from '@/lib/email/vendor-invitation'
import { logger } from '@/lib/logger'
import { validateSupabaseConfig, handleApiError } from '@/lib/api-error-handler'

/**
 * POST /api/vendor-invitations
 * Crée une invitation pour un prestataire
 */
export async function POST(request: Request) {
  try {
    const configCheck = validateSupabaseConfig()
    if (!configCheck.valid) {
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
    const validationResult = createVendorInvitationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      )
    }

    const { email, nom_entreprise, prenom, nom, service_type, message, channel } = validationResult.data

    // Déterminer le rôle de l'inviteur
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role, prenom, nom, nom_entreprise')
      .eq('id', user.id)
      .single()

    const invitedByRole = profile?.role || 'couple'
    const invitedByName = profile?.nom_entreprise
      || `${profile?.prenom || ''} ${profile?.nom || ''}`.trim()
      || undefined

    // Vérifier si le prestataire est déjà inscrit
    const { data: existingUsers } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    const existingUser = existingUsers?.users?.find((u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase())

    if (existingUser) {
      // Vérifier si c'est déjà un prestataire
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', existingUser.id)
        .single()

      if (existingProfile?.role === 'prestataire') {
        return NextResponse.json(
          { error: 'Ce prestataire est déjà inscrit sur Nuply' },
          { status: 409 }
        )
      }
    }

    // Vérifier s'il y a déjà une invitation pending pour cet email
    const { data: existingInvitation } = await adminClient
      .from('vendor_invitations')
      .select('id, status, invitation_expires_at')
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      const isExpired = new Date(existingInvitation.invitation_expires_at) < new Date()
      if (!isExpired) {
        return NextResponse.json(
          { error: 'Une invitation est déjà en attente pour cet email' },
          { status: 400 }
        )
      }
      // Si expirée, on la marque comme telle
      await adminClient
        .from('vendor_invitations')
        .update({ status: 'expired' })
        .eq('id', existingInvitation.id)
    }

    // Générer le token d'invitation (URL-safe, 32 bytes = 64 chars hex)
    const invitationToken = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 14) // 14 jours de validité

    // Insérer l'invitation
    const { data: invitation, error } = await adminClient
      .from('vendor_invitations')
      .insert({
        invited_by: user.id,
        invited_by_role: invitedByRole,
        email: email.toLowerCase(),
        nom_entreprise,
        prenom,
        nom,
        service_type,
        message,
        invitation_token: invitationToken,
        invitation_expires_at: expiresAt.toISOString(),
        channel,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      logger.error('Erreur création invitation prestataire', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json(
        { error: `Erreur lors de la création de l'invitation: ${error.message}` },
        { status: 500 }
      )
    }

    // Envoyer l'email si le canal est 'email'
    let emailSent = false
    if (channel === 'email') {
      const emailResult = await sendVendorInvitationEmail({
        recipientEmail: email,
        recipientPrenom: prenom,
        nomEntreprise: nom_entreprise,
        serviceType: service_type,
        invitationToken,
        invitedByName,
        personalMessage: message,
      })
      emailSent = emailResult.success
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const invitationUrl = `${baseUrl}/rejoindre/${invitationToken}`

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expires_at: invitation.invitation_expires_at,
        channel,
        emailSent,
        // Le lien est toujours fourni (pour copier/partager via WhatsApp, QR, etc.)
        invitationUrl,
      },
    })
  } catch (error) {
    logger.error('Erreur serveur vendor-invitations POST', error)
    return handleApiError(error)
  }
}

/**
 * GET /api/vendor-invitations
 * Liste les invitations envoyées par l'utilisateur courant
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: invitations, error } = await supabase
      .from('vendor_invitations')
      .select('id, email, nom_entreprise, prenom, nom, service_type, status, channel, created_at, accepted_at, viewed_at, viewed_count, invitation_expires_at')
      .eq('invited_by', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Erreur récupération invitations', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des invitations' },
        { status: 500 }
      )
    }

    return NextResponse.json({ invitations })
  } catch (error) {
    logger.error('Erreur serveur vendor-invitations GET', error)
    return handleApiError(error)
  }
}
