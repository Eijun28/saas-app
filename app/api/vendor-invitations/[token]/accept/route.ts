import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

/**
 * POST /api/vendor-invitations/[token]/accept
 * Accepte une invitation prestataire et lie le compte utilisateur
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 400 }
      )
    }

    // Vérifier l'authentification
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accepter cette invitation' },
        { status: 401 }
      )
    }

    const adminClient = createAdminClient()

    // Récupérer l'invitation
    const { data: invitation, error } = await adminClient
      .from('vendor_invitations')
      .select('*')
      .eq('invitation_token', token)
      .single()

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invitation non trouvée' },
        { status: 404 }
      )
    }

    // Vérifications
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Cette invitation est ${invitation.status === 'accepted' ? 'déjà acceptée' : invitation.status === 'expired' ? 'expirée' : 'non valide'}` },
        { status: 410 }
      )
    }

    if (new Date(invitation.invitation_expires_at) < new Date()) {
      await adminClient
        .from('vendor_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return NextResponse.json(
        { error: 'Cette invitation a expiré' },
        { status: 410 }
      )
    }

    // Marquer l'invitation comme acceptée
    await adminClient
      .from('vendor_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: user.id,
      })
      .eq('id', invitation.id)

    // Mettre à jour le profil avec les données pré-remplies si disponibles
    const profileUpdates: Record<string, unknown> = {
      role: 'prestataire',
    }
    if (invitation.prenom) profileUpdates.prenom = invitation.prenom
    if (invitation.nom) profileUpdates.nom = invitation.nom
    if (invitation.nom_entreprise) profileUpdates.nom_entreprise = invitation.nom_entreprise
    if (invitation.service_type) profileUpdates.service_type = invitation.service_type

    // Vérifier si un profil existe déjà
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      await adminClient
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id)
    } else {
      await adminClient
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          ...profileUpdates,
        })
    }

    // Mettre à jour les métadonnées auth
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        role: 'prestataire',
        nom_entreprise: invitation.nom_entreprise || user.user_metadata?.nom_entreprise,
        invited: true,
        invitation_token: token,
      },
    })

    logger.info('Invitation prestataire acceptée', {
      userId: user.id,
      invitationId: invitation.id,
    })

    return NextResponse.json({
      success: true,
      redirect: '/prestataire/profil-public',
    })
  } catch (error) {
    logger.error('Erreur acceptation invitation prestataire', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
