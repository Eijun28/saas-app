// app/api/devis/couples/route.ts
// API pour récupérer les couples disponibles pour créer un devis

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * GET - Récupérer les couples avec qui le prestataire a une conversation
 * Inclut les infos nécessaires pour savoir si on peut créer un devis
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

    // Récupérer toutes les conversations du prestataire avec les couples
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        couple_id,
        couples (
          id,
          partner_1_name,
          partner_2_name,
          wedding_date
        )
      `)
      .eq('provider_id', user.id)

    if (convError) {
      logger.error('Erreur récupération conversations:', convError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ couples: [] })
    }

    // Récupérer les IDs des couples uniques
    const coupleIds = [...new Set(conversations.map(c => c.couple_id))]

    // Vérifier quels couples ont des infos de facturation
    const { data: billingInfos } = await supabase
      .from('couple_billing_info')
      .select('couple_id')
      .in('couple_id', coupleIds)

    const couplesWithBilling = new Set(billingInfos?.map(b => b.couple_id) || [])

    // Vérifier les consentements approuvés
    const { data: consents } = await supabase
      .from('billing_consent_requests')
      .select('couple_id')
      .eq('prestataire_id', user.id)
      .eq('status', 'approved')
      .in('couple_id', coupleIds)

    const couplesWithConsent = new Set(consents?.map(c => c.couple_id) || [])

    // Type pour le couple joint
    type CoupleData = {
      id: string
      partner_1_name: string | null
      partner_2_name: string | null
      wedding_date: string | null
    }

    // Construire la liste des couples avec leurs infos
    const couples = conversations
      .filter(c => c.couples)
      .map(c => {
        // Supabase peut retourner un objet ou un tableau selon la relation
        const coupleData = c.couples as unknown
        const couple = (Array.isArray(coupleData) ? coupleData[0] : coupleData) as CoupleData

        if (!couple) return null

        return {
          id: couple.id,
          partner_1_name: couple.partner_1_name,
          partner_2_name: couple.partner_2_name,
          wedding_date: couple.wedding_date,
          has_billing_info: couplesWithBilling.has(couple.id),
          has_consent: couplesWithConsent.has(couple.id),
          conversation_id: c.id,
        }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      // Supprimer les doublons (même couple peut avoir plusieurs conversations théoriquement)
      .filter((couple, index, self) =>
        index === self.findIndex(c => c.id === couple.id)
      )
      // Trier par ceux qui ont les infos de facturation en premier
      .sort((a, b) => {
        if (a.has_billing_info && !b.has_billing_info) return -1
        if (!a.has_billing_info && b.has_billing_info) return 1
        return 0
      })

    return NextResponse.json({ couples })
  } catch (error) {
    logger.error('Erreur API couples GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
