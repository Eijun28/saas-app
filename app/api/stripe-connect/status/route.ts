// app/api/stripe-connect/status/route.ts
// Retourne le statut du compte Stripe Connect du prestataire connecté

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: connect } = await supabase
      .from('prestataire_stripe_connect')
      .select('*')
      .eq('prestataire_id', user.id)
      .maybeSingle()

    if (!connect) {
      return NextResponse.json({ connected: false, account: null })
    }

    // Synchroniser le statut avec Stripe
    const account = await stripe.accounts.retrieve(connect.stripe_account_id)

    const updatedStatus = {
      onboarding_completed: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      account_status: account.charges_enabled ? 'active' : account.details_submitted ? 'restricted' : 'pending',
    }

    // Mettre à jour en base si le statut a changé
    if (
      connect.charges_enabled !== updatedStatus.charges_enabled ||
      connect.onboarding_completed !== updatedStatus.onboarding_completed
    ) {
      await supabase
        .from('prestataire_stripe_connect')
        .update(updatedStatus)
        .eq('prestataire_id', user.id)
    }

    return NextResponse.json({
      connected: true,
      account: {
        id: connect.stripe_account_id,
        onboarding_completed: updatedStatus.onboarding_completed,
        charges_enabled: updatedStatus.charges_enabled,
        payouts_enabled: updatedStatus.payouts_enabled,
        account_status: updatedStatus.account_status,
      },
    })
  } catch (error) {
    logger.error('Erreur récupération statut Stripe Connect:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
