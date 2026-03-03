import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const updateTableSchema = z.object({
  table_number: z.number().int().positive().optional(),
  table_name:   z.string().max(100).optional().nullable(),
  capacity:     z.number().int().positive().max(50).optional(),
  shape:        z.enum(['round', 'rectangular', 'oval']).optional(),
  notes:        z.string().max(500).optional().nullable(),
})

async function getTableWithOwnerCheck(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tableId: string
) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { table: null, error: 'Non authentifié', status: 401 }

  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!couple) return { table: null, error: 'Profil couple introuvable', status: 404 }

  const { data: table } = await supabase
    .from('couple_reception_tables')
    .select('*')
    .eq('id', tableId)
    .eq('couple_id', couple.id)
    .single()

  if (!table) return { table: null, error: 'Table introuvable', status: 404 }

  return { table, coupleId: couple.id as string, error: null, status: 200 }
}

// PATCH /api/guests/tables/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { table, error, status } = await getTableWithOwnerCheck(supabase, id)
    if (error || !table) return NextResponse.json({ error }, { status })

    const body = await request.json()
    const validation = updateTableSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { data: updated, error: dbError } = await supabase
      .from('couple_reception_tables')
      .update(validation.data)
      .eq('id', id)
      .select()
      .single()

    if (dbError) {
      if (dbError.code === '23505') {
        return NextResponse.json({ error: 'Ce numéro de table existe déjà' }, { status: 409 })
      }
      throw dbError
    }

    return NextResponse.json({ table: updated })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/guests/tables/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { table, coupleId, error, status } = await getTableWithOwnerCheck(supabase, id)
    if (error || !table) return NextResponse.json({ error }, { status })

    // Désassigner les invités de cette table avant suppression
    await supabase
      .from('couple_guests')
      .update({ table_number: null })
      .eq('couple_id', coupleId!)
      .eq('table_number', (table as { table_number: number }).table_number)

    const { error: dbError } = await supabase
      .from('couple_reception_tables')
      .delete()
      .eq('id', id)

    if (dbError) throw dbError

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
