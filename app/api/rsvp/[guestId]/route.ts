import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Schéma de validation ─────────────────────────────────────────────────────

const rsvpSchema = z.object({
  rsvp_status: z.enum(['confirmed', 'declined', 'maybe']),
})

// ─── GET /api/rsvp/[guestId] ──────────────────────────────────────────────────
// Route publique : retourne les infos de l'invité + du couple (sans auth).
// Utilisée par la page /rsvp/[guestId] pour afficher l'invitation.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  try {
    const { guestId } = await params
    const supabase = createAdminClient()

    const { data: guest, error } = await supabase
      .from('couple_guests')
      .select(`
        id,
        first_name,
        last_name,
        rsvp_status,
        couples:couple_id (
          partner_1_name,
          partner_2_name,
          wedding_date,
          wedding_city
        )
      `)
      .eq('id', guestId)
      .single()

    if (error || !guest) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 })
    }

    return NextResponse.json({ guest })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── POST /api/rsvp/[guestId] ─────────────────────────────────────────────────
// Route publique : met à jour le statut RSVP de l'invité (sans auth).
// Le guest.id (UUID v4) fait office de token non-devinable.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  try {
    const { guestId } = await params
    const supabase = createAdminClient()

    // Validation du payload
    const body = await req.json()
    const validation = rsvpSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Statut RSVP invalide' }, { status: 400 })
    }

    // Vérifier que l'invité existe avant de mettre à jour
    const { data: existing, error: fetchError } = await supabase
      .from('couple_guests')
      .select('id')
      .eq('id', guestId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 })
    }

    // Mettre à jour le statut RSVP
    const { data: guest, error: updateError } = await supabase
      .from('couple_guests')
      .update({
        rsvp_status:       validation.data.rsvp_status,
        rsvp_responded_at: new Date().toISOString(),
      })
      .eq('id', guestId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ guest })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
