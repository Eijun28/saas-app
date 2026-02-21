import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── GET /api/provider-availability/public/[providerId] ──────────────────────
// Retourne les créneaux publics d'un prestataire pour une période donnée.
// Accessible sans authentification (couples, visiteurs).
//
// Query params :
//   from  – date ISO "YYYY-MM-DD" (défaut : aujourd'hui)
//   to    – date ISO "YYYY-MM-DD" (défaut : +12 mois)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { providerId } = await params
    const { searchParams } = request.nextUrl

    const today   = new Date().toISOString().slice(0, 10)
    const maxDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const from = searchParams.get('from') ?? today
    const to   = searchParams.get('to')   ?? maxDate

    const supabase = await createClient()

    // Vérifier que le provider existe
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, nom_entreprise, prenom, nom, avatar_url, service_type')
      .eq('id', providerId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Prestataire introuvable' }, { status: 404 })

    // Créneaux publics qui se chevauchent avec la période demandée
    const { data: slots, error } = await supabase
      .from('provider_availability')
      .select('id, provider_id, start_date, end_date, status, note')
      .eq('provider_id', providerId)
      .eq('is_public', true)
      .lte('start_date', to)
      .gte('end_date', from)
      .order('start_date', { ascending: true })

    if (error) return NextResponse.json({ error: 'Erreur lors du chargement' }, { status: 500 })

    return NextResponse.json({
      provider: profile,
      slots: slots ?? [],
      period: { from, to },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
