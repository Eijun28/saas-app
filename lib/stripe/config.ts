import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

// Plan IDs - À configurer dans Stripe Dashboard
export const STRIPE_PRICE_IDS = {
  premium: process.env.STRIPE_PRICE_ID_PREMIUM || 'price_premium_monthly',
  pro: process.env.STRIPE_PRICE_ID_PRO || 'price_pro_monthly',
} as const

export type PlanType = 'premium' | 'pro'
