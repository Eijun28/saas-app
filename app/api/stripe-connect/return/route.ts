// app/api/stripe-connect/return/route.ts
// Callback après que le prestataire a complété (ou quitté) l'onboarding Stripe

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/config'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('account_id')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nuply.fr'

  if (!accountId) {
    return NextResponse.redirect(`${appUrl}/prestataire/devis-factures?stripe_connect=error`)
  }

  try {
    // Récupérer le compte Stripe à jour
    const account = await stripe.accounts.retrieve(accountId)

    const adminClient = createAdminClient()

    // Mettre à jour le statut en base
    await adminClient
      .from('prestataire_stripe_connect')
      .update({
        onboarding_completed: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        account_status: account.charges_enabled ? 'active' : account.details_submitted ? 'restricted' : 'pending',
      })
      .eq('stripe_account_id', accountId)

    if (account.charges_enabled) {
      return NextResponse.redirect(`${appUrl}/prestataire/devis-factures?stripe_connect=success&tab=settings`)
    } else {
      return NextResponse.redirect(`${appUrl}/prestataire/devis-factures?stripe_connect=incomplete&tab=settings`)
    }
  } catch (error) {
    logger.error('Erreur callback Stripe Connect:', error)
    return NextResponse.redirect(`${appUrl}/prestataire/devis-factures?stripe_connect=error`)
  }
}
