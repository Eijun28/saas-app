import Stripe from 'stripe'

// During build time, we may not have env vars, so we use a placeholder
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_build'

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

// Plan IDs - À configurer dans Stripe Dashboard
export const STRIPE_PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_ID_PRO || 'price_pro_monthly',
  expert: process.env.STRIPE_PRICE_ID_PREMIUM || 'price_expert_monthly',
} as const

export type PlanType = 'pro' | 'expert'
