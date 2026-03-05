import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STATUS_MAP: Record<string, string> = {
  pending: 'lead',
  accepted: 'won',
  rejected: 'lost',
  cancelled: 'lost',
  completed: 'won',
}

// POST /api/prestataire/crm-contacts/sync-requests
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    // Get all requests for this provider
    const { data: requests, error: reqError } = await supabase
      .from('requests')
      .select('id, couple_id, status, initial_message, created_at')
      .eq('provider_id', user.id)

    if (reqError) throw reqError
    if (!requests?.length) {
      return NextResponse.json({ imported: 0, skipped: 0 })
    }

    // Get already-synced request IDs
    const { data: existing } = await supabase
      .from('crm_contacts')
      .select('request_id')
      .eq('provider_id', user.id)
      .not('request_id', 'is', null)

    const existingRequestIds = new Set(
      (existing ?? []).map((e: { request_id: string | null }) => e.request_id)
    )

    const newRequests = requests.filter(r => !existingRequestIds.has(r.id))
    if (newRequests.length === 0) {
      return NextResponse.json({ imported: 0, skipped: requests.length })
    }

    // Get couple info
    const coupleIds = [...new Set(newRequests.map(r => r.couple_id))]
    const { data: couples } = await supabase
      .from('couples')
      .select('user_id, partner_1_name, partner_2_name, wedding_date, wedding_location, budget_min, budget_max')
      .in('user_id', coupleIds)

    const couplesMap = new Map(
      (couples ?? []).map((c: { user_id: string; partner_1_name: string | null; partner_2_name: string | null; wedding_date: string | null; wedding_location: string | null; budget_min: number | null; budget_max: number | null }) => [c.user_id, c])
    )

    const contacts = newRequests.map(req => {
      const couple = couplesMap.get(req.couple_id) as { partner_1_name: string | null; partner_2_name: string | null; wedding_date: string | null; wedding_location: string | null; budget_min: number | null; budget_max: number | null } | undefined
      return {
        provider_id: user.id,
        first_name: couple?.partner_1_name?.trim() || 'Couple',
        last_name: couple?.partner_2_name?.trim() || '',
        wedding_date: couple?.wedding_date || null,
        wedding_location: couple?.wedding_location || null,
        budget: couple?.budget_max || couple?.budget_min || null,
        status: STATUS_MAP[req.status] || 'lead',
        source: 'nuply_request' as const,
        request_id: req.id,
        couple_id: req.couple_id,
        notes: req.initial_message || '',
        tags: [] as string[],
      }
    })

    const { data: inserted, error } = await supabase
      .from('crm_contacts')
      .insert(contacts)
      .select('id')

    if (error) throw error

    return NextResponse.json({
      imported: inserted?.length ?? 0,
      skipped: existingRequestIds.size,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
