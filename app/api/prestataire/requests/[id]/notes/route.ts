import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const noteSchema = z.object({
  content: z.string().min(1).max(2000),
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

// GET /api/prestataire/requests/[id]/notes
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
      .from('request_notes')
      .select('id, content, created_at, author_id')
      .eq('request_id', id)
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ notes: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/prestataire/requests/[id]/notes
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
    const parsed = noteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Contenu invalide' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('request_notes')
      .insert({ request_id: id, author_id: user.id, content: parsed.data.content.trim() })
      .select('id, content, created_at, author_id')
      .single()

    if (error) throw error
    return NextResponse.json({ note: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/prestataire/requests/[id]/notes?noteId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: _requestId } = await params
    const noteId = new URL(req.url).searchParams.get('noteId')
    if (!noteId) return NextResponse.json({ error: 'noteId requis' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { error } = await supabase
      .from('request_notes')
      .delete()
      .eq('id', noteId)
      .eq('author_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
