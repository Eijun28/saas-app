import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ─── Schéma ───────────────────────────────────────────────────────────────────

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

const createItemSchema = z.object({
  start_time:  z.string().regex(timeRegex, 'Format heure invalide (HH:MM)'),
  end_time:    z.string().regex(timeRegex, 'Format heure invalide (HH:MM)').optional().nullable(),
  title:       z.string().min(1, 'Le titre est requis').max(200),
  description: z.string().max(2000).optional().nullable(),
  location:    z.string().max(300).optional().nullable(),
  responsible: z.string().max(200).optional().nullable(),
  provider_id: z.string().uuid().optional().nullable(),
  category:    z.enum(['ceremonie', 'cocktail', 'repas', 'animation', 'logistique', 'beaute', 'photos', 'autre'])
               .default('autre'),
  is_public:   z.boolean().default(true),
  sort_order:  z.number().int().default(0),
})

// ─── Helper ───────────────────────────────────────────────────────────────────

async function getAuthenticatedCoupleId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { coupleId: null, error: 'Non authentifié', status: 401 }

  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!couple) return { coupleId: null, error: 'Profil couple introuvable', status: 404 }
  return { coupleId: couple.id as string, error: null, status: 200 }
}

// ─── GET /api/wedding-day-program ─────────────────────────────────────────────
// Retourne tous les créneaux du programme du couple, triés par heure.

export async function GET() {
  try {
    const supabase = await createClient()
    const { coupleId, error, status } = await getAuthenticatedCoupleId(supabase)
    if (error || !coupleId) return NextResponse.json({ error }, { status })

    const { data: items, error: dbError } = await supabase
      .from('wedding_day_program')
      .select('*')
      .eq('couple_id', coupleId)
      .order('start_time', { ascending: true })
      .order('sort_order', { ascending: true })

    if (dbError) return NextResponse.json({ error: 'Erreur lors du chargement du programme' }, { status: 500 })

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── POST /api/wedding-day-program ────────────────────────────────────────────
// Crée un nouveau créneau dans le programme.

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { coupleId, error, status } = await getAuthenticatedCoupleId(supabase)
    if (error || !coupleId) return NextResponse.json({ error }, { status })

    const body = await request.json()
    const validation = createItemSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    // Valider que end_time > start_time si fourni
    const { start_time, end_time } = validation.data
    if (end_time && end_time <= start_time) {
      return NextResponse.json(
        { error: 'L\'heure de fin doit être après l\'heure de début' },
        { status: 400 }
      )
    }

    const { data: item, error: dbError } = await supabase
      .from('wedding_day_program')
      .insert({ ...validation.data, couple_id: coupleId })
      .select()
      .single()

    if (dbError) return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })

    return NextResponse.json({ item }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
