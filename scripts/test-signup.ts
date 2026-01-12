/**
 * Script de test pour vérifier la fonction signUp
 * Usage: npx tsx scripts/test-signup.ts
 */

import { signUp } from '../lib/auth/actions'

async function testSignUp() {
  console.log('🧪 Test de création de compte...\n')

  // Test avec un email unique à chaque exécution
  const timestamp = Date.now()
  const testEmail = `test-${timestamp}@example.com`
  const testPassword = 'Test1234!'
  
  console.log(`📧 Email de test: ${testEmail}`)
  console.log(`🔑 Mot de passe: ${testPassword}\n`)

  try {
    console.log('⏳ Appel de signUp...')
    const result = await signUp(
      testEmail,
      testPassword,
      'couple',
      {
        prenom: 'Test',
        nom: 'User',
      }
    )

    console.log('\n✅ Résultat:', JSON.stringify(result, null, 2))

    if (result.error) {
      console.error('\n❌ Erreur:', result.error)
      process.exit(1)
    }

    if (result.success) {
      console.log('\n✅ Succès! Redirection vers:', result.redirectTo || 'non spécifiée')
      console.log('\n🎉 Test réussi - Pas d\'erreur "unexpected response"!')
      process.exit(0)
    }

    console.log('\n⚠️ Réponse inattendue:', result)
    process.exit(1)
  } catch (error: any) {
    console.error('\n❌ Exception capturée:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

testSignUp()
