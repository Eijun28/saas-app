import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

// ─── Helper ───────────────────────────────────────────────────────────────────

async function getAuthenticatedCouple(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { couple: null, error: 'Non authentifié', status: 401 }

  const { data: couple } = await supabase
    .from('couples')
    .select('id, share_token')
    .eq('user_id', user.id)
    .single()

  if (!couple) return { couple: null, error: 'Profil couple introuvable', status: 404 }
  return { couple, error: null, status: 200 }
}

// ─── POST /api/wedding-day-program/share ──────────────────────────────────────
// Génère un token de partage et retourne l'URL publique.

export async function POST() {
  try {
    const supabase = await createClient()
    const { couple, error, status } = await getAuthenticatedCouple(supabase)
    if (error || !couple) return NextResponse.json({ error }, { status })

    // Génère un token UUID si non déjà présent
    const token = couple.share_token ?? randomUUID()

    const { error: dbError } = await supabase
      .from('couples')
      .update({ share_token: token })
      .eq('id', couple.id)

    if (dbError) return NextResponse.json({ error: 'Erreur lors de la génération du token' }, { status: 500 })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    return NextResponse.json({ token, url: `${baseUrl}/programme/${token}` })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── DELETE /api/wedding-day-program/share ────────────────────────────────────
// Révoque le token de partage (le met à null).

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { couple, error, status } = await getAuthenticatedCouple(supabase)
    if (error || !couple) return NextResponse.json({ error }, { status })

    const { error: dbError } = await supabase
      .from('couples')
      .update({ share_token: null })
      .eq('id', couple.id)

    if (dbError) return NextResponse.json({ error: 'Erreur lors de la révocation du token' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
