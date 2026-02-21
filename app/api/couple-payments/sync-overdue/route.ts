import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

// ─── POST /api/couple-payments/sync-overdue ────────────────────────────────────
// Met à jour status='overdue' pour les paiements dont due_date < today
// et dont le statut est encore pending ou partial (non soldés).
// Les statuts pending/partial impliquent déjà amount_paid < amount_total.
// Retourne { updated: number }

export async function POST() {
  try {
    const supabase = await createClient()
    const { coupleId, error, status } = await getAuthenticatedCoupleId(supabase)
    if (error || !coupleId) return NextResponse.json({ error }, { status })

    const today = new Date().toISOString().slice(0, 10)

    const { data: updated, error: dbError } = await supabase
      .from('couple_payments')
      .update({ status: 'overdue' })
      .eq('couple_id', coupleId)
      .lt('due_date', today)
      .in('status', ['pending', 'partial'])
      .select('id')

    if (dbError) return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })

    return NextResponse.json({ updated: updated?.length ?? 0 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
