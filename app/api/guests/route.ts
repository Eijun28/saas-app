import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ─── Schéma de validation ─────────────────────────────────────────────────────

const createGuestSchema = z.object({
  first_name:           z.string().min(1, 'Le prénom est requis').max(100),
  last_name:            z.string().max(100).default(''),
  email:                z.string().email('Email invalide').optional().nullable(),
  phone:                z.string().max(30).optional().nullable(),
  side:                 z.enum(['partner_1', 'partner_2', 'commun']).default('commun'),
  category:             z.enum(['famille', 'ami', 'collegue', 'autre']).default('autre'),
  dietary_restrictions: z.array(z.string()).optional().default([]),
  plus_one:             z.boolean().default(false),
  plus_one_name:        z.string().max(200).optional().nullable(),
  table_number:         z.number().int().positive().optional().nullable(),
  notes:                z.string().max(1000).optional().nullable(),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthenticatedCoupleId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { coupleId: null, error: 'Non authentifié', status: 401 }

  const { data: couple, error: coupleError } = await supabase
    .from('couples')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (coupleError || !couple) {
    return { coupleId: null, error: 'Profil couple introuvable', status: 404 }
  }

  return { coupleId: couple.id as string, error: null, status: 200 }
}

// ─── GET /api/guests ──────────────────────────────────────────────────────────
// Retourne la liste des invités du couple connecté, avec filtres optionnels.

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { coupleId, error, status } = await getAuthenticatedCoupleId(supabase)

    if (error || !coupleId) {
      return NextResponse.json({ error }, { status })
    }

    const { searchParams } = new URL(request.url)
    const side        = searchParams.get('side')
    const category    = searchParams.get('category')
    const rsvpStatus  = searchParams.get('rsvp_status')
    const search      = searchParams.get('search')?.trim()

    let query = supabase
      .from('couple_guests')
      .select('*')
      .eq('couple_id', coupleId)
      .order('last_name',  { ascending: true })
      .order('first_name', { ascending: true })

    if (side)       query = query.eq('side', side)
    if (category)   query = query.eq('category', category)
    if (rsvpStatus) query = query.eq('rsvp_status', rsvpStatus)
    if (search)     query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
    )

    const { data: guests, error: dbError } = await query

    if (dbError) {
      return NextResponse.json({ error: 'Erreur lors de la récupération des invités' }, { status: 500 })
    }

    return NextResponse.json({ guests })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── POST /api/guests ─────────────────────────────────────────────────────────
// Crée un nouvel invité pour le couple connecté.

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { coupleId, error, status } = await getAuthenticatedCoupleId(supabase)

    if (error || !coupleId) {
      return NextResponse.json({ error }, { status })
    }

    const body = await request.json()
    const validation = createGuestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { data: guest, error: dbError } = await supabase
      .from('couple_guests')
      .insert({ ...validation.data, couple_id: coupleId })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: 'Erreur lors de la création de l\'invité' }, { status: 500 })
    }

    return NextResponse.json({ guest }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
