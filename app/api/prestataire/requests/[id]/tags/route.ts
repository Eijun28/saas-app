import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const tagSchema = z.object({
  tag:   z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#823F91'),
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

// GET /api/prestataire/requests/[id]/tags
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const owned = await verifyOwnership(supabase, id, user.id)
    if (!owned) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const { data, error } = await supabase
      .from('request_tags')
      .select('id, tag, color, created_at')
      .eq('request_id', id)
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ tags: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/prestataire/requests/[id]/tags
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const owned = await verifyOwnership(supabase, id, user.id)
    if (!owned) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const body = await req.json()
    const parsed = tagSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Tag invalide' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('request_tags')
      .insert({ request_id: id, provider_id: user.id, tag: parsed.data.tag, color: parsed.data.color })
      .select('id, tag, color, created_at')
      .single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Tag déjà appliqué' }, { status: 409 })
      throw error
    }
    return NextResponse.json({ tag: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/prestataire/requests/[id]/tags?tagId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: _requestId } = await params
    const tagId = new URL(req.url).searchParams.get('tagId')
    if (!tagId) return NextResponse.json({ error: 'tagId requis' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { error } = await supabase
      .from('request_tags')
      .delete()
      .eq('id', tagId)
      .eq('provider_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
