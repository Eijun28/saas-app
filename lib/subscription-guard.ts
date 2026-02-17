/**
 * Subscription guard utility
 * Checks plan_type on API routes to enforce feature access by plan level.
 *
 * Plan hierarchy: discovery < pro < expert
 *
 * OFFRE DE LANCEMENT : Toutes les features sont accessibles gratuitement
 * jusqu'au 30 juin 2025. Après cette date, les restrictions par plan s'appliquent.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type PlanType = 'discovery' | 'pro' | 'expert'

/** Date de fin de l'offre de lancement (30 juin 2026 à 23:59:59 UTC) */
const FREE_ACCESS_END_DATE = new Date('2026-06-30T23:59:59Z')

/**
 * Vérifie si l'offre de lancement (accès gratuit à toutes les features) est active.
 */
function isFreeLaunchPeriod(): boolean {
  return new Date() <= FREE_ACCESS_END_DATE
}

const PLAN_HIERARCHY: Record<PlanType, number> = {
  discovery: 0,
  pro: 1,
  expert: 2,
}

export type SubscriptionCheckResult =
  | { authorized: true; planType: PlanType }
  | { authorized: false; response: NextResponse }

/**
 * Check if a user has access to a feature based on their subscription plan.
 *
 * @param userId - The authenticated user's ID
 * @param requiredPlan - Minimum plan required to access the feature
 * @returns Authorization result with plan type or error response
 */
export async function checkSubscriptionAccess(
  userId: string,
  requiredPlan: PlanType,
): Promise<SubscriptionCheckResult> {
  // Offre de lancement : accès gratuit à tout jusqu'au 30 juin 2025
  if (isFreeLaunchPeriod()) {
    return { authorized: true, planType: 'expert' }
  }

  const adminClient = createAdminClient()

  const { data: subscription, error } = await adminClient
    .from('subscriptions')
    .select('plan_type, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (error || !subscription) {
    // No active subscription — treat as discovery (free tier)
    if (requiredPlan === 'discovery') {
      return { authorized: true, planType: 'discovery' }
    }
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: 'Abonnement requis',
          requiredPlan,
          currentPlan: 'none',
          upgradeUrl: '/tarifs',
        },
        { status: 403 },
      ),
    }
  }

  const userPlan = subscription.plan_type as PlanType
  const userLevel = PLAN_HIERARCHY[userPlan] ?? -1
  const requiredLevel = PLAN_HIERARCHY[requiredPlan]

  if (userLevel < requiredLevel) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: `Cette fonctionnalité nécessite le plan ${requiredPlan} ou supérieur`,
          requiredPlan,
          currentPlan: userPlan,
          upgradeUrl: '/tarifs',
        },
        { status: 403 },
      ),
    }
  }

  return { authorized: true, planType: userPlan }
}

/**
 * Get the current plan type for a user.
 * Returns 'discovery' if no active subscription exists.
 */
export async function getUserPlanType(userId: string): Promise<PlanType> {
  // Offre de lancement : tout le monde est traité comme Expert jusqu'au 30 juin 2025
  if (isFreeLaunchPeriod()) {
    return 'expert'
  }

  const adminClient = createAdminClient()

  const { data: subscription } = await adminClient
    .from('subscriptions')
    .select('plan_type')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  return (subscription?.plan_type as PlanType) ?? 'discovery'
}
