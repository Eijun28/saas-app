import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ─── Schéma de mise à jour (tous les champs optionnels) ──────────────────────

const updateGuestSchema = z.object({
  first_name:           z.string().min(1).max(100).optional(),
  last_name:            z.string().max(100).optional(),
  email:                z.string().email('Email invalide').optional().nullable(),
  phone:                z.string().max(30).optional().nullable(),
  side:                 z.enum(['partner_1', 'partner_2', 'commun']).optional(),
  category:             z.enum(['famille', 'ami', 'collegue', 'autre']).optional(),
  rsvp_status:          z.enum(['pending', 'confirmed', 'declined', 'maybe']).optional(),
  rsvp_responded_at:    z.string().datetime().optional().nullable(),
  dietary_restrictions: z.array(z.string()).optional(),
  plus_one:             z.boolean().optional(),
  plus_one_name:        z.string().max(200).optional().nullable(),
  table_number:         z.number().int().positive().optional().nullable(),
  notes:                z.string().max(1000).optional().nullable(),
  invitation_sent_at:   z.string().datetime().optional().nullable(),
})

// ─── Helper : vérifie que l'invité appartient bien au couple connecté ─────────

async function getGuestWithOwnerCheck(
  supabase: Awaited<ReturnType<typeof createClient>>,
  guestId: string
) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { guest: null, error: 'Non authentifié', status: 401 }

  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!couple) return { guest: null, error: 'Profil couple introuvable', status: 404 }

  const { data: guest } = await supabase
    .from('couple_guests')
    .select('*')
    .eq('id', guestId)
    .eq('couple_id', couple.id)
    .single()

  if (!guest) return { guest: null, error: 'Invité introuvable', status: 404 }

  return { guest, error: null, status: 200 }
}

// ─── PATCH /api/guests/[id] ───────────────────────────────────────────────────
// Mise à jour partielle d'un invité.

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { guest, error, status } = await getGuestWithOwnerCheck(supabase, id)

    if (error || !guest) {
      return NextResponse.json({ error }, { status })
    }

    const body = await request.json()
    const validation = updateGuestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    // Si on confirme un RSVP et que rsvp_responded_at n'est pas fourni, on le set maintenant
    const updateData = { ...validation.data }
    if (
      updateData.rsvp_status &&
      updateData.rsvp_status !== 'pending' &&
      updateData.rsvp_responded_at === undefined
    ) {
      updateData.rsvp_responded_at = new Date().toISOString()
    }

    const { data: updated, error: dbError } = await supabase
      .from('couple_guests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ guest: updated })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── DELETE /api/guests/[id] ──────────────────────────────────────────────────
// Suppression définitive d'un invité.

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { guest, error, status } = await getGuestWithOwnerCheck(supabase, id)

    if (error || !guest) {
      return NextResponse.json({ error }, { status })
    }

    const { error: dbError } = await supabase
      .from('couple_guests')
      .delete()
      .eq('id', id)

    if (dbError) {
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
