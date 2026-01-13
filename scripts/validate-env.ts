#!/usr/bin/env tsx
/**
 * Script de validation des variables d'environnement
 * À exécuter avant le build pour s'assurer que tout est configuré
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

// Charger les variables d'environnement depuis .env.local seulement s'il existe
// Sur Vercel/CI, les variables sont déjà dans process.env, pas besoin de .env.local
const envPath = resolve(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  config({ path: envPath })
} else {
  // Sur Vercel/CI, c'est normal que .env.local n'existe pas
  // Les variables sont définies dans les settings de la plateforme
  if (process.env.VERCEL || process.env.CI) {
    // En production/CI, ne pas afficher de warning
  } else {
    // En développement local, avertir si le fichier manque
    console.warn(`⚠️  Fichier .env.local non trouvé à: ${envPath}`)
    console.warn('   Les variables d\'environnement du système seront utilisées.\n')
  }
}

import { getEnvConfig, isFeatureEnabled } from '../lib/config/env'

console.log('🔍 Validation de la configuration...\n')

try {
  const config = getEnvConfig()
  
  console.log('✅ Configuration valide\n')
  console.log('📋 Variables requises:')
  console.log(`  ✓ NEXT_PUBLIC_SUPABASE_URL: ${config.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...`)
  console.log(`  ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${config.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`)
  console.log(`  ✓ SUPABASE_SERVICE_ROLE_KEY: ${config.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`)
  console.log(`  ✓ NEXT_PUBLIC_SITE_URL: ${config.NEXT_PUBLIC_SITE_URL}\n`)

  console.log('🔧 Fonctionnalités optionnelles:')
  console.log(`  ${isFeatureEnabled('email') ? '✓' : '✗'} Email (Resend)`)
  console.log(`  ${isFeatureEnabled('openai') ? '✓' : '✗'} OpenAI`)
  console.log(`  ${isFeatureEnabled('stripe') ? '✓' : '✗'} Stripe`)
  console.log(`  ${isFeatureEnabled('n8n') ? '✓' : '✗'} N8N Chatbot\n`)

  console.log('✅ Toutes les variables requises sont présentes')
  process.exit(0)
} catch (error) {
  console.error('❌ Erreur de validation:')
  if (error instanceof Error) {
    console.error(error.message)
    if (error.stack && process.env.NODE_ENV === 'development') {
      console.error('\nStack:', error.stack)
    }
  } else {
    console.error(String(error))
  }
  console.error('\n💡 Vérifiez votre fichier .env.local ou les variables d\'environnement de votre plateforme de déploiement.')
  process.exit(1)
}
