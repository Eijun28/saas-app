// app/api/factures/route.ts
// API pour gérer les factures

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Schema de validation pour créer une facture
const createFactureSchema = z.object({
  devis_id: z.string().uuid().optional(),
  couple_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  amount_ht: z.number().positive(),
  tva_rate: z.number().min(0).max(100).optional().default(0),
  included_services: z.array(z.string()).optional().default([]),
  conditions: z.string().max(2000).optional(),
  payment_terms: z.string().max(500).optional(),
  due_date: z.string().optional(),
})

/**
 * GET - Récupérer toutes les factures du prestataire
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: factures, error } = await supabase
      .from('factures')
      .select(`
        *,
        couples (
          id,
          partner_1_name,
          partner_2_name
        )
      `)
      .eq('prestataire_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Erreur récupération factures:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({ factures: factures || [] })
  } catch (error) {
    logger.error('Erreur API factures GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * POST - Créer une nouvelle facture
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
    const validation = createFactureSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Vérifier que le couple existe
    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .eq('id', data.couple_id)
      .single()

    if (!couple) {
      return NextResponse.json({ error: 'Couple non trouvé' }, { status: 404 })
    }

    // Générer le numéro de facture
    const { data: factureNumber } = await supabase.rpc('generate_facture_number', {
      p_prestataire_id: user.id,
    })
    const finalFactureNumber = factureNumber || `FAC-${new Date().getFullYear()}-${Date.now()}`

    // Calculer les montants
    const amountTva = data.amount_ht * (data.tva_rate / 100)
    const amountTtc = data.amount_ht + amountTva

    // Calculer la date d'échéance par défaut (30 jours)
    const dueDate = data.due_date || (() => {
      const date = new Date()
      date.setDate(date.getDate() + 30)
      return date.toISOString().split('T')[0]
    })()

    const { data: facture, error } = await supabase
      .from('factures')
      .insert({
        devis_id: data.devis_id || null,
        prestataire_id: user.id,
        couple_id: data.couple_id,
        facture_number: finalFactureNumber,
        title: data.title,
        description: data.description || null,
        amount_ht: data.amount_ht,
        tva_rate: data.tva_rate,
        amount_tva: amountTva,
        amount_ttc: amountTtc,
        currency: 'EUR',
        included_services: data.included_services,
        conditions: data.conditions || null,
        payment_terms: data.payment_terms || 'Paiement à 30 jours',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDate,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      logger.error('Erreur création facture:', error)
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    return NextResponse.json({ success: true, facture })
  } catch (error) {
    logger.error('Erreur API factures POST:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
