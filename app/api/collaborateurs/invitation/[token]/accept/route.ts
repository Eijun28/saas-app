'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { inviteLimiter, getClientIp } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

const TOKEN_REGEX = /^[a-f0-9]{64}$/i

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  // Rate limiting
  const ip = getClientIp(request)
  if (!inviteLimiter.check(ip)) {
    logger.warn('Rate limit dépassé pour acceptation invitation', { ip })
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      { status: 429 }
    )
  }

  try {
    const { token } = params

    if (!token || !TOKEN_REGEX.test(token)) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const adminClient = createAdminClient()

    // Récupérer l'invitation par token
    const { data: invitation, error: fetchError } = await adminClient
      .from('collaborateurs')
      .select('id, email, accepted_at, invitation_expires_at')
      .eq('invitation_token', token)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation introuvable' },
        { status: 404 }
      )
    }

    // Vérifier si l'invitation a déjà été acceptée
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: 'Cette invitation a déjà été acceptée' },
        { status: 400 }
      )
    }

    // Vérifier si l'invitation a expiré
    if (invitation.invitation_expires_at) {
      const expiresAt = new Date(invitation.invitation_expires_at)
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Invitation expirée' },
          { status: 410 }
        )
      }
    }

    // Vérifier que l'email correspond
    if (invitation.email !== user.email) {
      return NextResponse.json(
        { error: 'Cette invitation est destinée à un autre email' },
        { status: 403 }
      )
    }

    // Accepter l'invitation
    const { error: updateError } = await adminClient
      .from('collaborateurs')
      .update({
        accepted_at: new Date().toISOString(),
        user_id: user.id,
      })
      .eq('id', invitation.id)

    if (updateError) {
      logger.error('Erreur lors de l\'acceptation invitation', updateError, { 
        invitationId: invitation.id,
        userId: user.id 
      })
      return NextResponse.json(
        { error: 'Erreur lors de l\'acceptation de l\'invitation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation acceptée avec succès',
    })
  } catch (error) {
    logger.error('Erreur serveur acceptation invitation', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

