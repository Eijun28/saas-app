/**
 * POST /api/google-calendar/sync
 *
 * Synchronise les événements entre l'appli et Google Calendar.
 *
 * Body:
 *   { direction: 'push' | 'pull' | 'both', months_ahead?: number }
 *
 * Pour les PRESTATAIRES :
 *   push → evenements_prestataire → Google Calendar
 *   pull → Google Calendar → provider_availability (bloque les dates)
 *
 * Pour les COUPLES :
 *   push → timeline_events + couple_events → Google Calendar
 *   pull → (non implémenté pour l'instant)
 *
 * Impact sur le MATCHING :
 *   Les dates importées (pull) créent des entrées dans provider_availability.
 *   Quand un couple cherche un prestataire pour sa date de mariage,
 *   l'algorithme vérifie provider_availability et exclut les dates bloquées.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getValidAccessToken,
  fetchGoogleEvents,
  createGoogleEvent,
  updateGoogleEvent,
  formatPrestaireEventForGoogle,
  formatTimelineEventForGoogle,
  googleEventToAvailability,
  type GoogleTokens,
} from '@/lib/google-calendar'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateRange(monthsAhead: number) {
  const now  = new Date()
  const from = now.toISOString()
  const to   = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 1).toISOString()
  return { from, to }
}

// ─── Sync prestataire : PUSH (evenements_prestataire → Google) ────────────────

async function syncPrestatairePush(
  supabase: any,
  userId: string,
  accessToken: string,
  calendarId: string,
): Promise<{ pushed: number; errors: string[] }> {
  let pushed = 0
  const errors: string[] = []

  // Charger les events sans google_event_id (jamais pushés) ou modifiés récemment
  const { data: events, error } = await supabase
    .from('evenements_prestataire')
    .select('*')
    .eq('prestataire_id', userId)
    .gte('date', new Date().toISOString().split('T')[0]) // futurs seulement
    .order('date', { ascending: true })

  if (error || !events) {
    errors.push(`Erreur chargement events: ${error?.message}`)
    return { pushed, errors }
  }

  for (const event of events) {
    try {
      const googleEvent = formatPrestaireEventForGoogle({
        titre:       event.titre,
        date:        event.date,
        heure_debut: event.heure_debut,
        heure_fin:   event.heure_fin,
        lieu:        event.lieu,
        notes:       event.notes,
      })

      if (event.google_event_id) {
        // Mettre à jour l'event existant
        await updateGoogleEvent(accessToken, event.google_event_id, googleEvent, calendarId)
      } else {
        // Créer un nouvel event
        const googleId = await createGoogleEvent(accessToken, googleEvent, calendarId)
        if (googleId) {
          await supabase
            .from('evenements_prestataire')
            .update({ google_event_id: googleId, google_synced_at: new Date().toISOString() })
            .eq('id', event.id)
          pushed++
        }
      }
    } catch (err: any) {
      errors.push(`Event "${event.titre}": ${err.message}`)
    }
  }

  return { pushed, errors }
}

// ─── Sync prestataire : PULL (Google → provider_availability) ────────────────

async function syncPrestatairePull(
  supabase: any,
  userId: string,
  accessToken: string,
  calendarId: string,
  monthsAhead: number,
): Promise<{ pulled: number; errors: string[] }> {
  let pulled = 0
  const errors: string[] = []

  const { from, to } = getDateRange(monthsAhead)

  // Récupérer les events Google
  let googleEvents
  try {
    googleEvents = await fetchGoogleEvents(accessToken, calendarId, from, to)
  } catch (err: any) {
    errors.push(`Erreur lecture Google Calendar: ${err.message}`)
    return { pulled, errors }
  }

  // Récupérer les google_event_id déjà en base pour éviter les doublons
  const { data: existingSlots } = await supabase
    .from('provider_availability')
    .select('google_event_id')
    .eq('provider_id', userId)
    .not('google_event_id', 'is', null)

  const existingGoogleIds = new Set(
    (existingSlots ?? []).map((s: any) => s.google_event_id)
  )

  for (const gEvent of googleEvents) {
    // Ignorer les events déjà importés
    if (gEvent.id && existingGoogleIds.has(gEvent.id)) continue

    const availability = googleEventToAvailability(gEvent)
    if (!availability) continue

    try {
      const { error } = await supabase
        .from('provider_availability')
        .insert({
          provider_id:    userId,
          start_date:     availability.start_date,
          end_date:       availability.end_date,
          status:         availability.status,
          note:           availability.note,
          is_public:      true,
          google_event_id: gEvent.id,
          google_synced_at: new Date().toISOString(),
        })

      if (!error) pulled++
      else errors.push(`Import "${gEvent.summary}": ${error.message}`)
    } catch (err: any) {
      errors.push(`Import "${gEvent.summary}": ${err.message}`)
    }
  }

  return { pulled, errors }
}

// ─── Sync couple : PUSH (timeline_events + couple_events → Google) ────────────

async function syncCouplePush(
  supabase: any,
  userId: string,
  accessToken: string,
  calendarId: string,
): Promise<{ pushed: number; errors: string[] }> {
  let pushed = 0
  const errors: string[] = []

  // Charger les timeline_events
  const { data: timelineEvents } = await supabase
    .from('timeline_events')
    .select('*')
    .eq('couple_id', userId)
    .order('event_date', { ascending: true })

  for (const event of timelineEvents ?? []) {
    if (!event.event_date) continue
    try {
      const googleEvent = formatTimelineEventForGoogle({
        title:       event.title,
        event_date:  event.event_date,
        description: event.description,
      })

      if (event.google_event_id) {
        await updateGoogleEvent(accessToken, event.google_event_id, googleEvent, calendarId)
      } else {
        const googleId = await createGoogleEvent(accessToken, googleEvent, calendarId)
        if (googleId) {
          await supabase
            .from('timeline_events')
            .update({ google_event_id: googleId, google_synced_at: new Date().toISOString() })
            .eq('id', event.id)
          pushed++
        }
      }
    } catch (err: any) {
      errors.push(`Timeline "${event.title}": ${err.message}`)
    }
  }

  // Charger les couple_events
  const { data: coupleEvents } = await supabase
    .from('couple_events')
    .select('*, cultural_event_types(label)')
    .eq('couple_id', userId)

  for (const event of coupleEvents ?? []) {
    if (!event.event_date) continue
    try {
      const dateStr = new Date(event.event_date).toISOString().substring(0, 10)
      const label = event.cultural_event_types?.label ?? 'Événement'
      const googleEvent = formatTimelineEventForGoogle({
        title:       label,
        event_date:  dateStr,
        description: event.description,
      })

      const googleId = await createGoogleEvent(accessToken, googleEvent, calendarId)
      if (googleId) pushed++
    } catch (err: any) {
      errors.push(`Événement couple: ${err.message}`)
    }
  }

  return { pushed, errors }
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const direction   = body.direction   as 'push' | 'pull' | 'both' ?? 'both'
    const monthsAhead = body.months_ahead as number ?? 12

    // ── Détecter le rôle et charger les tokens ────────────────────────────────
    let tokens: GoogleTokens | null = null
    let calendarId = 'primary'
    let role: 'prestataire' | 'couple' | null = null

    const { data: profile } = await supabase
      .from('profiles')
      .select('google_calendar_enabled, google_calendar_token, google_calendar_refresh_token, google_calendar_token_expiry, google_calendar_id')
      .eq('id', user.id)
      .single()

    if (profile?.google_calendar_enabled && profile.google_calendar_token) {
      role = 'prestataire'
      calendarId = profile.google_calendar_id ?? 'primary'
      tokens = {
        access_token:   profile.google_calendar_token,
        refresh_token:  profile.google_calendar_refresh_token ?? undefined,
        token_expiry:   profile.google_calendar_token_expiry ?? undefined,
      }
    } else {
      const { data: couple } = await supabase
        .from('couples')
        .select('google_calendar_enabled, google_calendar_token, google_calendar_refresh_token, google_calendar_token_expiry, google_calendar_id')
        .eq('user_id', user.id)
        .single()

      if (couple?.google_calendar_enabled && couple.google_calendar_token) {
        role = 'couple'
        calendarId = couple.google_calendar_id ?? 'primary'
        tokens = {
          access_token:  couple.google_calendar_token,
          refresh_token: couple.google_calendar_refresh_token ?? undefined,
          token_expiry:  couple.google_calendar_token_expiry ?? undefined,
        }
      }
    }

    if (!tokens || !role) {
      return NextResponse.json(
        { error: 'Google Calendar non connecté. Connectez-le d\'abord.' },
        { status: 400 },
      )
    }

    // ── Obtenir un token valide (refresh si nécessaire) ───────────────────────
    const accessToken = await getValidAccessToken(tokens)
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Impossible d\'obtenir un token Google valide. Reconnectez Google Calendar.' },
        { status: 401 },
      )
    }

    // ── Effectuer la synchronisation ──────────────────────────────────────────
    let totalPushed = 0
    let totalPulled = 0
    const allErrors: string[] = []

    if (role === 'prestataire') {
      if (direction === 'push' || direction === 'both') {
        const { pushed, errors } = await syncPrestatairePush(supabase, user.id, accessToken, calendarId)
        totalPushed += pushed
        allErrors.push(...errors)
      }
      if (direction === 'pull' || direction === 'both') {
        const { pulled, errors } = await syncPrestatairePull(supabase, user.id, accessToken, calendarId, monthsAhead)
        totalPulled += pulled
        allErrors.push(...errors)
      }

      // Mettre à jour last_sync
      await supabase.from('profiles').update({ google_calendar_last_sync: new Date().toISOString() }).eq('id', user.id)
    }

    if (role === 'couple') {
      if (direction === 'push' || direction === 'both') {
        const { pushed, errors } = await syncCouplePush(supabase, user.id, accessToken, calendarId)
        totalPushed += pushed
        allErrors.push(...errors)
      }

      await supabase.from('couples').update({ google_calendar_last_sync: new Date().toISOString() }).eq('user_id', user.id)
    }

    return NextResponse.json({
      success: true,
      role,
      direction,
      pushed:    totalPushed,
      pulled:    totalPulled,
      errors:    allErrors,
      last_sync: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('[GoogleCalendar/sync]', err)
    return NextResponse.json(
      { error: err?.message ?? 'Erreur lors de la synchronisation' },
      { status: 500 },
    )
  }
}
