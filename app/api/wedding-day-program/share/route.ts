import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

// ─── Helper ───────────────────────────────────────────────────────────────────

async function getAuthenticatedCoupleId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { coupleId: null, error: 'Non authentifié', status: 401 as const }

  const { data: couple, error: dbError } = await supabase
    .from('couples')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (dbError || !couple) return { coupleId: null, error: 'Profil couple introuvable', status: 404 as const }
  return { coupleId: couple.id as string, error: null, status: 200 as const }
}

// ─── POST /api/wedding-day-program/share ──────────────────────────────────────
// Génère un token de partage et retourne l'URL publique.

export async function POST() {
  try {
    const supabase = await createClient()
    const { coupleId, error, status } = await getAuthenticatedCoupleId(supabase)
    if (error || !coupleId) return NextResponse.json({ error }, { status })

    // Récupérer le token existant s'il existe déjà
    const { data: coupleData } = await supabase
      .from('couples')
      .select('share_token')
      .eq('id', coupleId)
      .single()

    const existingToken = (coupleData as { share_token?: string | null } | null)?.share_token
    const token: string = existingToken ?? randomUUID()

    const { error: dbError } = await supabase
      .from('couples')
      .update({ share_token: token })
      .eq('id', coupleId)

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
    const { coupleId, error, status } = await getAuthenticatedCoupleId(supabase)
    if (error || !coupleId) return NextResponse.json({ error }, { status })

    const { error: dbError } = await supabase
      .from('couples')
      .update({ share_token: null })
      .eq('id', coupleId)

    if (dbError) return NextResponse.json({ error: 'Erreur lors de la révocation du token' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
