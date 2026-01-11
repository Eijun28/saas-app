import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/config'

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

    const adminClient = createAdminClient()

    // Récupérer l'abonnement actif
    const { data: subscription } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!subscription || !subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Aucun abonnement actif trouvé' },
        { status: 404 }
      )
    }

    // Annuler l'abonnement dans Stripe (à la fin de la période)
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    // Mettre à jour dans la base de données
    await adminClient
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
      })
      .eq('id', subscription.id)

    return NextResponse.json({
      success: true,
      message: 'Abonnement annulé. Il restera actif jusqu\'à la fin de la période en cours.',
      cancel_at_period_end: true,
      current_period_end: subscription.current_period_end,
    })
  } catch (error: any) {
    console.error('Erreur annulation abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation de l\'abonnement' },
      { status: 500 }
    )
  }
}
