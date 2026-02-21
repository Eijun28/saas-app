import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { GuestStats } from '@/types/guest'

// ─── GET /api/guests/stats ────────────────────────────────────────────────────
// Retourne les statistiques agrégées des invités du couple connecté.

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!couple) {
      return NextResponse.json({ error: 'Profil couple introuvable' }, { status: 404 })
    }

    const { data: guests, error: dbError } = await supabase
      .from('couple_guests')
      .select('rsvp_status, side, category, plus_one')
      .eq('couple_id', couple.id)

    if (dbError) {
      return NextResponse.json({ error: 'Erreur lors du calcul des statistiques' }, { status: 500 })
    }

    const stats: GuestStats = {
      total:                guests.length,
      confirmed:            guests.filter(g => g.rsvp_status === 'confirmed').length,
      declined:             guests.filter(g => g.rsvp_status === 'declined').length,
      pending:              guests.filter(g => g.rsvp_status === 'pending').length,
      maybe:                guests.filter(g => g.rsvp_status === 'maybe').length,
      total_with_plus_ones: guests.filter(g => g.rsvp_status === 'confirmed').length
                          + guests.filter(g => g.rsvp_status === 'confirmed' && g.plus_one).length,
      by_side: {
        partner_1: guests.filter(g => g.side === 'partner_1').length,
        partner_2: guests.filter(g => g.side === 'partner_2').length,
        commun:    guests.filter(g => g.side === 'commun').length,
      },
      by_category: {
        famille:  guests.filter(g => g.category === 'famille').length,
        ami:      guests.filter(g => g.category === 'ami').length,
        collegue: guests.filter(g => g.category === 'collegue').length,
        autre:    guests.filter(g => g.category === 'autre').length,
      },
    }

    return NextResponse.json({ stats })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
