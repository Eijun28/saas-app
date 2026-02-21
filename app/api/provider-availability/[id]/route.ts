import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ─── Schéma ───────────────────────────────────────────────────────────────────

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const updateSchema = z.object({
  start_date: z.string().regex(dateRegex).optional(),
  end_date:   z.string().regex(dateRegex).optional(),
  status:     z.enum(['unavailable', 'tentative']).optional(),
  note:       z.string().max(500).optional().nullable(),
  is_public:  z.boolean().optional(),
})

// ─── Helper ───────────────────────────────────────────────────────────────────

async function getOwnSlot(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { slot: null, error: 'Non authentifié', status: 401 }

  const { data: slot } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('id', id)
    .eq('provider_id', user.id)
    .single()

  if (!slot) return { slot: null, error: 'Créneau introuvable', status: 404 }
  return { slot, error: null, status: 200 }
}

// ─── PATCH /api/provider-availability/[id] ───────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { slot, error, status } = await getOwnSlot(supabase, id)
    if (error || !slot) return NextResponse.json({ error }, { status })

    const body = await request.json()
    const validation = updateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const updateData = validation.data
    const startDate = updateData.start_date ?? slot.start_date
    const endDate   = updateData.end_date   ?? slot.end_date

    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'La date de fin doit être égale ou postérieure à la date de début' },
        { status: 400 }
      )
    }

    const { data: updated, error: dbError } = await supabase
      .from('provider_availability')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (dbError) return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })

    return NextResponse.json({ slot: updated })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── DELETE /api/provider-availability/[id] ──────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { slot, error, status } = await getOwnSlot(supabase, id)
    if (error || !slot) return NextResponse.json({ error }, { status })

    const { error: dbError } = await supabase
      .from('provider_availability')
      .delete()
      .eq('id', id)

    if (dbError) return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
