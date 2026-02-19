import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/config/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import AmbassadeursClient from './client'
import type { AmbassadorWithStats } from '@/types/ambassador'

export const dynamic = 'force-dynamic'

export default async function AmbassadeursPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) redirect('/sign-in')
  if (!isAdminEmail(user.email)) redirect('/')

  const admin = createAdminClient()

  const { data: referrals } = await admin
    .from('provider_referrals')
    .select('provider_id, referral_code, is_ambassador, ambassador_active, ambassador_since, activated_by, total_referrals')
    .order('is_ambassador', { ascending: false })
    .order('total_referrals', { ascending: false })

  const providerIds = (referrals || []).map(r => r.provider_id)

  const [{ data: profiles }, { data: earningsRaw }, { data: conversions }] = await Promise.all([
    admin.from('profiles').select('id, prenom, nom, nom_entreprise, email').in('id', providerIds),
    admin.from('ambassador_earnings').select('ambassador_id, amount, status').in('ambassador_id', providerIds),
    admin.from('referral_usages').select('referrer_id').eq('conversion_bonus_credited', true).in('referrer_id', providerIds),
  ])

  const profileMap = new Map((profiles || []).map(p => [p.id, p]))

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

  const ambassadeurs: AmbassadorWithStats[] = (referrals || []).map(r => {
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

  return <AmbassadeursClient ambassadeurs={ambassadeurs} />
}
