/**
 * POST /api/google-calendar/connect
 *
 * Reçoit les tokens Google depuis le client (via la session Supabase)
 * et les stocke en base pour permettre la synchronisation serveur-side.
 *
 * Body:
 *   { provider_token, provider_refresh_token?, token_expiry? }
 *
 * Le client récupère ces valeurs depuis :
 *   const { data: { session } } = await supabase.auth.getSession()
 *   session.provider_token
 *   session.provider_refresh_token
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateGoogleToken } from '@/lib/google-calendar'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { provider_token, provider_refresh_token, token_expiry } = body

    if (!provider_token) {
      return NextResponse.json(
        { error: 'provider_token manquant. Assurez-vous d\'être connecté avec Google.' },
        { status: 400 },
      )
    }

    // Valider que le token fonctionne bien avec Google Calendar
    const isValid = await validateGoogleToken(provider_token)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Token Google invalide ou expiré. Reconnectez-vous avec Google.' },
        { status: 401 },
      )
    }

    // Calculer l'expiration (par défaut 1h si non fourni)
    const expiry = token_expiry
      ? new Date(token_expiry).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString()

    const tokenFields = {
      google_calendar_enabled:       true,
      google_calendar_token:         provider_token,
      google_calendar_refresh_token: provider_refresh_token ?? null,
      google_calendar_token_expiry:  expiry,
    }

    // Détecter le rôle et sauvegarder
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profile) {
      const { error } = await supabase
        .from('profiles')
        .update(tokenFields)
        .eq('id', user.id)
      if (error) throw error
      return NextResponse.json({ success: true, role: 'prestataire' })
    }

    const { error } = await supabase
      .from('couples')
      .update(tokenFields)
      .eq('user_id', user.id)
    if (error) throw error

    return NextResponse.json({ success: true, role: 'couple' })
  } catch (err: any) {
    console.error('[GoogleCalendar/connect]', err)
    return NextResponse.json(
      { error: err?.message ?? 'Erreur lors de la connexion' },
      { status: 500 },
    )
  }
}
