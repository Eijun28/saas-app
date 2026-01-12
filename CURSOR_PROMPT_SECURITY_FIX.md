# 🔒 PROMPT CURSOR - CORRECTION VULNÉRABILITÉS CRITIQUES

Exécute les corrections de sécurité suivantes dans l'ordre exact. Vérifie chaque étape avant de passer à la suivante.

---

## ⚠️ CORRECTION 1 : Vulnérabilité RCE Next.js 16.0.3

### Contexte
Next.js 16.0.3 a des CVE critiques (CVSS 10.0/10) permettant RCE, exposition du code source et DoS.

### Action requise
1. Ouvre `package.json`
2. Modifie la ligne `"next": "^16.0.3"` en `"next": "^16.1.1"`
3. Exécute `npm install`
4. Vérifie que l'application démarre sans erreur : `npm run dev`
5. Teste les routes principales pour confirmer la compatibilité

### Vérification
```bash
npm list next
# Doit afficher : next@16.1.1 ou supérieur
```

---

## ⚠️ CORRECTION 2 : RLS Policies avec colonnes inexistantes

### Contexte
Le fichier `supabase/migrations/007_rls_policies.sql` référence des colonnes `partner1_id` et `partner2_id` qui n'existent PAS dans la table `couples`.

### Analyse de la table couples
La vraie structure de `couples` est :
```sql
CREATE TABLE couples (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  partner_1_name TEXT,
  partner_2_name TEXT,
  -- PAS de partner1_id ni partner2_id !
)
```

### Action requise

#### Fichier : `supabase/migrations/007_rls_policies.sql`

**Trouve et remplace** :

**AVANT** (ligne ~10-15) :
```sql
CREATE POLICY "Couples can view their own data"
  ON couples FOR SELECT
  USING (auth.uid() = partner1_id OR auth.uid() = partner2_id);

CREATE POLICY "Couples can update their own data"
  ON couples FOR UPDATE
  USING (auth.uid() = partner1_id OR auth.uid() = partner2_id);
```

**APRÈS** :
```sql
CREATE POLICY "Couples can view their own data"
  ON couples FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Couples can update their own data"
  ON couples FOR UPDATE
  USING (auth.uid() = user_id);
```

#### Fichier : `supabase/migrations/007_rls_policies.sql` (timeline_events)

**Trouve** (ligne ~50-60) :
```sql
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- ...
);
```

**Problème** : `timeline_events.couple_id` référence `profiles(id)` mais devrait référencer `couples(id)`

**REMPLACE PAR** :
```sql
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  -- ...
);
```

### Vérification
Après modification, exécute la migration en local :
```bash
# Si tu as Supabase local
supabase db reset

# OU applique manuellement via Supabase Dashboard
# SQL Editor → Colle le fichier corrigé → Run
```

---

## ⚠️ CORRECTION 3 : Client Admin sans validations strictes

### Contexte
Le code utilise `createAdminClient()` qui bypass les RLS policies, mais sans validations suffisantes avant insertion.

### Fichier 1 : `lib/auth/actions.ts`

**Trouve** (lignes 51-93) :
```typescript
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  try {
    const adminClient = createAdminClient()

    // Création utilisateur
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { user_type: data.userType }
    })

    if (authError) throw authError

    // Création couple SANS validations strictes
    if (data.userType === 'couple') {
      const { error: coupleError } = await adminClient
        .from('couples')
        .insert({ id: data.user.id, ... })

      if (coupleError && coupleError.code !== '23505') {
        console.error('Erreur création couple:', coupleError)
      }
    }
    // ...
```

**AJOUTE CES VALIDATIONS** avant chaque insertion :

```typescript
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  try {
    // ✅ VALIDATION 1: Vérifier format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return { success: false, error: 'Email invalide' }
    }

    // ✅ VALIDATION 2: Vérifier userType autorisé
    const ALLOWED_USER_TYPES = ['couple', 'prestataire']
    if (!ALLOWED_USER_TYPES.includes(data.userType)) {
      return { success: false, error: 'Type utilisateur non autorisé' }
    }

    // ✅ VALIDATION 3: Pour couples, vérifier noms requis
    if (data.userType === 'couple') {
      if (!data.partner1Name?.trim() || !data.partner2Name?.trim()) {
        return { success: false, error: 'Les noms des partenaires sont requis' }
      }

      // Sanitize les noms (protection XSS)
      data.partner1Name = data.partner1Name.trim().substring(0, 100)
      data.partner2Name = data.partner2Name.trim().substring(0, 100)
    }

    const adminClient = createAdminClient()

    // Création utilisateur
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { user_type: data.userType }
    })

    if (authError) throw authError
    if (!authData?.user) throw new Error('Utilisateur non créé')

    // ✅ VALIDATION 4: Vérifier que l'ID utilisateur existe
    const userId = authData.user.id
    if (!userId || typeof userId !== 'string') {
      throw new Error('ID utilisateur invalide')
    }

    // Création couple avec validations
    if (data.userType === 'couple') {
      const { error: coupleError } = await adminClient
        .from('couples')
        .insert({
          id: userId,
          user_id: userId, // ✅ Utiliser user_id, pas partner1_id
          partner_1_name: data.partner1Name,
          partner_2_name: data.partner2Name,
          wedding_date: data.weddingDate || null
        })

      // ✅ NE PAS ignorer les erreurs silencieusement
      if (coupleError) {
        // Rollback : supprimer l'utilisateur si couple échoue
        await adminClient.auth.admin.deleteUser(userId)
        throw new Error(`Erreur création couple: ${coupleError.message}`)
      }
    }

    // Pour prestataire
    if (data.userType === 'prestataire') {
      // ✅ VALIDATION 5: Vérifier nom entreprise
      if (!data.businessName?.trim()) {
        await adminClient.auth.admin.deleteUser(userId)
        return { success: false, error: 'Nom entreprise requis' }
      }

      const { error: profileError } = await adminClient
        .from('profiles')
        .insert({
          id: userId,
          business_name: data.businessName.trim().substring(0, 200),
          service_type: data.serviceType || null
        })

      if (profileError) {
        await adminClient.auth.admin.deleteUser(userId)
        throw new Error(`Erreur création profil: ${profileError.message}`)
      }
    }

    return { success: true, data: authData }
  } catch (error) {
    // ✅ NE PAS logger l'erreur complète en production
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return { success: false, error: message }
  }
}
```

### Fichier 2 : `app/api/collaborateurs/invite/route.ts`

**Trouve** (lignes 56-76) :
```typescript
const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
  email,
  password: temporaryPassword,
  email_confirm: false,
  user_metadata: { user_type: 'prestataire' }
})
```

**AJOUTE CES VALIDATIONS AVANT** :

```typescript
// ✅ VALIDATION 1: Vérifier que l'inviteur existe et est prestataire
const { data: inviter, error: inviterError } = await supabase
  .from('profiles')
  .select('id, business_name')
  .eq('id', session.user.id)
  .single()

if (inviterError || !inviter) {
  return NextResponse.json(
    { error: 'Inviteur non trouvé' },
    { status: 403 }
  )
}

// ✅ VALIDATION 2: Limiter nombre d'invitations par prestataire
const { count, error: countError } = await supabase
  .from('collaborateurs')
  .select('*', { count: 'exact', head: true })
  .eq('prestataire_id', session.user.id)

if (countError || (count && count >= 10)) {
  return NextResponse.json(
    { error: 'Limite d\'invitations atteinte (max 10)' },
    { status: 429 }
  )
}

// ✅ VALIDATION 3: Vérifier que l'email n'existe pas déjà
const { data: existingUser } = await adminClient.auth.admin.listUsers()
const emailExists = existingUser?.users?.some(u => u.email === email)

if (emailExists) {
  return NextResponse.json(
    { error: 'Un utilisateur avec cet email existe déjà' },
    { status: 409 }
  )
}

// Ensuite seulement, créer l'utilisateur
const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
  email,
  password: temporaryPassword,
  email_confirm: false,
  user_metadata: { user_type: 'prestataire' }
})
```

---

## ⚠️ CORRECTION 4 : Retirer console.log en production

### Contexte
30 instances de `console.log/error/warn` exposent potentiellement des données sensibles.

### Action requise

#### Étape 1 : Créer un logger conditionnel

**Crée le fichier** : `lib/logger.ts`
```typescript
/**
 * Logger conditionnel - Ne log qu'en développement
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  info: (...args: any[]) => {
    if (isDev) console.log('[INFO]', ...args)
  },

  warn: (...args: any[]) => {
    if (isDev) console.warn('[WARN]', ...args)
  },

  error: (message: string, error?: unknown) => {
    if (isDev) {
      console.error('[ERROR]', message, error)
    } else {
      // En production : logger uniquement le message, pas l'objet complet
      console.error('[ERROR]', message)

      // TODO: Envoyer à un service de monitoring (Sentry, LogRocket, etc.)
      // Exemple : Sentry.captureException(error)
    }
  },

  debug: (...args: any[]) => {
    if (isDev) console.debug('[DEBUG]', ...args)
  }
}
```

#### Étape 2 : Remplacer tous les console.log

**Dans TOUS les fichiers `/app/api/**/*.ts`**, remplace :

**AVANT** :
```typescript
console.log('Something', data)
console.error('Error:', error)
console.warn('Warning')
```

**APRÈS** :
```typescript
import { logger } from '@/lib/logger'

logger.info('Something', data)
logger.error('Error', error)
logger.warn('Warning')
```

**Liste des fichiers à modifier** (30 instances) :
- `app/api/marriage-admin/upload-document/route.ts`
- `app/api/marriage-admin/create/route.ts`
- `app/api/marriage-admin/generate-document/route.ts`
- `app/api/marriage-admin/generate-pdf/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/api/stripe/create-checkout-session/route.ts`
- `app/api/stripe/cancel-subscription/route.ts`
- `app/api/collaborateurs/invite/route.ts`
- `app/api/collaborateurs/invitation/[token]/route.ts`
- `app/api/collaborateurs/invitation/[token]/accept/route.ts`
- `app/api/chatbot/route.ts`
- `lib/auth/actions.ts`
- `lib/auth/session.ts`

**Utilise cette commande pour trouver toutes les instances** :
```bash
grep -r "console\." app/api lib --include="*.ts" --include="*.tsx"
```

---

## ⚠️ CORRECTION 5 : Protection CSRF

### Contexte
Aucune route API ne vérifie l'origine des requêtes, permettant des attaques CSRF.

### Action requise

#### Fichier : `lib/supabase/middleware.ts`

**Trouve** la fonction `updateSession` et **AJOUTE** cette vérification au début :

```typescript
export async function updateSession(request: NextRequest) {
  // ✅ PROTECTION CSRF : Vérifier origin pour les requêtes mutantes
  const method = request.method
  const isMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)

  if (isMutating) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    // Autoriser uniquement les requêtes du même origin
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json(
        { error: 'CSRF detected: Invalid origin' },
        { status: 403 }
      )
    }

    // En production, vérifier aussi le referer
    if (process.env.NODE_ENV === 'production') {
      const referer = request.headers.get('referer')
      const allowedDomains = [
        process.env.NEXT_PUBLIC_SITE_URL,
        'https://votre-domaine.com' // ✅ REMPLACE par ton domaine
      ].filter(Boolean)

      const isValidReferer = referer && allowedDomains.some(
        domain => referer.startsWith(domain as string)
      )

      if (!isValidReferer) {
        return NextResponse.json(
          { error: 'CSRF detected: Invalid referer' },
          { status: 403 }
        )
      }
    }
  }

  // ... reste du code existant
  let supabaseResponse = NextResponse.next({
    request,
  })

  // ...
}
```

---

## ⚠️ CORRECTION 6 : Validation Magic Numbers (uploads)

### Contexte
Les uploads vérifient l'extension et le MIME type, mais pas la signature binaire réelle du fichier.

### Action requise

#### Fichier : `app/api/marriage-admin/upload-document/route.ts`

**Ajoute cette fonction** au début du fichier :

```typescript
/**
 * Vérifie la signature binaire (magic number) d'un fichier
 * @param buffer - Buffer du fichier
 * @param mimeType - Type MIME déclaré
 * @returns true si la signature correspond au MIME type
 */
function verifyFileSignature(buffer: Buffer, mimeType: string): boolean {
  const signatures: Record<string, number[][]> = {
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      [0x50, 0x4B, 0x03, 0x04] // ZIP (DOCX est un ZIP)
    ],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
      [0x50, 0x4B, 0x03, 0x04] // ZIP (XLSX est un ZIP)
    ]
  }

  const expectedSignatures = signatures[mimeType]
  if (!expectedSignatures) {
    // Type non supporté pour vérification
    return true
  }

  // Vérifier si une des signatures correspond
  return expectedSignatures.some(signature => {
    return signature.every((byte, index) => buffer[index] === byte)
  })
}
```

**Trouve** (ligne ~100) :
```typescript
// Validation type MIME
const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

if (!allowedTypes.includes(file.type)) {
  return NextResponse.json(
    { error: `Type de fichier non autorisé: ${file.type}` },
    { status: 400 }
  )
}
```

**AJOUTE APRÈS cette validation** :

```typescript
// ✅ VALIDATION : Vérifier la signature binaire
const arrayBuffer = await file.arrayBuffer()
const buffer = Buffer.from(arrayBuffer)

const isValidSignature = verifyFileSignature(buffer, file.type)
if (!isValidSignature) {
  return NextResponse.json(
    { error: 'Le contenu du fichier ne correspond pas à son extension' },
    { status: 400 }
  )
}
```

**REMPLACE** aussi :
```typescript
const fileExt = sanitizedFileName.split('.').pop() || 'bin'
```

**PAR** :
```typescript
// ✅ Extraire la vraie dernière extension
const parts = sanitizedFileName.split('.')
const fileExt = parts.length > 1 ? parts[parts.length - 1] : 'bin'

// ✅ Vérifier que l'extension correspond au MIME type
const mimeToExt: Record<string, string[]> = {
  'application/pdf': ['pdf'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'image/webp': ['webp'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx']
}

const allowedExts = mimeToExt[file.type] || []
if (!allowedExts.includes(fileExt.toLowerCase())) {
  return NextResponse.json(
    { error: `Extension .${fileExt} ne correspond pas au type ${file.type}` },
    { status: 400 }
  )
}
```

---

## ✅ CHECKLIST DE VÉRIFICATION FINALE

Après toutes les modifications, vérifie :

- [ ] Next.js est en version 16.1.1 ou supérieur
- [ ] Les RLS policies utilisent `user_id` (pas `partner1_id`)
- [ ] `timeline_events` référence `couples(id)` (pas `profiles(id)`)
- [ ] Toutes les insertions via `createAdminClient()` ont des validations strictes
- [ ] Tous les `console.log` sont remplacés par le logger conditionnel
- [ ] Le middleware vérifie l'origin pour les requêtes POST/PUT/DELETE
- [ ] Les uploads vérifient la signature binaire des fichiers
- [ ] L'application démarre sans erreur : `npm run dev`
- [ ] Les fonctions d'authentification fonctionnent (signup/login)
- [ ] Les uploads de documents fonctionnent toujours

---

## 🚀 COMMANDES POUR APPLIQUER

```bash
# 1. Mettre à jour Next.js
npm install next@16.1.1

# 2. Trouver tous les console.log à remplacer
grep -r "console\." app/api lib --include="*.ts" --include="*.tsx"

# 3. Réappliquer les migrations Supabase (si local)
supabase db reset

# 4. Tester l'application
npm run dev

# 5. Vérifier les logs
# Aucun console.log ne doit apparaître en mode production
```

---

**IMPORTANT** : Teste chaque correction individuellement avant de passer à la suivante. Ne commit pas tant que tu n'as pas vérifié que tout fonctionne.
