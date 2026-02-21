import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ─── Schéma ───────────────────────────────────────────────────────────────────

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const updateSchema = z.object({
  provider_name: z.string().min(1).max(200).optional(),
  provider_id:   z.string().uuid().optional().nullable(),
  label:         z.string().min(1).max(200).optional(),
  category:      z.enum([
    'lieu', 'traiteur', 'photo', 'video', 'musique',
    'fleurs', 'decoration', 'robe', 'costume',
    'beaute', 'transport', 'faire_part', 'autre',
  ]).optional(),
  amount_total: z.number().min(0).optional(),
  amount_paid:  z.number().min(0).optional(),
  due_date:     z.string().regex(dateRegex).optional().nullable(),
  paid_date:    z.string().regex(dateRegex).optional().nullable(),
  method:       z.enum(['virement', 'cheque', 'carte', 'especes', 'autre']).optional(),
  reference:    z.string().max(200).optional().nullable(),
  notes:        z.string().max(2000).optional().nullable(),
})

// ─── Helper ───────────────────────────────────────────────────────────────────

async function getOwnPayment(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { payment: null, error: 'Non authentifié', status: 401 }

  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!couple) return { payment: null, error: 'Profil couple introuvable', status: 404 }

  const { data: payment } = await supabase
    .from('couple_payments')
    .select('*')
    .eq('id', id)
    .eq('couple_id', couple.id)
    .single()

  if (!payment) return { payment: null, error: 'Paiement introuvable', status: 404 }
  return { payment, error: null, status: 200 }
}

// ─── PATCH /api/couple-payments/[id] ─────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { payment, error, status } = await getOwnPayment(supabase, id)
    if (error || !payment) return NextResponse.json({ error }, { status })

    const body = await request.json()
    const validation = updateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const updateData = validation.data
    const total = updateData.amount_total ?? payment.amount_total
    const paid  = updateData.amount_paid  ?? payment.amount_paid

    if (paid > total) {
      return NextResponse.json(
        { error: 'Le montant réglé ne peut pas dépasser le montant total' },
        { status: 400 }
      )
    }

    const { data: updated, error: dbError } = await supabase
      .from('couple_payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (dbError) return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })

    return NextResponse.json({ payment: updated })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── DELETE /api/couple-payments/[id] ────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { payment, error, status } = await getOwnPayment(supabase, id)
    if (error || !payment) return NextResponse.json({ error }, { status })

    const { error: dbError } = await supabase
      .from('couple_payments')
      .delete()
      .eq('id', id)

    if (dbError) return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
