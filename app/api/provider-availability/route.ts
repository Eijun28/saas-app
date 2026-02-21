import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ─── Schéma ───────────────────────────────────────────────────────────────────

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const createSchema = z.object({
  start_date: z.string().regex(dateRegex, 'Format date invalide (YYYY-MM-DD)'),
  end_date:   z.string().regex(dateRegex, 'Format date invalide (YYYY-MM-DD)'),
  status:     z.enum(['unavailable', 'tentative']).default('unavailable'),
  note:       z.string().max(500).optional().nullable(),
  is_public:  z.boolean().default(true),
})

// ─── GET /api/provider-availability ──────────────────────────────────────────
// Retourne tous les créneaux du prestataire connecté (publics + privés).

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: slots, error } = await supabase
      .from('provider_availability')
      .select('*')
      .eq('provider_id', user.id)
      .order('start_date', { ascending: true })

    if (error) return NextResponse.json({ error: 'Erreur lors du chargement' }, { status: 500 })

    return NextResponse.json({ slots })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── POST /api/provider-availability ─────────────────────────────────────────
// Crée un nouveau créneau.

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const validation = createSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { start_date, end_date } = validation.data
    if (end_date < start_date) {
      return NextResponse.json(
        { error: 'La date de fin doit être égale ou postérieure à la date de début' },
        { status: 400 }
      )
    }

    const { data: slot, error } = await supabase
      .from('provider_availability')
      .insert({ ...validation.data, provider_id: user.id })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })

    return NextResponse.json({ slot }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
