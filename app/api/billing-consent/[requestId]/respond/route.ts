// app/api/billing-consent/[requestId]/respond/route.ts
// API pour répondre à une demande de consentement facturation

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Schema de validation
const respondSchema = z.object({
  approved: z.boolean(),
})

interface RouteParams {
  params: Promise<{
    requestId: string
  }>
}

/**
 * POST - Le couple répond à la demande de consentement
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { requestId } = await params
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
    const validation = respondSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { approved } = validation.data

    // Récupérer la demande de consentement
    const { data: consentRequest, error: fetchError } = await supabase
      .from('billing_consent_requests')
      .select('*, couple:couples(id, user_id)')
      .eq('id', requestId)
      .single()

    if (fetchError || !consentRequest) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est bien le couple concerné
    if (consentRequest.couple?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Seul le couple peut répondre à cette demande' },
        { status: 403 }
      )
    }

    // Vérifier que la demande est toujours en attente
    if (consentRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cette demande a déjà été traitée', status: consentRequest.status },
        { status: 409 }
      )
    }

    // Vérifier que la demande n'a pas expiré
    if (new Date(consentRequest.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Cette demande a expiré' }, { status: 410 })
    }

    // Mettre à jour le statut
    const newStatus = approved ? 'approved' : 'rejected'

    const { data: updatedRequest, error: updateError } = await supabase
      .from('billing_consent_requests')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) {
      logger.error('Erreur mise à jour consentement:', updateError)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    logger.info(`Consentement ${newStatus} pour demande:`, requestId)

    // Si approuvé, vérifier si le couple a ses infos de facturation
    let needsBillingInfo = false
    if (approved) {
      const { data: billingInfo } = await supabase
        .from('couple_billing_info')
        .select('id')
        .eq('couple_id', consentRequest.couple_id)
        .single()

      needsBillingInfo = !billingInfo
    }

    return NextResponse.json({
      success: true,
      consentRequest: updatedRequest,
      needsBillingInfo,
    })
  } catch (error) {
    logger.error('Erreur API billing-consent respond:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
