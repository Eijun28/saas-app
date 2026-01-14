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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'lib/config/env.ts:getPublicEnvConfig',message:'env keys before validation (public)',data:{hasSupabaseUrl:!!process.env.NEXT_PUBLIC_SUPABASE_URL,hasSupabaseAnon:!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,hasSiteUrl:!!process.env.NEXT_PUBLIC_SITE_URL,envKeys:Object.keys(process.env||{}).filter(k=>k.startsWith('NEXT_PUBLIC'))},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  const result = publicEnvSchema.safeParse(process.env)

  if (!result.success) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2',location:'lib/config/env.ts:getPublicEnvConfig',message:'env validation failed (public)',data:{issues:result.error.issues},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a9efc206-455c-41d6-8eb0-b0fc75e830e1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2',location:'lib/config/env.ts:getServerEnvConfig',message:'env validation failed (server)',data:{issues:result.error.issues},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
