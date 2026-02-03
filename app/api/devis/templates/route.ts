// app/api/devis/templates/route.ts
// API pour gérer les templates de devis

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Schema de validation pour créer/modifier un template
const templateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  is_default: z.boolean().optional().default(false),
  title_template: z.string().min(1).max(200),
  description_template: z.string().max(2000).optional(),
  default_amount: z.number().positive().optional(),
  currency: z.string().optional().default('EUR'),
  included_services: z.array(z.string()).optional().default([]),
  excluded_services: z.array(z.string()).optional().default([]),
  conditions: z.string().max(2000).optional(),
  validity_days: z.number().int().positive().optional().default(30),
})

/**
 * GET - Récupérer tous les templates du prestataire
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

    const { data: templates, error } = await supabase
      .from('devis_templates')
      .select('*')
      .eq('prestataire_id', user.id)
      .order('is_default', { ascending: false })
      .order('use_count', { ascending: false })

    if (error) {
      logger.error('Erreur récupération templates:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    logger.error('Erreur API templates GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * POST - Créer un nouveau template
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
    const validation = templateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Si ce template est marqué comme défaut, retirer le défaut des autres
    if (data.is_default) {
      await supabase
        .from('devis_templates')
        .update({ is_default: false })
        .eq('prestataire_id', user.id)
    }

    const { data: template, error } = await supabase
      .from('devis_templates')
      .insert({
        prestataire_id: user.id,
        ...data,
      })
      .select()
      .single()

    if (error) {
      logger.error('Erreur création template:', error)
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    return NextResponse.json({ success: true, template })
  } catch (error) {
    logger.error('Erreur API templates POST:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
