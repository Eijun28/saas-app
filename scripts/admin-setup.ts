/**
 * Script standalone pour créer/connecter un compte admin Nuply.
 *
 * Usage :
 *   npx tsx scripts/admin-setup.ts \
 *     --email karim.reziouk@kina-ia.xyz \
 *     --supabase-url https://xxx.supabase.co \
 *     --service-role-key eyJ... \
 *     --site-url https://nuply.fr
 *
 * Le script :
 * 1. Crée le compte admin si il n'existe pas
 * 2. Confirme l'email automatiquement
 * 3. Génère un magic link de connexion
 * 4. Affiche le lien dans le terminal — il suffit de cliquer dessus
 */

import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAILS = [
  'karim.reziouk@kina-ia.xyz',
  'contact@nuply.fr',
]

function parseArgs(): { email: string; supabaseUrl: string; serviceRoleKey: string; siteUrl: string } {
  const args = process.argv.slice(2)
  const map: Record<string, string> = {}

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '')
    const value = args[i + 1]
    if (key && value) map[key] = value
  }

  const email = map['email']
  const supabaseUrl = map['supabase-url']
  const serviceRoleKey = map['service-role-key']
  const siteUrl = map['site-url'] || 'http://localhost:3000'

  if (!email || !supabaseUrl || !serviceRoleKey) {
    console.error(`
❌ Arguments manquants.

Usage :
  npx tsx scripts/admin-setup.ts \\
    --email karim.reziouk@kina-ia.xyz \\
    --supabase-url https://xxx.supabase.co \\
    --service-role-key eyJ... \\
    --site-url https://nuply.fr  (optionnel, défaut: http://localhost:3000)
`)
    process.exit(1)
  }

  if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
    console.error(`❌ L'email "${email}" n'est pas dans la liste des admins autorisés.`)
    console.error(`   Emails autorisés : ${ADMIN_EMAILS.join(', ')}`)
    process.exit(1)
  }

  return { email, supabaseUrl, serviceRoleKey, siteUrl }
}

async function main() {
  const { email, supabaseUrl, serviceRoleKey, siteUrl } = parseArgs()

  console.log(`\n🔧 Admin Setup — Nuply`)
  console.log(`   Email    : ${email}`)
  console.log(`   Supabase : ${supabaseUrl}`)
  console.log(`   Site URL : ${siteUrl}\n`)

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // 1. Vérifier si l'utilisateur existe
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('❌ Erreur listUsers:', listError.message)
    process.exit(1)
  }

  const existingUser = userList.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  )

  if (existingUser) {
    console.log(`✅ Compte existant trouvé (id: ${existingUser.id})`)

    // Confirmer l'email si pas encore fait
    if (!existingUser.email_confirmed_at) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
      })
      if (updateError) {
        console.error('⚠️  Erreur confirmation email:', updateError.message)
      } else {
        console.log('✅ Email confirmé')
      }
    } else {
      console.log('✅ Email déjà confirmé')
    }
  } else {
    // 2. Créer le compte
    console.log('📝 Création du compte admin...')

    const tempPassword = crypto.randomUUID() + '-Aa1!'
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        prenom: 'Admin',
        nom: 'Nuply',
      },
    })

    if (createError || !newUser?.user) {
      console.error('❌ Erreur création:', createError?.message || 'Inconnu')
      process.exit(1)
    }

    console.log(`✅ Compte créé (id: ${newUser.user.id})`)
  }

  // 3. Générer un magic link
  console.log('🔗 Génération du magic link...')

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    console.error('❌ Erreur génération lien:', linkError?.message || 'Pas de lien retourné')
    process.exit(1)
  }

  const magicLink = linkData.properties.action_link

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   🎉 C'est prêt !                           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Clique sur le lien ci-dessous pour te connecter :           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

👉 ${magicLink}

Une fois connecté, va sur : ${siteUrl}/admin
`)
}

main().catch((err) => {
  console.error('❌ Erreur inattendue:', err)
  process.exit(1)
})
