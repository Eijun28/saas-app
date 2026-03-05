import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWeddingProgramPDF } from '@/lib/pdf/wedding-program-generator'
import type { ProgramItem } from '@/types/wedding-day-program'

export async function GET() {
  try {
    const supabase = await createClient()

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Get couple
    const { data: couple } = await supabase
      .from('couples')
      .select('id, partner_1_name, partner_2_name, wedding_date')
      .eq('user_id', user.id)
      .single()

    if (!couple) {
      return NextResponse.json({ error: 'Profil couple introuvable' }, { status: 404 })
    }

    // Get program items
    const { data: items, error: dbError } = await supabase
      .from('wedding_day_program')
      .select('*')
      .eq('couple_id', couple.id)
      .order('start_time', { ascending: true })
      .order('sort_order', { ascending: true })

    if (dbError) {
      return NextResponse.json({ error: 'Erreur lors du chargement du programme' }, { status: 500 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Aucun créneau dans le programme' }, { status: 400 })
    }

    // Build options
    const coupleNames = [couple.partner_1_name, couple.partner_2_name].filter(Boolean).join(' & ')
    const weddingDate = couple.wedding_date
      ? new Date(couple.wedding_date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : undefined

    // Generate PDF
    const pdfBytes = await generateWeddingProgramPDF(items as ProgramItem[], {
      coupleNames: coupleNames || undefined,
      weddingDate,
    })

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Programme-Jour-J.pdf"',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
