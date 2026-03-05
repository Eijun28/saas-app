import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const activitySchema = z.object({
  type: z.enum(['note_added', 'tag_added', 'tag_removed', 'status_changed', 'message_sent', 'devis_sent', 'call_logged', 'follow_up_set', 'custom']),
  description: z.string().min(1).max(500),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
})

async function verifyOwnership(supabase: Awaited<ReturnType<typeof createClient>>, requestId: string, userId: string) {
  const { data } = await supabase
    .from('requests')
    .select('id')
    .eq('id', requestId)
    .eq('provider_id', userId)
    .single()
  return !!data
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const owned = await verifyOwnership(supabase, id, user.id)
    if (!owned) return NextResponse.json({ error: 'Non autorise' }, { status: 403 })

    const { data, error } = await supabase
      .from('contact_activities')
      .select('id, type, description, metadata, created_at')
      .eq('request_id', id)
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return NextResponse.json({ activities: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const owned = await verifyOwnership(supabase, id, user.id)
    if (!owned) return NextResponse.json({ error: 'Non autorise' }, { status: 403 })

    const body = await req.json()
    const parsed = activitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('contact_activities')
      .insert({
        request_id: id,
        provider_id: user.id,
        type: parsed.data.type,
        description: parsed.data.description,
        metadata: parsed.data.metadata,
      })
      .select('id, type, description, metadata, created_at')
      .single()

    if (error) throw error
    return NextResponse.json({ activity: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
