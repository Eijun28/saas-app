// app/api/factures/from-devis/route.ts
// API pour convertir un devis accepté en facture

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const convertSchema = z.object({
  devis_id: z.string().uuid(),
  tva_rate: z.number().min(0).max(100).optional(),
})

/**
 * POST - Convertir un devis en facture
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const validation = convertSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { devis_id, tva_rate } = validation.data

    // Vérifier que le devis existe et appartient au prestataire
    const { data: devis, error: devisError } = await supabase
      .from('devis')
      .select('*')
      .eq('id', devis_id)
      .eq('prestataire_id', user.id)
      .single()

    if (devisError || !devis) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    if (devis.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Le devis doit être accepté pour être converti en facture' },
        { status: 400 }
      )
    }

    // Vérifier qu'une facture n'existe pas déjà
    const { data: existingFacture } = await supabase
      .from('factures')
      .select('id')
      .eq('devis_id', devis_id)
      .single()

    if (existingFacture) {
      return NextResponse.json(
        { error: 'Une facture existe déjà pour ce devis' },
        { status: 400 }
      )
    }

    // Appeler la fonction de conversion
    const { data: factureId, error: convertError } = await supabase.rpc('convert_devis_to_facture', {
      p_devis_id: devis_id,
      p_tva_rate: tva_rate ?? null,
    })

    if (convertError) {
      logger.error('Erreur conversion devis -> facture:', convertError)
      return NextResponse.json(
        { error: convertError.message || 'Erreur lors de la conversion' },
        { status: 500 }
      )
    }

    // Récupérer la facture créée
    const { data: facture, error: fetchError } = await supabase
      .from('factures')
      .select(`
        *,
        couples (
          id,
          partner_1_name,
          partner_2_name
        )
      `)
      .eq('id', factureId)
      .single()

    if (fetchError || !facture) {
      return NextResponse.json(
        { error: 'Facture créée mais impossible de la récupérer' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, facture })
  } catch (error) {
    logger.error('Erreur API factures from-devis:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
