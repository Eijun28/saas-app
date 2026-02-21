import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ─── Schéma mise à jour ───────────────────────────────────────────────────────

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

const updateItemSchema = z.object({
  start_time:  z.string().regex(timeRegex, 'Format heure invalide (HH:MM)').optional(),
  end_time:    z.string().regex(timeRegex, 'Format heure invalide (HH:MM)').optional().nullable(),
  title:       z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  location:    z.string().max(300).optional().nullable(),
  responsible: z.string().max(200).optional().nullable(),
  provider_id: z.string().uuid().optional().nullable(),
  category:    z.enum(['ceremonie', 'cocktail', 'repas', 'animation', 'logistique', 'beaute', 'photos', 'autre']).optional(),
  is_public:   z.boolean().optional(),
  sort_order:  z.number().int().optional(),
})

// ─── Helper ───────────────────────────────────────────────────────────────────

async function getItemWithOwnerCheck(
  supabase: Awaited<ReturnType<typeof createClient>>,
  itemId: string
) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { item: null, error: 'Non authentifié', status: 401 }

  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!couple) return { item: null, error: 'Profil couple introuvable', status: 404 }

  const { data: item } = await supabase
    .from('wedding_day_program')
    .select('*')
    .eq('id', itemId)
    .eq('couple_id', couple.id)
    .single()

  if (!item) return { item: null, error: 'Créneau introuvable', status: 404 }
  return { item, error: null, status: 200 }
}

// ─── PATCH /api/wedding-day-program/[id] ─────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { item, error, status } = await getItemWithOwnerCheck(supabase, id)
    if (error || !item) return NextResponse.json({ error }, { status })

    const body = await request.json()
    const validation = updateItemSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const updateData = validation.data
    const startTime = updateData.start_time ?? item.start_time
    const endTime   = updateData.end_time !== undefined ? updateData.end_time : item.end_time

    if (endTime && endTime <= startTime) {
      return NextResponse.json(
        { error: 'L\'heure de fin doit être après l\'heure de début' },
        { status: 400 }
      )
    }

    const { data: updated, error: dbError } = await supabase
      .from('wedding_day_program')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (dbError) return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })

    return NextResponse.json({ item: updated })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── DELETE /api/wedding-day-program/[id] ────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { item, error, status } = await getItemWithOwnerCheck(supabase, id)
    if (error || !item) return NextResponse.json({ error }, { status })

    const { error: dbError } = await supabase
      .from('wedding_day_program')
      .delete()
      .eq('id', id)

    if (dbError) return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
