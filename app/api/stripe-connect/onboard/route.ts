// app/api/stripe-connect/onboard/route.ts
// Démarre l'onboarding Stripe Connect Express pour un prestataire

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/config'
import { logger } from '@/lib/logger'

export async function POST() {
  try {
    // Vérifier que la clé Stripe est configurée
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder_for_build') {
      logger.error('STRIPE_SECRET_KEY non configurée')
      return NextResponse.json(
        { error: 'Stripe non configuré. Veuillez ajouter STRIPE_SECRET_KEY dans les variables d\'environnement.' },
        { status: 503 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Récupérer le profil pour le nom de l'entreprise
    const { data: profile } = await supabase
      .from('profiles')
      .select('prenom, nom, business_name, email')
      .eq('id', user.id)
      .single()

    // Vérifier si un compte Connect existe déjà
    const { data: existing } = await supabase
      .from('prestataire_stripe_connect')
      .select('stripe_account_id, onboarding_completed, charges_enabled')
      .eq('prestataire_id', user.id)
      .maybeSingle()

    let stripeAccountId: string

    if (existing) {
      stripeAccountId = existing.stripe_account_id

      // Si déjà actif, retourner un lien vers le dashboard Stripe
      if (existing.onboarding_completed && existing.charges_enabled) {
        const loginLink = await stripe.accounts.createLoginLink(stripeAccountId)
        return NextResponse.json({ success: true, url: loginLink.url, alreadyOnboarded: true })
      }
    } else {
      // Créer un nouveau compte Connect Express
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'FR',
        email: profile?.email || user.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          name: profile?.business_name || `${profile?.prenom || ''} ${profile?.nom || ''}`.trim() || undefined,
          product_description: 'Prestataire de mariage sur NUPLY',
          mcc: '7299', // Services personnels
          url: process.env.NEXT_PUBLIC_APP_URL || 'https://nuply.fr',
        },
      })

      stripeAccountId = account.id

      // Sauvegarder en base via admin (RLS bypass pour l'insert initial)
      await adminClient
        .from('prestataire_stripe_connect')
        .insert({
          prestataire_id: user.id,
          stripe_account_id: stripeAccountId,
          account_status: 'pending',
          onboarding_completed: false,
          charges_enabled: false,
          payouts_enabled: false,
        })
    }

    // Créer le lien d'onboarding
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nuply.fr'
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appUrl}/prestataire/devis-factures?stripe_connect=refresh`,
      return_url: `${appUrl}/api/stripe-connect/return?account_id=${stripeAccountId}`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ success: true, url: accountLink.url })
  } catch (error) {
    logger.error('Erreur onboarding Stripe Connect:', error)
    return NextResponse.json({ error: 'Erreur lors de la création du compte Stripe' }, { status: 500 })
  }
}
