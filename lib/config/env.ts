/**
 * Configuration et validation stricte des variables d'environnement
 * Utilise Zod pour une validation type-safe au démarrage
 */

import { z } from 'zod'

/**
 * Schéma de validation pour les variables d'environnement requises
 */
const publicEnvSchema = z.object({
  // Supabase - REQUIRED (exposées au navigateur)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL doit être une URL valide'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY est requis'),

  // Site URL - REQUIRED (exposée au navigateur)
  NEXT_PUBLIC_SITE_URL: z.string().url('NEXT_PUBLIC_SITE_URL doit être une URL valide'),

  // N8N public webhook (optionnel)
  N8N_WEBHOOK_CHATBOT_URL: z.string().url('N8N_WEBHOOK_CHATBOT_URL doit être une URL valide').optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

const serverEnvSchema = publicEnvSchema.extend({
  // Supabase - service role (serveur uniquement)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY est requis'),

  // Email - optionnel
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email('RESEND_FROM_EMAIL doit être un email valide').optional(),

  // OpenAI - optionnel
  OPENAI_API_KEY: z.string().optional(),

  // Stripe - optionnel (requis seulement si paiements actifs)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_PREMIUM: z.string().optional(),
  STRIPE_PRICE_ID_PRO: z.string().optional(),
})

/**
 * Type inféré depuis le schéma
 */
export type PublicEnvConfig = z.infer<typeof publicEnvSchema>
export type ServerEnvConfig = z.infer<typeof serverEnvSchema>

/**
 * Configuration validée et typée (cachée)
 */
let validatedPublicConfig: PublicEnvConfig | null = null
let validatedServerConfig: ServerEnvConfig | null = null

/**
 * Valide et retourne la configuration
 * Lance une erreur si les variables requises sont manquantes
 */
export function getPublicEnvConfig(): PublicEnvConfig {
  if (validatedPublicConfig) {
    return validatedPublicConfig
  }


  const result = publicEnvSchema.safeParse(process.env)

  if (!result.success) {
    // Ne pas faire planter le client : retourner des valeurs vides pour permettre l'affichage
    validatedPublicConfig = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || '',
      N8N_WEBHOOK_CHATBOT_URL: process.env.N8N_WEBHOOK_CHATBOT_URL,
      NODE_ENV: (process.env.NODE_ENV as PublicEnvConfig['NODE_ENV']) || 'development',
    }
    return validatedPublicConfig
  }

  validatedPublicConfig = result.data
  return validatedPublicConfig
}

export function getServerEnvConfig(): ServerEnvConfig {
  if (validatedServerConfig) {
    return validatedServerConfig
  }

  const result = serverEnvSchema.safeParse(process.env)

  if (!result.success) {
    // During build time, env vars may not be available - return placeholder config
    // This allows static generation to complete; runtime will have real values
    const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL

    if (isBuildTime) {
      validatedServerConfig = {
        NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder-anon-key',
        NEXT_PUBLIC_SITE_URL: 'https://placeholder.vercel.app',
        SUPABASE_SERVICE_ROLE_KEY: 'placeholder-service-role-key',
        NODE_ENV: 'production',
      }
      return validatedServerConfig
    }

    const errors = result.error.issues.map(issue => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
      return `${path}: ${issue.message}`
    }).join('\n')

    const isVercel = process.env.VERCEL === '1'
    const platformHint = isVercel
      ? '\n\n💡 Sur Vercel, configurez ces variables dans : Settings > Environment Variables'
      : '\n\n💡 Vérifiez votre fichier .env.local ou les variables d\'environnement de votre plateforme de déploiement.'

    throw new Error(
      `❌ Configuration invalide - Variables d'environnement manquantes ou invalides (serveur):\n${errors}${platformHint}`
    )
  }

  validatedServerConfig = result.data
  return validatedServerConfig
}

// Compatibilité : getEnvConfig pointe vers la config serveur (usage historique)
export const getEnvConfig = getServerEnvConfig

/**
 * Vérifie si une fonctionnalité optionnelle est disponible
 */
export function isFeatureEnabled(feature: 'email' | 'openai' | 'stripe' | 'n8n'): boolean {
  const config = getEnvConfig()
  
  switch (feature) {
    case 'email':
      return !!config.RESEND_API_KEY && !!config.RESEND_FROM_EMAIL
    case 'openai':
      return !!config.OPENAI_API_KEY
    case 'stripe':
      return !!(
        config.STRIPE_SECRET_KEY &&
        config.STRIPE_PUBLISHABLE_KEY &&
        config.STRIPE_WEBHOOK_SECRET
      )
    case 'n8n':
      return !!config.N8N_WEBHOOK_CHATBOT_URL
    default:
      return false
  }
}

/**
 * Note: La validation se fait de manière lazy lors du premier appel à getEnvConfig()
 * Cela permet au script validate-env.ts de fonctionner même si certaines variables manquent
 * L'erreur sera levée au premier accès à la configuration, ce qui est le comportement souhaité
 */
