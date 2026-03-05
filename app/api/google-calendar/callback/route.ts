/**
 * GET /api/google-calendar/callback
 *
 * Callback OAuth Google Calendar.
 * Google redirige ici avec un `code` qu'on échange contre des tokens.
 * Les tokens sont stockés dans la table `profiles` (prestataire) ou `couples` (couple).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const userId = searchParams.get('state')

    // L'utilisateur a refusé l'accès
    if (error) {
      console.error('[GoogleCalendar/callback] Erreur OAuth:', error)
      return NextResponse.redirect(new URL('/prestataire/agenda?gcal_error=denied', req.url))
    }

    if (!code || !userId) {
      return NextResponse.redirect(new URL('/prestataire/agenda?gcal_error=missing_code', req.url))
    }

    // Vérifier que l'utilisateur est bien authentifié
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.redirect(new URL('/sign-in?gcal_error=auth', req.url))
    }

    // Construire l'URL de callback (retirer le trailing slash)
    const rawBase = process.env.NEXT_PUBLIC_APP_URL
      || process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000')
    const baseUrl = rawBase.replace(/\/+$/, '')

    const redirectUri = `${baseUrl}/api/google-calendar/callback`

    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('[GoogleCalendar/callback] Variables d\'environnement manquantes')
      return NextResponse.redirect(new URL('/prestataire/agenda?gcal_error=config', req.url))
    }

    // Échanger le code contre des tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      const body = await tokenRes.text()
      console.error('[GoogleCalendar/callback] Erreur échange code:', body)
      return NextResponse.redirect(new URL('/prestataire/agenda?gcal_error=token_exchange', req.url))
    }

    const tokenData = await tokenRes.json()
    const { access_token, refresh_token, expires_in } = tokenData

    if (!access_token) {
      console.error('[GoogleCalendar/callback] Pas d\'access_token dans la réponse')
      return NextResponse.redirect(new URL('/prestataire/agenda?gcal_error=no_token', req.url))
    }

    const tokenExpiry = new Date(Date.now() + (expires_in ?? 3600) * 1000).toISOString()

    const tokenFields = {
      google_calendar_enabled: true,
      google_calendar_token: access_token,
      google_calendar_refresh_token: refresh_token ?? null,
      google_calendar_token_expiry: tokenExpiry,
    }

    // Détecter le rôle et sauvegarder les tokens
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    let redirectPath = '/prestataire/agenda'

    if (profile) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(tokenFields)
        .eq('id', user.id)

      if (updateError) {
        console.error('[GoogleCalendar/callback] Erreur update profiles:', updateError)
        return NextResponse.redirect(new URL(`${redirectPath}?gcal_error=save`, req.url))
      }

      redirectPath = profile.role === 'couple' ? '/couple/dashboard' : '/prestataire/agenda'
    } else {
      // Essayer la table couples
      const { error: updateError } = await supabase
        .from('couples')
        .update(tokenFields)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('[GoogleCalendar/callback] Erreur update couples:', updateError)
        return NextResponse.redirect(new URL('/couple/dashboard?gcal_error=save', req.url))
      }
      redirectPath = '/couple/dashboard'
    }

    return NextResponse.redirect(new URL(`${redirectPath}?gcal_connected=true`, req.url))
  } catch (err) {
    console.error('[GoogleCalendar/callback]', err)
    return NextResponse.redirect(new URL('/prestataire/agenda?gcal_error=unknown', req.url))
  }
}
