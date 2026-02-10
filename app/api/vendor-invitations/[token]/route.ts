import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

/**
 * GET /api/vendor-invitations/[token]
 * Vérifie la validité d'une invitation prestataire et enregistre la vue
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Validation basique du token (hex, 64 chars)
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 404 }
      )
    }

    const adminClient = createAdminClient()

    const { data: invitation, error } = await adminClient
      .from('vendor_invitations')
      .select('id, email, nom_entreprise, prenom, nom, service_type, status, message, invitation_expires_at, viewed_at, invited_by_role')
      .eq('invitation_token', token)
      .single()

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invitation non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier si révoquée
    if (invitation.status === 'revoked') {
      return NextResponse.json(
        { error: 'Cette invitation a été révoquée' },
        { status: 410 }
      )
    }

    // Vérifier si déjà acceptée
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'Cette invitation a déjà été acceptée', accepted: true },
        { status: 410 }
      )
    }

    // Vérifier expiration
    const isExpired = new Date(invitation.invitation_expires_at) < new Date()
    if (isExpired || invitation.status === 'expired') {
      // Marquer comme expirée si pas déjà fait
      if (invitation.status !== 'expired') {
        await adminClient
          .from('vendor_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id)
      }
      return NextResponse.json(
        { error: 'Cette invitation a expiré' },
        { status: 410 }
      )
    }

    // Enregistrer la vue (premier clic + compteur)
    const updateData: Record<string, unknown> = {
      viewed_count: (invitation.viewed_at ? 1 : 0) + 1,
    }
    if (!invitation.viewed_at) {
      updateData.viewed_at = new Date().toISOString()
    }

    await adminClient
      .from('vendor_invitations')
      .update(updateData)
      .eq('id', invitation.id)

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        nom_entreprise: invitation.nom_entreprise,
        prenom: invitation.prenom,
        nom: invitation.nom,
        service_type: invitation.service_type,
        message: invitation.message,
      },
    })
  } catch (error) {
    logger.error('Erreur vérification invitation prestataire', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
