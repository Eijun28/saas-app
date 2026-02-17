import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/config/admin'
import { logger } from '@/lib/logger'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function POST(request: Request) {
  try {
    // Vérifier que l'appelant est admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || !isAdminEmail(user.email)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Vérifier que l'utilisateur existe
    const { data: userList, error: listError } = await adminClient.auth.admin.listUsers()

    if (listError) {
      logger.error('Erreur listUsers:', listError)
      return NextResponse.json(
        { error: 'Erreur lors de la recherche de l\'utilisateur' },
        { status: 500 }
      )
    }

    const targetUser = userList.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Aucun utilisateur trouvé avec cet email. L\'utilisateur doit d\'abord s\'inscrire.' },
        { status: 404 }
      )
    }

    if (targetUser.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Cet utilisateur a déjà confirmé son email.' },
        { status: 400 }
      )
    }

    // Générer un magic link sans annuler la confirmation
    // (contrairement au flow normal qui annule la confirmation après generateLink)
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      }
    })

    if (linkError || !linkData?.properties?.action_link) {
      logger.error('Erreur génération lien bypass:', linkError)
      return NextResponse.json(
        { error: 'Erreur lors de la génération du lien' },
        { status: 500 }
      )
    }

    // NOTE: On ne fait PAS le updateUserById({ email_confirm: false })
    // contrairement à sendConfirmationEmail, car on VEUT que le lien confirme l'email

    const bypassUrl = linkData.properties.action_link

    logger.info('Lien bypass confirmation généré par admin', {
      adminEmail: user.email,
      targetEmail: email,
      targetUserId: targetUser.id,
    })

    return NextResponse.json({
      success: true,
      bypassUrl,
      userInfo: {
        email: targetUser.email,
        prenom: targetUser.user_metadata?.prenom || '',
        nom: targetUser.user_metadata?.nom || '',
        role: targetUser.user_metadata?.role || 'inconnu',
        createdAt: targetUser.created_at,
      },
    })
  } catch (error: any) {
    logger.error('Erreur bypass-confirmation:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
