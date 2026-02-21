// app/api/factures/[id]/route.ts
// API pour gérer une facture spécifique

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { checkSubscriptionAccess } from '@/lib/subscription-guard'

// Schema de validation pour modifier une facture
const updateFactureSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  amount_ht: z.number().positive().optional(),
  tva_rate: z.number().min(0).max(100).optional(),
  included_services: z.array(z.string()).optional(),
  conditions: z.string().max(2000).optional().nullable(),
  payment_terms: z.string().max(500).optional().nullable(),
  due_date: z.string().optional().nullable(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  paid_date: z.string().optional().nullable(),
  online_payment_enabled: z.boolean().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET - Récupérer une facture spécifique
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier le plan (factures requièrent Pro ou supérieur)
    const subscriptionCheck = await checkSubscriptionAccess(user.id, 'pro')
    if (!subscriptionCheck.authorized) {
      return subscriptionCheck.response
    }

    const { data: facture, error } = await supabase
      .from('factures')
      .select(`
        *,
        couples (
          id,
          partner_1_name,
          partner_2_name
        ),
        devis (
          id,
          devis_number,
          title
        )
      `)
      .eq('id', id)
      .eq('prestataire_id', user.id)
      .single()

    if (error || !facture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    return NextResponse.json({ facture })
  } catch (error) {
    logger.error('Erreur API facture GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * PATCH - Modifier une facture
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier le plan (factures requièrent Pro ou supérieur)
    const subscriptionCheckPatch = await checkSubscriptionAccess(user.id, 'pro')
    if (!subscriptionCheckPatch.authorized) {
      return subscriptionCheckPatch.response
    }

    const body = await request.json()
    const validation = updateFactureSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Si le montant HT ou le taux de TVA change, recalculer
    let updateData: Record<string, unknown> = { ...data }

    if (data.amount_ht !== undefined || data.tva_rate !== undefined) {
      // Récupérer les valeurs actuelles si nécessaire
      const { data: currentFacture } = await supabase
        .from('factures')
        .select('amount_ht, tva_rate')
        .eq('id', id)
        .single()

      if (currentFacture) {
        const amountHt = data.amount_ht ?? currentFacture.amount_ht
        const tvaRate = data.tva_rate ?? currentFacture.tva_rate

        updateData.amount_tva = amountHt * (tvaRate / 100)
        updateData.amount_ttc = amountHt + (amountHt * (tvaRate / 100))
      }
    }

    // Si le statut passe à "paid", mettre la date de paiement
    if (data.status === 'paid' && !data.paid_date) {
      updateData.paid_date = new Date().toISOString().split('T')[0]
    }

    const { data: facture, error } = await supabase
      .from('factures')
      .update(updateData)
      .eq('id', id)
      .eq('prestataire_id', user.id)
      .select()
      .single()

    if (error) {
      logger.error('Erreur modification facture:', error)
      return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 })
    }

    if (!facture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    return NextResponse.json({ success: true, facture })
  } catch (error) {
    logger.error('Erreur API facture PATCH:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * DELETE - Supprimer une facture (uniquement si en brouillon)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que la facture est en brouillon
    const { data: existingFacture } = await supabase
      .from('factures')
      .select('status')
      .eq('id', id)
      .eq('prestataire_id', user.id)
      .single()

    if (!existingFacture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    if (existingFacture.status !== 'draft') {
      return NextResponse.json(
        { error: 'Seules les factures en brouillon peuvent être supprimées' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('factures')
      .delete()
      .eq('id', id)
      .eq('prestataire_id', user.id)

    if (error) {
      logger.error('Erreur suppression facture:', error)
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur API facture DELETE:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
