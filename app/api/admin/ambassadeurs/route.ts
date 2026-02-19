// GET  /api/admin/ambassadeurs  — liste tous les prestataires avec leurs stats ambassadeur
// POST /api/admin/ambassadeurs  — activer / désactiver le statut ambassadeur

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

// ── GET : liste enrichie des prestataires (ambassadeurs en tête)
export async function GET() {
  const user = await assertAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Récupérer tous les prestataires avec leur code de parrainage
  const { data: referrals, error } = await admin
    .from('provider_referrals')
    .select(`
      provider_id,
      referral_code,
      is_ambassador,
      ambassador_active,
      ambassador_since,
      activated_by,
      total_referrals
    `)
    .order('is_ambassador', { ascending: false })
    .order('total_referrals', { ascending: false })

  if (error) {
    logger.error('Erreur récupération ambassadeurs', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  if (!referrals || referrals.length === 0) {
    return NextResponse.json({ ambassadeurs: [] })
  }

  const providerIds = referrals.map(r => r.provider_id)

  // Jointure manuelle : profils
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, prenom, nom, nom_entreprise, email')
    .in('id', providerIds)

  const profileMap = new Map((profiles || []).map(p => [p.id, p]))

  // Stats de gains par ambassadeur
  const { data: earningsRaw } = await admin
    .from('ambassador_earnings')
    .select('ambassador_id, amount, status')
    .in('ambassador_id', providerIds)

  // Conversions par ambassadeur
  const { data: conversions } = await admin
    .from('referral_usages')
    .select('referrer_id, conversion_bonus_credited')
    .in('referrer_id', providerIds)
    .eq('conversion_bonus_credited', true)

  // Calculer stats par ambassadeur
  const earningsByAmb = new Map<string, { total: number; pending: number; paid: number }>()
  for (const e of earningsRaw || []) {
    const cur = earningsByAmb.get(e.ambassador_id) ?? { total: 0, pending: 0, paid: 0 }
    cur.total += Number(e.amount)
    if (e.status === 'pending' || e.status === 'validated') cur.pending += Number(e.amount)
    if (e.status === 'paid') cur.paid += Number(e.amount)
    earningsByAmb.set(e.ambassador_id, cur)
  }

  const conversionsByAmb = new Map<string, number>()
  for (const c of conversions || []) {
    conversionsByAmb.set(c.referrer_id, (conversionsByAmb.get(c.referrer_id) ?? 0) + 1)
  }

  const result = referrals.map(r => {
    const profile = profileMap.get(r.provider_id)
    const earnings = earningsByAmb.get(r.provider_id) ?? { total: 0, pending: 0, paid: 0 }
    return {
      provider_id: r.provider_id,
      referral_code: r.referral_code,
      is_ambassador: r.is_ambassador,
      ambassador_active: r.ambassador_active,
      ambassador_since: r.ambassador_since,
      activated_by: r.activated_by,
      total_referrals: r.total_referrals,
      prenom: profile?.prenom ?? null,
      nom: profile?.nom ?? null,
      nom_entreprise: profile?.nom_entreprise ?? null,
      email: profile?.email ?? '',
      total_converted: conversionsByAmb.get(r.provider_id) ?? 0,
      total_earnings: earnings.total,
      pending_earnings: earnings.pending,
      paid_earnings: earnings.paid,
    }
  })

  return NextResponse.json({ ambassadeurs: result })
}

// ── POST : activer ou désactiver un ambassadeur
export async function POST(request: NextRequest) {
  const user = await assertAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const { provider_id, action } = body as { provider_id: string; action: 'activate' | 'deactivate' }

  if (!provider_id || !['activate', 'deactivate'].includes(action)) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (action === 'activate') {
    const { error } = await admin
      .from('provider_referrals')
      .update({
        is_ambassador: true,
        ambassador_active: true,
        ambassador_since: new Date().toISOString(),
        activated_by: user.email,
      })
      .eq('provider_id', provider_id)

    if (error) {
      logger.error('Erreur activation ambassadeur', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    logger.info('Ambassadeur activé', { provider_id, by: user.email })
    return NextResponse.json({ success: true, action: 'activated' })
  }

  // deactivate
  const { error } = await admin
    .from('provider_referrals')
    .update({ ambassador_active: false })
    .eq('provider_id', provider_id)

  if (error) {
    logger.error('Erreur désactivation ambassadeur', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  logger.info('Ambassadeur désactivé', { provider_id, by: user.email })
  return NextResponse.json({ success: true, action: 'deactivated' })
}
