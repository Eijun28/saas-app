// app/api/payments/create-checkout/route.ts
// Crée une session Stripe Checkout pour qu'un couple paye une facture en ligne

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/config'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const schema = z.object({
  facture_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const validation = schema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const { facture_id } = validation.data

    // Récupérer la facture + prestataire
    const adminClient = createAdminClient()

    const { data: facture, error: factureError } = await adminClient
      .from('factures')
      .select(`
        *,
        couples!inner (id, user_id, partner_1_name, partner_2_name),
        profiles!factures_prestataire_id_fkey (id, prenom, nom, business_name, email)
      `)
      .eq('id', facture_id)
      .single()

    if (factureError || !facture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    // Vérifier que le couple connecté est bien le destinataire
    if (facture.couples.user_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Vérifier que la facture est payable
    if (!['sent', 'overdue'].includes(facture.status)) {
      return NextResponse.json({ error: 'Cette facture ne peut pas être payée en ligne' }, { status: 400 })
    }

    if (!facture.online_payment_enabled) {
      return NextResponse.json({ error: 'Le paiement en ligne n\'est pas activé pour cette facture' }, { status: 400 })
    }

    // Récupérer le compte Stripe Connect du prestataire
    const { data: connectAccount } = await adminClient
      .from('prestataire_stripe_connect')
      .select('stripe_account_id, charges_enabled')
      .eq('prestataire_id', facture.prestataire_id)
      .maybeSingle()

    if (!connectAccount?.charges_enabled) {
      return NextResponse.json(
        { error: 'Le prestataire n\'a pas encore configuré le paiement en ligne' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nuply.fr'
    const prestataireProfile = facture.profiles as { prenom?: string; nom?: string; business_name?: string; email?: string }
    const prestataireName = prestataireProfile?.business_name ||
      `${prestataireProfile?.prenom || ''} ${prestataireProfile?.nom || ''}`.trim() ||
      'Prestataire'

    const coupleData = facture.couples as { partner_1_name?: string; partner_2_name?: string; user_id: string }
    const coupleName = [coupleData?.partner_1_name, coupleData?.partner_2_name]
      .filter(Boolean)
      .join(' & ') || 'Couple'

    // Montant en centimes
    const amountCents = Math.round(Number(facture.amount_ttc) * 100)

    // Créer la session Checkout Stripe
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: amountCents,
            product_data: {
              name: facture.title || `Facture ${facture.facture_number}`,
              description: [
                `Prestataire : ${prestataireName}`,
                facture.description || null,
              ].filter(Boolean).join(' — ') || undefined,
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        // Transfert direct vers le prestataire (Stripe Connect)
        transfer_data: {
          destination: connectAccount.stripe_account_id,
        },
        // Métadonnées pour le webhook
        metadata: {
          facture_id: facture.id,
          prestataire_id: facture.prestataire_id,
          couple_id: facture.couple_id,
          nuply_type: 'facture_payment',
        },
      },
      metadata: {
        facture_id: facture.id,
        nuply_type: 'facture_payment',
      },
      customer_email: user.email || undefined,
      success_url: `${appUrl}/couple/factures?payment=success&facture=${facture_id}`,
      cancel_url: `${appUrl}/couple/factures?payment=cancelled&facture=${facture_id}`,
      locale: 'fr',
      custom_text: {
        submit: {
          message: `Paiement sécurisé de ${facture.facture_number} à ${prestataireName}`,
        },
      },
    })

    // Sauvegarder la session ID et l'URL sur la facture
    await adminClient
      .from('factures')
      .update({
        stripe_checkout_session_id: session.id,
        online_payment_url: session.url,
      })
      .eq('id', facture_id)

    logger.info(`Session Checkout créée pour facture ${facture_id}: ${session.id}`)

    return NextResponse.json({ success: true, url: session.url, session_id: session.id })
  } catch (error) {
    logger.error('Erreur création session Checkout:', error)
    return NextResponse.json({ error: 'Erreur lors de la création du paiement' }, { status: 500 })
  }
}
