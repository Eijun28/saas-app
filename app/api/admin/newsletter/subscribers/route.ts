import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/config/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    const { data: subscribers, error } = await adminClient
      .from('newsletter_subscribers')
      .select('id, email, status, subscribed_at, unsubscribed_at')
      .order('subscribed_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    const active = subscribers?.filter(s => s.status === 'active').length ?? 0
    const unsubscribed = subscribers?.filter(s => s.status === 'unsubscribed').length ?? 0

    return NextResponse.json({
      subscribers: subscribers ?? [],
      stats: { total: subscribers?.length ?? 0, active, unsubscribed },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
