import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ─── Schéma ───────────────────────────────────────────────────────────────────

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const createSchema = z.object({
  provider_name: z.string().min(1, 'Le nom du prestataire est requis').max(200),
  provider_id:   z.string().uuid().optional().nullable(),
  label:         z.string().min(1, 'Le libellé est requis').max(200),
  category:      z.enum([
    'lieu', 'traiteur', 'photo', 'video', 'musique',
    'fleurs', 'decoration', 'robe', 'costume',
    'beaute', 'transport', 'faire_part', 'autre',
  ]).default('autre'),
  amount_total: z.number().min(0, 'Le montant doit être positif'),
  amount_paid:  z.number().min(0).default(0),
  due_date:     z.string().regex(dateRegex).optional().nullable(),
  paid_date:    z.string().regex(dateRegex).optional().nullable(),
  method:       z.enum(['virement', 'cheque', 'carte', 'especes', 'autre']).default('autre'),
  reference:    z.string().max(200).optional().nullable(),
  notes:        z.string().max(2000).optional().nullable(),
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

// ─── GET /api/couple-payments ──────────────────────────────────────────────────
// Retourne tous les paiements du couple, triés par date d'échéance.

export async function GET() {
  try {
    const supabase = await createClient()
    const { coupleId, error, status } = await getAuthenticatedCoupleId(supabase)
    if (error || !coupleId) return NextResponse.json({ error }, { status })

    const { data: payments, error: dbError } = await supabase
      .from('couple_payments')
      .select('*')
      .eq('couple_id', coupleId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (dbError) return NextResponse.json({ error: 'Erreur lors du chargement' }, { status: 500 })

    return NextResponse.json({ payments })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── POST /api/couple-payments ─────────────────────────────────────────────────
// Crée un nouveau jalon de paiement.

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { coupleId, error, status } = await getAuthenticatedCoupleId(supabase)
    if (error || !coupleId) return NextResponse.json({ error }, { status })

    const body = await request.json()
    const validation = createSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data
    if (data.amount_paid > data.amount_total) {
      return NextResponse.json(
        { error: 'Le montant réglé ne peut pas dépasser le montant total' },
        { status: 400 }
      )
    }

    const { data: payment, error: dbError } = await supabase
      .from('couple_payments')
      .insert({ ...data, couple_id: coupleId })
      .select()
      .single()

    if (dbError) return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })

    return NextResponse.json({ payment }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
