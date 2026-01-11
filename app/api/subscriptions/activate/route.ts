import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

    // Vérifier que l'utilisateur est un prestataire
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'prestataire') {
      return NextResponse.json(
        { error: 'Seuls les prestataires peuvent activer un abonnement' },
        { status: 403 }
      )
    }

    // Vérifier si l'utilisateur a déjà un abonnement actif
    const { data: existingSubscription } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setFullYear(periodEnd.getFullYear() + 1) // Abonnement gratuit valide 1 an

    if (existingSubscription) {
      // Mettre à jour l'abonnement existant
      const { data, error } = await adminClient
        .from('subscriptions')
        .update({
          plan_type: planType,
          status: 'active',
          stripe_price_id: `free_${planType}`, // Identifiant pour plan gratuit
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          canceled_at: null,
          updated_at: now.toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Erreur mise à jour abonnement:', error)
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour de l\'abonnement' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        subscription: data,
        message: `Abonnement ${planType} activé avec succès` 
      })
    } else {
      // Créer un nouvel abonnement
      const { data, error } = await adminClient
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_type: planType,
          status: 'active',
          stripe_price_id: `free_${planType}`, // Identifiant pour plan gratuit
          stripe_customer_id: null, // Pas de customer Stripe pour les plans gratuits
          stripe_subscription_id: null, // Pas d'abonnement Stripe
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
        })
        .select()
        .single()

      if (error) {
        console.error('Erreur création abonnement:', error)
        return NextResponse.json(
          { error: 'Erreur lors de la création de l\'abonnement' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        subscription: data,
        message: `Abonnement ${planType} activé avec succès` 
      })
    }
  } catch (error: any) {
    console.error('Erreur activation abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'activation de l\'abonnement' },
      { status: 500 }
    )
  }
}
