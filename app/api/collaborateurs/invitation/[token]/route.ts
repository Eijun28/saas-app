'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { apiLimiter, getClientIp } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

const TOKEN_REGEX = /^[a-f0-9]{64}$/i

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  // Rate limiting
  const ip = getClientIp(request)
  if (!apiLimiter.check(ip)) {
    logger.warn('Rate limit dépassé pour récupération invitation', { ip })
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

    const adminClient = createAdminClient()

    // Récupérer l'invitation par token
    const { data: invitation, error } = await adminClient
      .from('collaborateurs')
      .select('id, email, name, role, invited_at, accepted_at, invitation_expires_at, couple_id')
      .eq('invitation_token', token)
      .single()

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invitation introuvable' },
        { status: 404 }
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

    return NextResponse.json({
      invitation,
    })
  } catch (error) {
    logger.error('Erreur récupération invitation', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

