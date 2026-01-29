// app/api/billing-consent/route.ts
// API pour gérer les demandes de consentement facturation

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Schema de validation pour la création
const createConsentSchema = z.object({
  conversation_id: z.string().uuid(),
  couple_id: z.string().uuid(),
})

/**
 * POST - Créer une demande de consentement
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
    const validation = createConsentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { conversation_id, couple_id } = validation.data

    // Vérifier que l'utilisateur est bien le prestataire de cette conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, provider_id, couple_id')
      .eq('id', conversation_id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 })
    }

    if (conversation.provider_id !== user.id) {
      return NextResponse.json(
        { error: 'Seul le prestataire peut demander le consentement' },
        { status: 403 }
      )
    }

    // Vérifier qu'aucune demande pending n'existe déjà
    const { data: existingRequest } = await supabase
      .from('billing_consent_requests')
      .select('id, status')
      .eq('conversation_id', conversation_id)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Une demande est déjà en attente', existingRequest },
        { status: 409 }
      )
    }

    // Créer la demande de consentement
    const { data: consentRequest, error: insertError } = await supabase
      .from('billing_consent_requests')
      .insert({
        conversation_id,
        prestataire_id: user.id,
        couple_id,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      logger.error('Erreur création demande consentement:', insertError)
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    logger.info('Demande de consentement créée:', consentRequest.id)

    return NextResponse.json({
      success: true,
      consentRequest,
    })
  } catch (error) {
    logger.error('Erreur API billing-consent POST:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * GET - Récupérer le statut de consentement pour une conversation
 */
export async function GET(request: NextRequest) {
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

    // Récupérer les paramètres
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')

    if (!conversationId) {
      return NextResponse.json({ error: 'conversation_id requis' }, { status: 400 })
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, provider_id, couple_id')
      .eq('id', conversationId)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 })
    }

    // Vérifier si l'utilisateur est le prestataire ou le couple
    const { data: couple } = await supabase
      .from('couples')
      .select('id, user_id')
      .eq('id', conversation.couple_id)
      .single()

    const isPrestataire = conversation.provider_id === user.id
    const isCouple = couple?.user_id === user.id

    if (!isPrestataire && !isCouple) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Récupérer la dernière demande de consentement
    const { data: consentRequest } = await supabase
      .from('billing_consent_requests')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Si consentement approuvé, vérifier si le couple a ses infos de facturation
    let needsBillingInfo = false
    if (consentRequest?.status === 'approved') {
      const { data: billingInfo } = await supabase
        .from('couple_billing_info')
        .select('id')
        .eq('couple_id', conversation.couple_id)
        .single()

      needsBillingInfo = !billingInfo
    }

    return NextResponse.json({
      hasConsent: consentRequest?.status === 'approved',
      status: consentRequest?.status || null,
      consentRequest: consentRequest || null,
      needsBillingInfo,
    })
  } catch (error) {
    logger.error('Erreur API billing-consent GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
