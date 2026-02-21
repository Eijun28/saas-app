import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/email/resend'

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

        // ── Paiement abonnement NUPLY ────────────────────────────────────────
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

        // ── Paiement facture couple→prestataire ──────────────────────────────
        if (
          session.mode === 'payment' &&
          session.metadata?.nuply_type === 'facture_payment' &&
          session.metadata?.facture_id
        ) {
          await handleFacturePaymentCompleted(adminClient, session)
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

// ─── Handler paiement facture ─────────────────────────────────────────────────

async function handleFacturePaymentCompleted(
  adminClient: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  const factureId = session.metadata!.facture_id

  // Récupérer la facture avec infos couple + prestataire
  const { data: facture, error: factureError } = await adminClient
    .from('factures')
    .select(`
      *,
      couples (id, user_id, partner_1_name, partner_2_name),
      profiles!factures_prestataire_id_fkey (id, prenom, nom, business_name, email)
    `)
    .eq('id', factureId)
    .single()

  if (factureError || !facture) {
    logger.error(`Facture introuvable pour webhook: ${factureId}`)
    return
  }

  // Marquer la facture comme payée
  const { error: updateError } = await adminClient
    .from('factures')
    .update({
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
      stripe_payment_intent_id: session.payment_intent as string || null,
    })
    .eq('id', factureId)

  if (updateError) {
    logger.error(`Erreur mise à jour facture ${factureId}:`, updateError)
    return
  }

  logger.info(`Facture ${factureId} marquée payée via Stripe (session: ${session.id})`)

  // Envoyer le reçu par email au couple
  const coupleData = facture.couples as { user_id: string; partner_1_name?: string; partner_2_name?: string } | null
  const prestataireData = facture.profiles as { prenom?: string; nom?: string; business_name?: string; email?: string } | null

  if (session.customer_email) {
    const coupleName = [coupleData?.partner_1_name, coupleData?.partner_2_name]
      .filter(Boolean)
      .join(' & ') || 'Chers clients'

    const prestataireName = prestataireData?.business_name ||
      `${prestataireData?.prenom || ''} ${prestataireData?.nom || ''}`.trim() ||
      'votre prestataire'

    const amountFormatted = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: facture.currency || 'EUR',
    }).format(Number(facture.amount_ttc))

    await sendEmail({
      to: session.customer_email,
      subject: `Reçu de paiement — ${facture.facture_number}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #823F91;">Paiement confirmé</h2>
          <p>Bonjour ${coupleName},</p>
          <p>Votre paiement a bien été reçu. Voici votre reçu :</p>

          <div style="background: #f9f5ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Facture</td>
                <td style="padding: 8px 0; font-weight: 600; text-align: right;">${facture.facture_number}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Prestataire</td>
                <td style="padding: 8px 0; text-align: right;">${prestataireName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Objet</td>
                <td style="padding: 8px 0; text-align: right;">${facture.title}</td>
              </tr>
              <tr style="border-top: 2px solid #823F91;">
                <td style="padding: 12px 0; font-weight: 700; font-size: 18px;">Montant payé</td>
                <td style="padding: 12px 0; font-weight: 700; font-size: 18px; color: #823F91; text-align: right;">${amountFormatted}</td>
              </tr>
            </table>
          </div>

          <p style="color: #666; font-size: 14px;">
            Ce paiement a été traité de manière sécurisée via Stripe.<br>
            Conservez cet email comme justificatif de paiement.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            NUPLY — La plateforme des mariages d'exception
          </p>
        </div>
      `,
    })
  }

  // Notifier le prestataire par email
  if (prestataireData?.email) {
    const coupleName = [coupleData?.partner_1_name, coupleData?.partner_2_name]
      .filter(Boolean)
      .join(' & ') || 'Un couple'

    const amountFormatted = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: facture.currency || 'EUR',
    }).format(Number(facture.amount_ttc))

    await sendEmail({
      to: prestataireData.email,
      subject: `Paiement reçu — ${facture.facture_number}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #823F91;">Vous avez reçu un paiement</h2>
          <p>${coupleName} vient de régler votre facture <strong>${facture.facture_number}</strong>.</p>

          <div style="background: #f9f5ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Couple</td>
                <td style="padding: 8px 0; text-align: right;">${coupleName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Facture</td>
                <td style="padding: 8px 0; text-align: right;">${facture.facture_number}</td>
              </tr>
              <tr style="border-top: 2px solid #823F91;">
                <td style="padding: 12px 0; font-weight: 700; font-size: 18px;">Montant reçu</td>
                <td style="padding: 12px 0; font-weight: 700; font-size: 18px; color: #823F91; text-align: right;">${amountFormatted}</td>
              </tr>
            </table>
          </div>

          <p style="color: #666; font-size: 14px;">
            Les fonds seront virés sur votre compte bancaire selon le délai habituel de Stripe (2-3 jours ouvrés).
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            NUPLY — La plateforme des mariages d'exception
          </p>
        </div>
      `,
    })
  }
}
