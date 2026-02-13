// app/api/devis/settings/route.ts
// API pour gérer les paramètres de devis du prestataire

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { checkSubscriptionAccess } from '@/lib/subscription-guard'

// Schema de validation pour les paramètres
const settingsSchema = z.object({
  default_validity_days: z.number().int().positive().max(365).optional(),
  default_conditions: z.string().max(2000).optional().nullable(),
  default_payment_terms: z.string().max(500).optional().nullable(),
  is_subject_to_tva: z.boolean().optional(),
  default_tva_rate: z.number().min(0).max(100).optional(),
  devis_prefix: z.string().min(1).max(10).optional(),
  facture_prefix: z.string().min(1).max(10).optional(),
  send_reminder_before_expiry: z.boolean().optional(),
  reminder_days_before: z.number().int().positive().max(30).optional(),
  show_iban_on_devis: z.boolean().optional(),
  show_iban_on_facture: z.boolean().optional(),
  custom_logo_url: z.string().url().optional().nullable(),
  header_text: z.string().max(500).optional().nullable(),
  footer_text: z.string().max(500).optional().nullable(),
})

/**
 * GET - Récupérer les paramètres du prestataire
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

    // Vérifier le plan (paramètres devis requièrent Pro ou supérieur)
    const subscriptionCheck = await checkSubscriptionAccess(user.id, 'pro')
    if (!subscriptionCheck.authorized) {
      return subscriptionCheck.response
    }

    const { data: settings, error } = await supabase
      .from('provider_devis_settings')
      .select('*')
      .eq('prestataire_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      logger.error('Erreur récupération paramètres:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Retourner les valeurs par défaut si pas de paramètres
    const defaultSettings = {
      default_validity_days: 30,
      default_conditions: null,
      default_payment_terms: 'Paiement à 30 jours',
      is_subject_to_tva: false,
      default_tva_rate: 20,
      devis_prefix: 'DEV',
      facture_prefix: 'FAC',
      next_devis_number: 1,
      next_facture_number: 1,
      send_reminder_before_expiry: true,
      reminder_days_before: 3,
      show_iban_on_devis: false,
      show_iban_on_facture: true,
      custom_logo_url: null,
      header_text: null,
      footer_text: null,
    }

    return NextResponse.json({ settings: settings || defaultSettings })
  } catch (error) {
    logger.error('Erreur API settings GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * PUT - Créer ou mettre à jour les paramètres
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier le plan (paramètres devis requièrent Pro ou supérieur)
    const subscriptionCheckPut = await checkSubscriptionAccess(user.id, 'pro')
    if (!subscriptionCheckPut.authorized) {
      return subscriptionCheckPut.response
    }

    const body = await request.json()
    const validation = settingsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Vérifier si des paramètres existent déjà
    const { data: existing } = await supabase
      .from('provider_devis_settings')
      .select('id')
      .eq('prestataire_id', user.id)
      .single()

    let settings

    if (existing) {
      // Mise à jour
      const { data: updated, error } = await supabase
        .from('provider_devis_settings')
        .update(data)
        .eq('prestataire_id', user.id)
        .select()
        .single()

      if (error) {
        logger.error('Erreur mise à jour paramètres:', error)
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
      }

      settings = updated
    } else {
      // Création
      const { data: created, error } = await supabase
        .from('provider_devis_settings')
        .insert({
          prestataire_id: user.id,
          ...data,
        })
        .select()
        .single()

      if (error) {
        logger.error('Erreur création paramètres:', error)
        return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
      }

      settings = created
    }

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    logger.error('Erreur API settings PUT:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
