import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET is not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Webhook signature verification failed', err)
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          const priceId = subscription.items.data[0]?.price.id
          const planType = priceId === STRIPE_PRICE_IDS.expert ? 'expert' :
                          priceId === STRIPE_PRICE_IDS.pro ? 'pro' : 'expert'

          const userId = session.metadata?.userId

          await adminClient
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              stripe_price_id: priceId,
              plan_type: planType,
              status: subscription.status === 'active' ? 'active' : 'incomplete',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end || false,
            }, {
              onConflict: 'user_id'
            })

          // Bonus ambassadeur : créditer la conversion si ce filleul a été parrainé
          if (userId) {
            const { error: bonusError } = await adminClient.rpc(
              'credit_ambassador_conversion_bonus',
              { p_referred_user_id: userId }
            )
            if (bonusError) {
              logger.error('Erreur credit_ambassador_conversion_bonus', bonusError)
            }
          }
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const updateData: {
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          canceled_at?: string;
        } = {
          status: subscription.status === 'active' ? 'active' :
                 subscription.status === 'canceled' ? 'canceled' :
                 subscription.status === 'past_due' ? 'past_due' :
                 subscription.status === 'trialing' ? 'trialing' : 'incomplete',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end || false,
        }

        if (subscription.canceled_at) {
          updateData.canceled_at = new Date(subscription.canceled_at * 1000).toISOString()
        }

        await adminClient
          .from('subscriptions')
          .update(updateData)
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )

          await adminClient
            .from('subscriptions')
            .update({
              status: 'active',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          await adminClient
            .from('subscriptions')
            .update({
              status: 'past_due',
            })
            .eq('stripe_subscription_id', invoice.subscription as string)
        }
        break
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Erreur traitement webhook', error)
    return NextResponse.json(
      { error: 'Webhook handler failed', details: errorMessage },
      { status: 500 }
    )
  }
}
