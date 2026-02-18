import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/config/admin'
import { logger } from '@/lib/logger'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/**
 * Route d'initialisation admin one-time.
 * Crée un compte admin (ou génère un magic link si le compte existe déjà)
 * et retourne un lien de connexion directe.
 *
 * Sécurisé par SUPABASE_SERVICE_ROLE_KEY en tant que secret.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, secret } = body

    // Vérifier le secret (on utilise le service role key comme secret partagé)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!secret || !serviceRoleKey || secret !== serviceRoleKey) {
      return NextResponse.json(
        { error: 'Secret invalide' },
        { status: 403 }
      )
    }

    // Vérifier que l'email est bien un email admin autorisé
    if (!email || !isAdminEmail(email)) {
      return NextResponse.json(
        { error: 'Cet email n\'est pas dans la liste des administrateurs autorisés' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Vérifier si l'utilisateur existe déjà
    const { data: userList } = await adminClient.auth.admin.listUsers()
    const existingUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (existingUser) {
      // L'utilisateur existe déjà — générer un magic link
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${siteUrl}/auth/callback` },
      })

      if (linkError || !linkData?.properties?.action_link) {
        logger.error('Erreur génération magic link admin:', linkError)
        return NextResponse.json(
          { error: 'Erreur lors de la génération du lien' },
          { status: 500 }
        )
      }

      // Confirmer l'email si ce n'est pas déjà fait
      if (!existingUser.email_confirmed_at) {
        await adminClient.auth.admin.updateUserById(existingUser.id, {
          email_confirm: true,
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Compte admin existant. Voici votre lien de connexion.',
        loginUrl: linkData.properties.action_link,
        isNew: false,
      })
    }

    // Créer le compte admin
    const tempPassword = crypto.randomUUID() + '-Aa1!'  // password fort temporaire
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,  // Confirmer directement l'email
      user_metadata: {
        role: 'admin',
        prenom: 'Admin',
        nom: 'Nuply',
      },
    })

    if (createError || !newUser?.user) {
      logger.error('Erreur création compte admin:', createError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte: ' + (createError?.message || 'Inconnu') },
        { status: 500 }
      )
    }

    // Générer un magic link pour se connecter
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    })

    if (linkError || !linkData?.properties?.action_link) {
      logger.error('Erreur génération magic link admin:', linkError)
      return NextResponse.json(
        { error: 'Compte créé mais erreur lors de la génération du lien de connexion' },
        { status: 500 }
      )
    }

    logger.info('Compte admin créé avec succès', { email })

    return NextResponse.json({
      success: true,
      message: 'Compte admin créé. Voici votre lien de connexion.',
      loginUrl: linkData.properties.action_link,
      isNew: true,
    })
  } catch (error: any) {
    logger.error('Erreur admin setup:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
