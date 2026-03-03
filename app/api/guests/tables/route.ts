import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const createTableSchema = z.object({
  table_number: z.number().int().positive(),
  table_name:   z.string().max(100).optional().nullable(),
  capacity:     z.number().int().positive().max(50).default(8),
  shape:        z.enum(['round', 'rectangular', 'oval']).default('round'),
  notes:        z.string().max(500).optional().nullable(),
})

async function getAuthenticatedCoupleId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { coupleId: null, error: 'Non authentifié', status: 401 }

  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!couple) return { coupleId: null, error: 'Profil couple introuvable', status: 404 }
  return { coupleId: couple.id as string, error: null, status: 200 }
}

// GET /api/guests/tables — liste toutes les tables + invités assignés
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { coupleId, error, status } = await getAuthenticatedCoupleId(supabase)
    if (error) return NextResponse.json({ error }, { status })

    const [tablesResult, guestsResult] = await Promise.all([
      supabase
        .from('couple_reception_tables')
        .select('*')
        .eq('couple_id', coupleId!)
        .order('table_number', { ascending: true }),
      supabase
        .from('couple_guests')
        .select('id, first_name, last_name, rsvp_status, dietary_restrictions, plus_one, plus_one_name, table_number, side, category')
        .eq('couple_id', coupleId!),
    ])

    if (tablesResult.error) throw tablesResult.error

    const guests = guestsResult.data || []
    const tables = (tablesResult.data || []).map((t) => ({
      ...t,
      guests: guests.filter((g) => g.table_number === t.table_number),
    }))

    // Invités sans table assignée
    const unassigned = guests.filter((g) => g.table_number === null)

    return NextResponse.json({ tables, unassigned })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/guests/tables — crée une table
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { coupleId, error, status } = await getAuthenticatedCoupleId(supabase)
    if (error) return NextResponse.json({ error }, { status })

    const body = await request.json()
    const validation = createTableSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { data: table, error: dbError } = await supabase
      .from('couple_reception_tables')
      .insert({ ...validation.data, couple_id: coupleId })
      .select()
      .single()

    if (dbError) {
      if (dbError.code === '23505') {
        return NextResponse.json({ error: 'Ce numéro de table existe déjà' }, { status: 409 })
      }
      throw dbError
    }

    return NextResponse.json({ table }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
