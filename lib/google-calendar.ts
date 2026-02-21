/**
 * lib/google-calendar.ts
 *
 * Helpers pour l'intégration Google Calendar.
 *
 * Variables d'environnement requises (à ajouter dans .env.local) :
 *   GOOGLE_CALENDAR_CLIENT_ID      — ID OAuth de ton projet Google Cloud
 *   GOOGLE_CALENDAR_CLIENT_SECRET  — Secret OAuth
 *
 * Ces credentials sont différents de ceux que Supabase utilise pour le login
 * (même si tu peux réutiliser les mêmes en ajoutant le scope calendar dans la
 * Google Cloud Console).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoogleTokens {
  access_token: string
  refresh_token?: string
  token_expiry?: string // ISO string
}

export interface GoogleCalendarEvent {
  id?: string
  summary: string
  description?: string
  location?: string
  start: { date?: string; dateTime?: string; timeZone?: string }
  end:   { date?: string; dateTime?: string; timeZone?: string }
  colorId?: string
}

export interface SyncResult {
  pushed: number
  pulled: number
  errors: string[]
  last_sync: string
}

// ─── Token Management ─────────────────────────────────────────────────────────

/**
 * Rafraîchit un access_token Google via le refresh_token.
 * Nécessite GOOGLE_CALENDAR_CLIENT_ID + GOOGLE_CALENDAR_CLIENT_SECRET en env.
 */
export async function refreshGoogleToken(refreshToken: string): Promise<{
  access_token: string
  expires_in: number
} | null> {
  const clientId     = process.env.GOOGLE_CALENDAR_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('[GoogleCalendar] GOOGLE_CALENDAR_CLIENT_ID ou GOOGLE_CALENDAR_CLIENT_SECRET manquant')
    return null
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type:    'refresh_token',
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[GoogleCalendar] Erreur refresh token:', body)
      return null
    }

    return await res.json()
  } catch (err) {
    console.error('[GoogleCalendar] Exception refresh token:', err)
    return null
  }
}

/**
 * Retourne un access_token valide.
 * - Si le token actuel est encore valide (> 5 min de marge) → le retourner tel quel
 * - Sinon → le rafraîchir via le refresh_token
 */
export async function getValidAccessToken(tokens: GoogleTokens): Promise<string | null> {
  if (tokens.token_expiry) {
    const expiryMs  = new Date(tokens.token_expiry).getTime()
    const bufferMs  = 5 * 60 * 1000 // 5 minutes de marge
    const isExpired = Date.now() > expiryMs - bufferMs

    if (!isExpired) return tokens.access_token
  }

  if (!tokens.refresh_token) {
    console.warn('[GoogleCalendar] Pas de refresh_token, impossible de renouveler')
    return tokens.access_token // tenter avec l'ancien, il fonctionne peut-être encore
  }

  const refreshed = await refreshGoogleToken(tokens.refresh_token)
  if (!refreshed) return null

  return refreshed.access_token
}

// ─── Google Calendar API Calls ────────────────────────────────────────────────

/**
 * Récupère les events Google Calendar entre deux dates.
 */
export async function fetchGoogleEvents(
  accessToken: string,
  calendarId: string = 'primary',
  timeMin: string,  // ISO 8601
  timeMax: string,  // ISO 8601
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents:  'true',
    orderBy:       'startTime',
    maxResults:    '2500',
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google Calendar list error ${res.status}: ${body}`)
  }

  const data = await res.json()
  return data.items ?? []
}

/**
 * Crée un event dans Google Calendar.
 * Retourne l'ID de l'event créé.
 */
export async function createGoogleEvent(
  accessToken: string,
  event: GoogleCalendarEvent,
  calendarId: string = 'primary',
): Promise<string | null> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    },
  )

  if (!res.ok) {
    const body = await res.text()
    console.error(`[GoogleCalendar] Erreur création event: ${body}`)
    return null
  }

  const created = await res.json()
  return created.id ?? null
}

/**
 * Met à jour un event existant dans Google Calendar.
 */
export async function updateGoogleEvent(
  accessToken: string,
  googleEventId: string,
  event: Partial<GoogleCalendarEvent>,
  calendarId: string = 'primary',
): Promise<boolean> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
    {
      method:  'PATCH',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    },
  )

  if (!res.ok) {
    const body = await res.text()
    console.error(`[GoogleCalendar] Erreur update event ${googleEventId}: ${body}`)
    return false
  }

  return true
}

/**
 * Supprime un event Google Calendar.
 */
export async function deleteGoogleEvent(
  accessToken: string,
  googleEventId: string,
  calendarId: string = 'primary',
): Promise<boolean> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
    {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )

  // 204 = succès, 404 = déjà supprimé (on considère que c'est OK)
  return res.status === 204 || res.status === 404
}

/**
 * Vérifie que l'access_token est valide en appelant l'API Google.
 */
export async function validateGoogleToken(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    return res.ok
  } catch {
    return false
  }
}

// ─── Event Formatters ─────────────────────────────────────────────────────────

/**
 * Formate un event prestataire (evenements_prestataire) → GoogleCalendarEvent.
 */
export function formatPrestaireEventForGoogle(event: {
  titre:       string
  date:        string  // YYYY-MM-DD
  heure_debut: string  // HH:MM
  heure_fin?:  string
  lieu?:       string
  notes?:      string
}): GoogleCalendarEvent {
  const startDateTime = `${event.date}T${event.heure_debut}:00`
  const endDateTime   = event.heure_fin
    ? `${event.date}T${event.heure_fin}:00`
    : `${event.date}T${event.heure_debut.split(':')[0].padStart(2, '0')}:00` // même heure + 1h par défaut

  // Calcul fin +1h si pas d'heure de fin
  let endDT = endDateTime
  if (!event.heure_fin) {
    const [h, m] = event.heure_debut.split(':').map(Number)
    const endH = String(Math.min(h + 1, 23)).padStart(2, '0')
    endDT = `${event.date}T${endH}:${String(m).padStart(2, '0')}:00`
  }

  return {
    summary:     event.titre,
    description: event.notes,
    location:    event.lieu,
    start:       { dateTime: startDateTime, timeZone: 'Europe/Paris' },
    end:         { dateTime: endDT,         timeZone: 'Europe/Paris' },
    colorId:     '3', // vert sage (ton violet n'est pas disponible, 3 = Sage)
  }
}

/**
 * Formate un timeline_event couple → GoogleCalendarEvent.
 */
export function formatTimelineEventForGoogle(event: {
  title:       string
  event_date:  string // YYYY-MM-DD
  description?: string
}): GoogleCalendarEvent {
  return {
    summary:     `💍 ${event.title}`,
    description: event.description,
    start:       { date: event.event_date },
    end:         { date: event.event_date },
    colorId:     '1', // lavande
  }
}

/**
 * Convertit un event Google Calendar en entrée provider_availability.
 * Utilisé pour importer les events Google → disponibilités prestataire.
 */
export function googleEventToAvailability(event: GoogleCalendarEvent): {
  start_date: string
  end_date:   string
  note:       string
  status:     'unavailable'
} | null {
  // On ignore les events sans date (événements récurrents complexes, etc.)
  const startDate = event.start.date ?? event.start.dateTime?.substring(0, 10)
  const endDate   = event.end.date   ?? event.end.dateTime?.substring(0, 10)

  if (!startDate || !endDate) return null

  // Pour les events dateTime (avec heure), la date de fin Google = lendemain (convention)
  // On soustrait 1 jour si c'est une date entière (all-day events in Google)
  let adjustedEnd = endDate
  if (event.end.date && event.end.date !== startDate) {
    // Google Calendar all-day: end date is exclusive → on soustrait 1 jour
    const d = new Date(endDate)
    d.setDate(d.getDate() - 1)
    adjustedEnd = d.toISOString().substring(0, 10)
  }

  return {
    start_date: startDate,
    end_date:   adjustedEnd < startDate ? startDate : adjustedEnd,
    note:       `Importé depuis Google Calendar: ${event.summary}`,
    status:     'unavailable',
  }
}
