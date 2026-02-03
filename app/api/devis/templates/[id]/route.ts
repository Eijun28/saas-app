// app/api/devis/templates/[id]/route.ts
// API pour modifier/supprimer un template spécifique

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Schema de validation pour modifier un template
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  is_default: z.boolean().optional(),
  title_template: z.string().min(1).max(200).optional(),
  description_template: z.string().max(2000).optional().nullable(),
  default_amount: z.number().positive().optional().nullable(),
  currency: z.string().optional(),
  included_services: z.array(z.string()).optional(),
  excluded_services: z.array(z.string()).optional(),
  conditions: z.string().max(2000).optional().nullable(),
  validity_days: z.number().int().positive().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET - Récupérer un template spécifique
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

    const { data: template, error } = await supabase
      .from('devis_templates')
      .select('*')
      .eq('id', id)
      .eq('prestataire_id', user.id)
      .single()

    if (error || !template) {
      return NextResponse.json({ error: 'Template non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    logger.error('Erreur API template GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * PATCH - Modifier un template
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

    const body = await request.json()
    const validation = updateTemplateSchema.safeParse(body)

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
        .neq('id', id)
    }

    const { data: template, error } = await supabase
      .from('devis_templates')
      .update(data)
      .eq('id', id)
      .eq('prestataire_id', user.id)
      .select()
      .single()

    if (error) {
      logger.error('Erreur modification template:', error)
      return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 })
    }

    if (!template) {
      return NextResponse.json({ error: 'Template non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ success: true, template })
  } catch (error) {
    logger.error('Erreur API template PATCH:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * DELETE - Supprimer un template
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

    const { error } = await supabase
      .from('devis_templates')
      .delete()
      .eq('id', id)
      .eq('prestataire_id', user.id)

    if (error) {
      logger.error('Erreur suppression template:', error)
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur API template DELETE:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
