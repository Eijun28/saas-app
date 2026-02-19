// PATCH /api/admin/ambassadeurs/earnings — valider ou marquer comme payé des gains

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/config/admin'
import { logger } from '@/lib/logger'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user
}

// PATCH : changer le statut d'un ou plusieurs gains (bulk ou single)
export async function PATCH(request: NextRequest) {
  const user = await assertAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const { earning_ids, action } = body as {
    earning_ids: string[]
    action: 'validate' | 'mark_paid'
  }

  if (!earning_ids?.length || !['validate', 'mark_paid'].includes(action)) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const updatePayload =
    action === 'validate'
      ? { status: 'validated' as const, validated_at: now }
      : { status: 'paid' as const, paid_at: now }

  const { error } = await admin
    .from('ambassador_earnings')
    .update(updatePayload)
    .in('id', earning_ids)

  if (error) {
    logger.error('Erreur mise à jour gains ambassadeur', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  logger.info('Gains ambassadeur mis à jour', { action, count: earning_ids.length, by: user.email })
  return NextResponse.json({ success: true, updated: earning_ids.length })
}
