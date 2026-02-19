// GET /api/prestataire/ambassador — dashboard ambassadeur du prestataire connecté

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Récupérer le code de parrainage et le statut ambassadeur
  const { data: referral, error: refError } = await admin
    .from('provider_referrals')
    .select('referral_code, is_ambassador, ambassador_active, ambassador_since, total_referrals')
    .eq('provider_id', user.id)
    .single()

  if (refError || !referral) {
    logger.error('Erreur récupération referral prestataire', refError)
    return NextResponse.json({ error: 'Données introuvables' }, { status: 404 })
  }

  // Si pas ambassadeur, retourner seulement le flag
  if (!referral.is_ambassador) {
    return NextResponse.json({ is_ambassador: false })
  }

  // Récupérer les gains
  const { data: earnings } = await admin
    .from('ambassador_earnings')
    .select('id, referral_usage_id, amount, type, status, created_at, validated_at, paid_at')
    .eq('ambassador_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const allEarnings = earnings || []

  const totals = allEarnings.reduce(
    (acc, e) => {
      acc.total += Number(e.amount)
      if (e.status === 'pending') acc.pending += Number(e.amount)
      if (e.status === 'validated') acc.validated += Number(e.amount)
      if (e.status === 'paid') acc.paid += Number(e.amount)
      return acc
    },
    { total: 0, pending: 0, validated: 0, paid: 0 }
  )

  // Compter les filleuls convertis
  const { count: convertedCount } = await admin
    .from('referral_usages')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', user.id)
    .eq('conversion_bonus_credited', true)

  return NextResponse.json({
    is_ambassador: true,
    ambassador_active: referral.ambassador_active,
    referral_code: referral.referral_code,
    ambassador_since: referral.ambassador_since,
    total_referrals: referral.total_referrals,
    total_converted: convertedCount ?? 0,
    earnings: totals,
    recent_earnings: allEarnings.slice(0, 10),
  })
}
