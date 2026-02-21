import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ─── Schéma d'un paiement CSV ─────────────────────────────────────────────────

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const importRowSchema = z.object({
  provider_name: z.string().min(1).max(200),
  provider_id:   z.string().uuid().optional().nullable(),
  label:         z.string().min(1).max(200),
  category:      z.enum([
    'lieu', 'traiteur', 'photo', 'video', 'musique',
    'fleurs', 'decoration', 'robe', 'costume',
    'beaute', 'transport', 'faire_part', 'autre',
  ]).default('autre'),
  amount_total: z.number().min(0),
  amount_paid:  z.number().min(0).default(0),
  due_date:     z.string().regex(dateRegex).optional().nullable(),
  method:       z.enum(['virement', 'cheque', 'carte', 'especes', 'autre']).default('autre'),
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

// ─── POST /api/couple-payments/import ─────────────────────────────────────────
// Reçoit un tableau de paiements et les insère en bulk.
// Retourne { imported: number, errors: string[] }

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { coupleId, error, status } = await getAuthenticatedCoupleId(supabase)
    if (error || !coupleId) return NextResponse.json({ error }, { status })

    const body = await request.json()
    if (!Array.isArray(body.rows)) {
      return NextResponse.json({ error: 'Le champ "rows" doit être un tableau' }, { status: 400 })
    }

    const rows: unknown[] = body.rows
    const toInsert: object[] = []
    const errors: string[] = []

    rows.forEach((row, i) => {
      const result = importRowSchema.safeParse(row)
      if (!result.success) {
        errors.push(`Ligne ${i + 1} : ${result.error.issues.map(e => e.message).join(', ')}`)
        return
      }
      const d = result.data
      if (d.amount_paid > d.amount_total) {
        errors.push(`Ligne ${i + 1} : montant réglé (${d.amount_paid}) > montant total (${d.amount_total})`)
        return
      }
      toInsert.push({ ...d, couple_id: coupleId })
    })

    let imported = 0
    if (toInsert.length > 0) {
      const { data, error: dbError } = await supabase
        .from('couple_payments')
        .insert(toInsert)
        .select('id')

      if (dbError) {
        return NextResponse.json(
          { error: 'Erreur lors de l\'insertion', details: dbError.message },
          { status: 500 }
        )
      }
      imported = data?.length ?? 0
    }

    return NextResponse.json({ imported, errors }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
