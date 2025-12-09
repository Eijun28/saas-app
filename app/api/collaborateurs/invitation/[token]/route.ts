'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const TOKEN_REGEX = /^[a-f0-9]{64}$/i

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
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
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

