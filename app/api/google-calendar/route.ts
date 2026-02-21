/**
 * GET  /api/google-calendar  → statut de la connexion Google Calendar
 * DELETE /api/google-calendar → déconnecter (supprimer les tokens)
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── GET : status de la connexion ────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Détecter si c'est un prestataire ou un couple
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_calendar_enabled, google_calendar_last_sync, google_calendar_id')
      .eq('id', user.id)
      .single()

    if (profile) {
      return NextResponse.json({
        role: 'prestataire',
        connected:   profile.google_calendar_enabled ?? false,
        last_sync:   profile.google_calendar_last_sync ?? null,
        calendar_id: profile.google_calendar_id ?? 'primary',
      })
    }

    const { data: couple } = await supabase
      .from('couples')
      .select('google_calendar_enabled, google_calendar_last_sync, google_calendar_id')
      .eq('user_id', user.id)
      .single()

    if (couple) {
      return NextResponse.json({
        role: 'couple',
        connected:   couple.google_calendar_enabled ?? false,
        last_sync:   couple.google_calendar_last_sync ?? null,
        calendar_id: couple.google_calendar_id ?? 'primary',
      })
    }

    return NextResponse.json({ connected: false, role: null })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── DELETE : déconnecter Google Calendar ────────────────────────────────────

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const clearFields = {
      google_calendar_enabled:       false,
      google_calendar_token:         null,
      google_calendar_refresh_token: null,
      google_calendar_token_expiry:  null,
      google_calendar_last_sync:     null,
    }

    // Essayer d'abord prestataire
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profile) {
      await supabase.from('profiles').update(clearFields).eq('id', user.id)
      return NextResponse.json({ success: true, role: 'prestataire' })
    }

    // Sinon couple
    await supabase.from('couples').update(clearFields).eq('user_id', user.id)
    return NextResponse.json({ success: true, role: 'couple' })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
