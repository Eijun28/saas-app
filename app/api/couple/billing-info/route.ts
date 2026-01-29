// app/api/couple/billing-info/route.ts
// API pour gérer les informations de facturation du couple

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Schema de validation
const billingInfoSchema = z.object({
  nom_complet: z.string().min(2, 'Nom complet requis'),
  adresse: z.string().min(5, 'Adresse requise'),
  code_postal: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().default('France'),
  email_facturation: z.string().email().optional().or(z.literal('')),
  telephone: z.string().optional(),
})

/**
 * GET - Récupérer les infos de facturation du couple
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer le couple de l'utilisateur
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Profil couple non trouvé' }, { status: 404 })
    }

    // Récupérer les infos de facturation
    const { data: billingInfo, error: billingError } = await supabase
      .from('couple_billing_info')
      .select('*')
      .eq('couple_id', couple.id)
      .single()

    if (billingError && billingError.code !== 'PGRST116') {
      // PGRST116 = not found, ce n'est pas une erreur
      logger.error('Erreur récupération billing info:', billingError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({
      billingInfo: billingInfo || null,
      hasBillingInfo: !!billingInfo,
    })
  } catch (error) {
    logger.error('Erreur API couple billing-info GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * POST - Créer ou mettre à jour les infos de facturation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Parser et valider le body
    const body = await request.json()
    const validation = billingInfoSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Récupérer le couple de l'utilisateur
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Profil couple non trouvé' }, { status: 404 })
    }

    // Upsert les infos de facturation
    const { data: billingInfo, error: upsertError } = await supabase
      .from('couple_billing_info')
      .upsert(
        {
          couple_id: couple.id,
          ...data,
          // Nettoyer email vide
          email_facturation: data.email_facturation || null,
        },
        {
          onConflict: 'couple_id',
        }
      )
      .select()
      .single()

    if (upsertError) {
      logger.error('Erreur upsert billing info:', upsertError)
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
    }

    logger.info('Billing info mise à jour pour couple:', couple.id)

    return NextResponse.json({
      success: true,
      billingInfo,
    })
  } catch (error) {
    logger.error('Erreur API couple billing-info POST:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
