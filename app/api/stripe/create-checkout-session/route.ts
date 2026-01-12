import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, STRIPE_PRICE_IDS, type PlanType } from '@/lib/stripe/config'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { planType } = body

    if (!planType || !['premium', 'pro'].includes(planType)) {
      return NextResponse.json(
        { error: 'Type de plan invalide' },
        { status: 400 }
      )
    }

    const priceId = STRIPE_PRICE_IDS[planType as PlanType]
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Vérifier si l'utilisateur a déjà un abonnement actif
    const adminClient = createAdminClient()
    const { data: existingSubscription } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    let customerId: string

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id
    } else {
      // Créer ou récupérer le customer Stripe
      const { data: profile } = await adminClient
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single()

      const customers = await stripe.customers.list({
        email: profile?.email || user.email || undefined,
        limit: 1,
      })

      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email: profile?.email || user.email || undefined,
          metadata: {
            userId: user.id,
          },
        })
        customerId = customer.id
      }
    }

    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${siteUrl}/prestataire/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/tarifs?canceled=true`,
      metadata: {
        userId: user.id,
        planType: planType,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    logger.error('Erreur création session Stripe', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    )
  }
}
