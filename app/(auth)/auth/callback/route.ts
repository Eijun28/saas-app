import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { translateAuthError } from '@/lib/auth/error-translations'
import { getDashboardUrl } from '@/lib/auth/utils'
import { logger } from '@/lib/logger'

async function createCoupleProfile(adminClient: ReturnType<typeof createAdminClient>, userId: string, email: string, metadata: Record<string, any>) {
  const fullName = `${metadata?.prenom || ''} ${metadata?.nom || ''}`.trim()

  const { error: coupleError } = await adminClient
    .from('couples')
    .upsert({
      id: userId,
      user_id: userId,
      email,
      partner_1_name: fullName || null,
      partner_2_name: null,
    }, { onConflict: 'user_id' })

  if (coupleError) return coupleError

  await adminClient
    .from('couple_preferences')
    .upsert({
      couple_id: userId,
      languages: ['français'],
      essential_services: [],
      optional_services: [],
      cultural_preferences: {},
      service_priorities: {},
      budget_breakdown: {},
      profile_completed: false,
      completion_percentage: 0,
      onboarding_step: 0,
    }, { onConflict: 'couple_id' })

  return null
}

async function createPrestaProfile(adminClient: ReturnType<typeof createAdminClient>, userId: string, email: string, metadata: Record<string, any>) {
  const { error } = await adminClient
    .from('profiles')
    .upsert({
      id: userId,
      email,
      role: 'prestataire',
      prenom: metadata?.prenom || null,
      nom: metadata?.nom || null,
      nom_entreprise: metadata?.nom_entreprise || null,
    }, { onConflict: 'id' })

  return error || null
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  // Rôle transmis via URL param (depuis la page /sign-up avec bouton OAuth)
  const urlRole = requestUrl.searchParams.get('role') as 'couple' | 'prestataire' | null

  if (code) {
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      logger.error('Erreur callback:', error)
      const translatedError = translateAuthError(error.message || 'callback_error')
      return NextResponse.redirect(`${requestUrl.origin}/sign-in?error=${encodeURIComponent(translatedError)}`)
    }

    if (type === 'recovery') {
      return NextResponse.redirect(`${requestUrl.origin}/reset-password`)
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      logger.error('Erreur récupération utilisateur après callback:', userError)
      return NextResponse.redirect(`${requestUrl.origin}/sign-in?error=${encodeURIComponent('Erreur lors de la connexion. Veuillez réessayer.')}`)
    }

    {
      // Use admin client to check role — the server client created above
      // may not have the session cookies available for RLS queries yet
      // (cookies are set on the response, not readable from a new client)
      const adminClient = createAdminClient()

      const [{ data: couple }, { data: profile }] = await Promise.all([
        adminClient.from('couples').select('id').eq('user_id', user.id).maybeSingle(),
        adminClient.from('profiles').select('id, onboarding_step').eq('id', user.id).maybeSingle(),
      ])

      const existingRole = couple ? 'couple' : profile ? 'prestataire' : null

      if (existingRole) {
        // Profil existant
        if (existingRole === 'prestataire') {
          if (!profile || (profile.onboarding_step ?? 0) < 5) {
            return NextResponse.redirect(`${requestUrl.origin}/prestataire/onboarding`)
          }
        }

        const dashboardUrl = getDashboardUrl(existingRole)
        return NextResponse.redirect(`${requestUrl.origin}${dashboardUrl}`)
      }

      // Aucun profil trouvé — déterminer le rôle à utiliser
      // Priorité : URL param > user_metadata (jamais renseigné par Google OAuth seul)
      const resolvedRole = (urlRole === 'couple' || urlRole === 'prestataire')
        ? urlRole
        : (user.user_metadata?.role as 'couple' | 'prestataire' | undefined)

      logger.warn('Aucun profil trouvé, résolution du rôle:', { userId: user.id, urlRole, resolvedRole })

      if (resolvedRole === 'couple' || resolvedRole === 'prestataire') {
        try {
          if (resolvedRole === 'couple') {
            const err = await createCoupleProfile(adminClient, user.id, user.email || '', user.user_metadata ?? {})
            if (!err) {
              logger.info('✅ Profil couple créé (OAuth)', { userId: user.id })
              return NextResponse.redirect(`${requestUrl.origin}/couple/dashboard`)
            }
            logger.error('Erreur création profil couple (OAuth):', err)
          } else {
            const err = await createPrestaProfile(adminClient, user.id, user.email || '', user.user_metadata ?? {})
            if (!err) {
              logger.info('✅ Profil prestataire créé (OAuth)', { userId: user.id })
              return NextResponse.redirect(`${requestUrl.origin}/prestataire/onboarding`)
            }
            logger.error('Erreur création profil prestataire (OAuth):', err)
          }
        } catch (e: any) {
          logger.error('Erreur inattendue création profil (OAuth):', e)
        }
      }

      // Aucun rôle disponible (ex: connexion Google depuis /sign-in sans compte existant)
      // → page de choix de rôle
      return NextResponse.redirect(`${requestUrl.origin}/onboarding/role`)
    }
  }  // fin bloc user

  return NextResponse.redirect(`${requestUrl.origin}/`)
}

