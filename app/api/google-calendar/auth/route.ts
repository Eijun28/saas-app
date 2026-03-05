/**
 * GET /api/google-calendar/auth
 *
 * Initie le flow OAuth Google Calendar.
 * Redirige l'utilisateur vers l'écran de consentement Google
 * avec le scope calendar pour autoriser l'accès.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
    if (!clientId) {
      return NextResponse.json(
        { error: 'GOOGLE_CALENDAR_CLIENT_ID non configuré' },
        { status: 500 },
      )
    }

    // Construire l'URL de base pour le callback (retirer le trailing slash)
    const rawBase = process.env.NEXT_PUBLIC_APP_URL
      || process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000')
    const baseUrl = rawBase.replace(/\/+$/, '')

    const redirectUri = `${baseUrl}/api/google-calendar/callback`

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar',
      access_type: 'offline',
      prompt: 'consent',
      state: user.id,
    })

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    return NextResponse.redirect(googleAuthUrl)
  } catch (err) {
    console.error('[GoogleCalendar/auth]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
