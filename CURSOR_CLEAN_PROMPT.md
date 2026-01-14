# Prompt Cursor - Nettoyage Code Nuply Pre-Launch

Tu es un expert en clean code spécialisé en Next.js 16, React 19, TypeScript et Supabase. Ta mission est d'analyser et nettoyer le code de la plateforme **Nuply** (marketplace mariages couples/prestataires) avant son lancement en production.

## Context Technique Nuply

**Stack**:
- **Frontend**: Next.js 16.1.1 (App Router) + React 19.2.0
- **UI**: shadcn/ui + TailwindCSS 4 + Framer Motion 12
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Langage**: TypeScript 5.9.3 (strict mode)
- **State**: Zustand 5.0.8
- **Forms**: React Hook Form + Zod
- **Paiement**: Stripe 17.3.1
- **Email**: Resend 4.8.0

**Architecture**:
- Monolithe Next.js avec API Routes
- App Router (pas de Pages Router)
- Row-Level Security (RLS) Supabase
- Server Actions pour mutations
- Client Components pour interactivité

---

## 🎯 Objectifs du nettoyage

### 1. Qualité et Maintenabilité
- ✅ Supprimer tout code mort (fonctions, variables, imports inutilisés)
- ✅ Éliminer les duplications de code
- ✅ Simplifier la logique complexe
- ✅ Améliorer la lisibilité et la compréhension du code
- ✅ Respecter les conventions Next.js 16 et React 19

### 2. Performance et Optimisation
- ⚡ Identifier les goulots d'étranglement (React Server Components vs Client)
- ⚡ Optimiser les requêtes Supabase (éviter N+1, utiliser `.select()` efficient)
- ⚡ Réduire les re-renders inutiles (React.memo, useMemo, useCallback)
- ⚡ Optimiser les bundles (dynamic imports, code splitting)
- ⚡ Utiliser les Server Components par défaut (éviter 'use client' inutile)
- ⚡ Lazy loading des images avec `next/image`

### 3. Sécurité
- 🔒 Retirer les clés API et secrets hardcodés
- 🔒 Vérifier les validations d'entrées (Zod schemas)
- 🔒 Sécuriser les endpoints API avec rate limiting
- 🔒 Vérifier les RLS policies Supabase
- 🔒 S'assurer que les Server Actions sont protégées
- 🔒 Vérifier les autorisations couple/prestataire/admin

### 4. Production Ready
- 🚀 Supprimer les console.log et debuggers
- 🚀 Retirer les commentaires TODO/FIXME obsolètes
- 🚀 Vérifier la gestion d'erreurs (try/catch, error.tsx, global-error.tsx)
- 🚀 S'assurer que tous les chemins critiques ont des fallbacks
- 🚀 Nettoyer la documentation de développement
- 🚀 Supprimer les fichiers de configuration IDE
- 🚀 Consolider les migrations SQL

---

## 📋 Checklist détaillée par catégorie

### Frontend (Next.js 16 + React 19)

```
□ Supprimer les imports inutilisés (VSCode auto-import souvent pollue)
□ Retirer les composants non référencés dans app/ ou components/
□ Éliminer les props inutiles et drilling props excessif
□ Vérifier 'use client' : utilisé uniquement si nécessaire (hooks, events)
□ Optimiser re-renders (React.memo, useMemo, useCallback avec parcimonie)
□ Vérifier les clés dans les .map() (éviter index, utiliser id stable)
□ Remplacer <img> par <Image> de next/image avec priority/lazy
□ Vérifier l'accessibilité (aria-labels, alt text, semantic HTML)
□ Supprimer les styles inline redondants (utiliser TailwindCSS)
□ Nettoyer les console.log, console.error, debugger
□ Uniformiser la gestion d'état (Zustand pour global, useState pour local)
□ Vérifier les redirects (useRouter vs redirect() de next/navigation)
□ Optimiser les animations Framer Motion (AnimatePresence, lazy variants)
□ Supprimer les commentaires de code mort (ne pas commenter, supprimer)
□ Vérifier que les formulaires utilisent React Hook Form + Zod
```

**Spécifique Next.js 16**:
```
□ S'assurer que layout.tsx et page.tsx sont async quand nécessaire
□ Vérifier les metadata exports (SEO) dans page.tsx
□ Utiliser generateStaticParams pour routes dynamiques si applicable
□ Vérifier que les Server Actions utilisent 'use server'
□ Remplacer fetch() par des fonctions Supabase dans Server Components
□ Vérifier les suspense boundaries avec <Suspense> + loading.tsx
□ S'assurer que les cookies/headers sont utilisés via next/headers
```

**Spécifique React 19**:
```
□ Utiliser les nouvelles APIs React 19 (useOptimistic, useFormStatus si applicable)
□ Vérifier que les refs utilisent le nouveau pattern (pas de forwardRef legacy)
□ Supprimer les polyfills React 18 obsolètes
```

### Backend (Supabase + API Routes)

```
□ Supprimer les routes API non utilisées dans app/api/
□ Optimiser les requêtes N+1 Supabase (.select() avec joins efficaces)
□ Vérifier les RLS policies (couples, prestataires, conversations, etc.)
□ Implémenter le rate limiting (API routes sensibles : signup, messages, webhooks)
□ Valider les données entrantes avec Zod (lib/validations/)
□ Sécuriser les endpoints sensibles (auth check, RBAC couple/prestataire/admin)
□ Nettoyer les logs de debug (console.log côté serveur)
□ Vérifier les transactions Supabase (.rpc() pour logique complexe)
□ Ajouter la gestion d'erreurs globale (try/catch dans API routes)
□ Documenter les API endpoints critiques (JSDoc ou README)
□ Vérifier les webhooks Stripe (signature validation)
□ S'assurer que les Server Actions retournent des erreurs exploitables
□ Vérifier les timeouts et retry logic (calls externes : OpenAI, Stripe, Resend)
```

**Spécifique Supabase**:
```
□ Consolider les queries dans lib/supabase/queries/
□ Vérifier que les migrations SQL sont toutes dans supabase/migrations/
□ Supprimer les fichiers SQL redondants en racine (BUDGET_SCHEMA.sql, etc.)
□ Vérifier les policies RLS : enable_rls = true sur toutes les tables sensibles
□ Optimiser les index sur colonnes fréquemment requêtées (user_id, couple_id, etc.)
□ Vérifier les triggers et fonctions SQL (pas de logique obsolète)
□ S'assurer que Storage buckets ont les bonnes policies (avatars, photos, etc.)
```

### Configuration et Environnement

```
□ Vérifier les variables d'environnement (.env.local vs .env.example)
□ Retirer les secrets du code (SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET, etc.)
□ Configurer les CORS correctement (API routes, Supabase, Stripe webhooks)
□ Vérifier les configurations de production (next.config.ts)
□ Nettoyer les dépendances inutilisées (npm prune, analyser package.json)
□ Mettre à jour les dépendances avec vulnérabilités (npm audit fix)
□ Vérifier les configurations de build (TypeScript strict, ESLint, Prettier)
□ S'assurer que validate-env.ts est appelé dans build
□ Vérifier les redirects et rewrites dans next.config.ts
□ Configurer les headers de sécurité (CSP, X-Frame-Options, etc.)
```

### Tests et Documentation

```
□ Vérifier que les tests critiques passent (signup, auth, paiement, messages)
□ Supprimer les tests obsolètes ou dupliqués
□ Documenter les fonctions complexes (JSDoc/TSDoc)
□ Ajouter des comments pour la logique métier non-évidente
□ Mettre à jour le README.md principal
□ Supprimer les README.md dispersés et redondants
```

---

## 🗑️ NETTOYAGE DOCUMENTATION & FICHIERS INUTILES

### PRIORITÉ CRITIQUE - À SUPPRIMER IMMÉDIATEMENT

**1. Configuration IDE (machine-specific)**
```bash
# À supprimer si présent sur Git
rm -rf .idea/
rm -rf .vscode/settings.json  # Garder extensions.json si utile
rm -rf *.iml
```

**2. Document IA volumineux (1692 lignes)**
```bash
# claude.md : Document interne pour contexte IA
# OPTION 1 : Supprimer complètement
rm claude.md

# OPTION 2 : Archiver en interne (recommandé)
mkdir -p docs/internal
mv claude.md docs/internal/claude-context.md
```

**3. Fichiers SQL redondants en racine**
```bash
# Ces fichiers sont déjà dans supabase/migrations/
# Les déplacer ou supprimer après vérification
rm BUDGET_SCHEMA.sql
rm BUDGET_CATEGORIES_UPDATE.sql
rm PROFILE_SCHEMA.sql
rm SIGNUP_SQL.sql
rm supabase-policies.sql
rm SUPABASE_SCHEMA.md  # Redondant avec migrations

# Si besoin : consolider dans supabase/migrations/archive/
```

**4. Fichiers de test obsolètes**
```bash
# Scripts de développement à archiver ou supprimer
rm scripts/test-api.sh
rm scripts/test-api.ps1
rm scripts/test-early-adopter.sql
rm scripts/test-compatibility.ts
rm scripts/test-signup.ts

# Garder uniquement :
# - scripts/validate-env.ts (utilisé en build)
# - scripts/seed-prestataires.ts (utile pour dev/staging)
```

### PRIORITÉ HAUTE - RÉORGANISER DOCUMENTATION

**27 fichiers Markdown en racine** à réorganiser :

```bash
# Créer structure propre
mkdir -p docs/{setup,deployment,architecture,guides,internal}

# SETUP (guides développeur)
mv SUPABASE_SETUP.md docs/setup/
mv SETUP_RESEND.md docs/setup/
mv STRIPE_SETUP.md docs/setup/
mv SUPABASE_STORAGE_SETUP.md docs/setup/
mv SUPABASE_EMAIL_SETUP.md docs/setup/
mv N8N_AGENT_SETUP.md docs/setup/
mv COUPLES_RLS_SETUP.md docs/setup/
mv SETUP_CHECKLIST.md docs/setup/

# DEPLOYMENT (production)
mv VERCEL_DEPLOYMENT.md docs/deployment/
mv ENV_EXAMPLE.md docs/deployment/
mv TEST_QUICK_START.md docs/deployment/

# ARCHITECTURE (documentation technique)
mv ARCHITECTURE_ROBUSTE.md docs/architecture/
mv ANALYSE_TABLES_SUPABASE.md docs/architecture/
mv AUDIT_SECURITE_NUPLY.md docs/architecture/
mv RESUME_CORRECTIONS_TABLES.md docs/architecture/

# GUIDES (implémentation features)
mv BUDGET_IMPLEMENTATION.md docs/guides/
mv BUDGET_CATEGORIES_IMPLEMENTATION.md docs/guides/
mv PROFILE_IMPLEMENTATION.md docs/guides/
mv CREATION_CONVERSATION_AUTO.md docs/guides/
mv ICONES_AMELIORATION.md docs/guides/
mv README_SCROLL_REVEAL.md docs/guides/
mv RESPONSIVE_CHECKLIST.md docs/guides/
mv MATCHING_CARDS_REFONTE.md docs/guides/

# INTERNAL (docs développement interne)
mv FIX_ERREUR_SERVEUR.md docs/internal/
mv TEST_EARLY_ADOPTER.md docs/internal/
mv README_STRIPE.md docs/internal/

# GARDER EN RACINE (essentiels)
# - README.md (description principale du projet)
# - .env.example (si existant, sinon créer depuis ENV_EXAMPLE.md)
```

**Fichiers MD dans components/ et lib/**
```bash
# Vérifier utilité et déplacer si nécessaire
cat components/landing/MATCHING_CARDS_REFONTE.md  # Déjà référencé ci-dessus
cat components/landing/README.md  # Supprimer si obsolète ou consolider
cat lib/supabase/queries/README.md  # Garder si documentation des queries
```

### PRIORITÉ MOYENNE - FICHIERS À VÉRIFIER

```bash
# proxy.ts : Vérifier s'il est utilisé
grep -r "proxy.ts" app/ lib/ components/
# Si non utilisé : rm proxy.ts

# jest.config.js et eslint.config.mjs : Vérifier build
# Ces fichiers ne devraient pas être inclus dans le bundle Next.js
# Mais nécessaires pour dev. Garder.

# Dossier public/readme/ : Screenshots documentation
ls -lh public/readme/
# Si volumineux et inutile en prod : rm -rf public/readme/
```

---

## 🚀 Instructions d'exécution

### Phase 1 - Analyse Initiale (15-30 min)

**Étape 1.1 : Parcourir le codebase et générer un rapport**

Utilise les commandes suivantes pour identifier les problèmes :

```bash
# 1. Code mort : Imports inutilisés (nécessite extension VSCode/Cursor)
# Commande manuelle via Cursor : "Find all unused imports in workspace"

# 2. Console.log et debuggers
grep -rn "console.log\|console.error\|debugger" app/ lib/ components/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules

# 3. TODOs et FIXMEs
grep -rn "TODO\|FIXME\|XXX\|HACK" app/ lib/ components/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules

# 4. Secrets potentiels hardcodés (faux positifs possibles)
grep -rn "sk_test\|sk_live\|SUPABASE_SERVICE_ROLE" app/ lib/ components/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules

# 5. Fichiers volumineux (> 500 lignes)
find app/ lib/ components/ -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -20

# 6. Composants avec 'use client' (vérifier si nécessaire)
grep -rn "'use client'" app/ components/ --include="*.tsx"

# 7. Dépendances inutilisées
npx depcheck

# 8. Vulnérabilités npm
npm audit --production
```

**Étape 1.2 : Générer un rapport structuré**

Crée un fichier `CLEANUP_REPORT.md` avec :

```markdown
# Rapport de nettoyage Nuply

Date : [DATE]

## 1. Code mort identifié
- [ ] Fichier X : fonction Y non utilisée
- [ ] Composant Z : props inutiles A, B, C

## 2. Console.log et debuggers
- [ ] app/couple/dashboard/page.tsx:45
- [ ] lib/supabase/queries/conversations.ts:128

## 3. TODOs critiques
- [ ] TODO: Implémenter retry logic (lib/stripe/webhooks.ts:56)
- [ ] FIXME: Race condition possible (app/api/messages/route.ts:89)

## 4. Problèmes de sécurité potentiels
- [ ] Validation manquante : app/api/profile/route.ts
- [ ] RLS policy à vérifier : table conversations

## 5. Optimisations de performance
- [ ] N+1 query détecté : lib/supabase/queries/events.ts:34
- [ ] Re-render excessifs : components/dashboard/EventList.tsx

## 6. Fichiers à nettoyer
- [ ] claude.md (1692 lignes) → docs/internal/
- [ ] BUDGET_SCHEMA.sql (redondant) → supabase/migrations/
- [ ] .idea/ → supprimer

## 7. Documentation à réorganiser
- [ ] 27 fichiers MD en racine → docs/
```

---

### Phase 2 - Nettoyage Automatique (30-60 min)

**Étape 2.1 : Nettoyage fichiers inutiles**

```bash
# 1. Supprimer configuration IDE
rm -rf .idea/

# 2. Archiver claude.md
mkdir -p docs/internal
mv claude.md docs/internal/claude-context.md

# 3. Supprimer fichiers SQL redondants (après vérification)
rm BUDGET_SCHEMA.sql BUDGET_CATEGORIES_UPDATE.sql PROFILE_SCHEMA.sql SIGNUP_SQL.sql supabase-policies.sql

# 4. Réorganiser documentation (voir section précédente)
mkdir -p docs/{setup,deployment,architecture,guides,internal}
# [Exécuter les mv listés ci-dessus]

# 5. Mettre à jour .gitignore si nécessaire
echo ".idea/" >> .gitignore
echo "*.iml" >> .gitignore
echo "docs/internal/claude-context.md" >> .gitignore  # Si souhaité
```

**Étape 2.2 : Nettoyage du code (fichier par fichier)**

Pour chaque fichier identifié :

1. **Supprimer les imports inutilisés**
   - Utilise Cursor/VSCode : `Organize Imports` (Shift+Alt+O)
   - Vérifier manuellement les imports types inutilisés

2. **Retirer les console.log/debugger**
   ```typescript
   // AVANT
   console.log('User data:', user)
   debugger

   // APRÈS
   // Supprimé

   // Exception : garder les logs d'erreur critiques en production
   console.error('[CRITICAL] Payment failed:', error)  // OK
   ```

3. **Supprimer le code commenté**
   ```typescript
   // AVANT
   // const oldFunction = () => { ... }
   // TODO: Refactor this later

   // APRÈS
   // Supprimé complètement
   ```

4. **Optimiser les imports**
   ```typescript
   // AVANT
   import { Button } from '@/components/ui/button'
   import { Dialog } from '@/components/ui/dialog'
   import { Input } from '@/components/ui/input'

   // APRÈS (si plusieurs imports du même dossier)
   import { Button, Dialog, Input } from '@/components/ui'
   // Ou garder séparés si tree-shaking est meilleur
   ```

5. **Vérifier 'use client'**
   ```typescript
   // AVANT (inutile si pas de hooks/events)
   'use client'
   export default function StaticContent() { ... }

   // APRÈS
   export default function StaticContent() { ... }  // Server Component par défaut
   ```

**Étape 2.3 : Optimisations automatiques**

```bash
# 1. Formater tout le code
npx prettier --write "app/**/*.{ts,tsx}" "lib/**/*.{ts,tsx}" "components/**/*.{ts,tsx}"

# 2. Linter et auto-fix
npx eslint "app/**/*.{ts,tsx}" "lib/**/*.{ts,tsx}" "components/**/*.{ts,tsx}" --fix

# 3. Vérifier TypeScript
npx tsc --noEmit

# 4. Nettoyer dépendances
npm prune
```

---

### Phase 3 - Refactoring Ciblé (1-2 heures)

**Étape 3.1 : Patterns Next.js 16 à améliorer**

1. **Server Components par défaut**
   ```typescript
   // AVANT (inutile)
   'use client'
   import { getUser } from '@/lib/supabase/queries'

   export default function Profile() {
     const user = await getUser()
     return <div>{user.name}</div>
   }

   // APRÈS
   import { getUser } from '@/lib/supabase/queries'

   export default async function Profile() {
     const user = await getUser()
     return <div>{user.name}</div>
   }
   ```

2. **Server Actions pour mutations**
   ```typescript
   // AVANT (API route inutile)
   // app/api/profile/update/route.ts
   export async function POST(req: Request) {
     const data = await req.json()
     // Update profile
   }

   // APRÈS (Server Action)
   // lib/actions/profile.ts
   'use server'
   export async function updateProfile(formData: FormData) {
     // Update profile
     revalidatePath('/couple/profile')
   }
   ```

3. **Optimiser les requêtes Supabase**
   ```typescript
   // AVANT (N+1)
   const events = await supabase.from('events').select('*')
   for (const event of events) {
     const prestataire = await supabase.from('prestataires').select('*').eq('id', event.prestataire_id)
   }

   // APRÈS (join efficace)
   const events = await supabase
     .from('events')
     .select('*, prestataire:prestataires(*)')
   ```

**Étape 3.2 : Patterns React 19 à améliorer**

1. **useOptimistic pour UX instantanée**
   ```typescript
   // AVANT
   const [messages, setMessages] = useState([])
   const sendMessage = async (text) => {
     const newMsg = await fetch('/api/messages', { body: text })
     setMessages([...messages, newMsg])
   }

   // APRÈS (React 19)
   const [messages, setMessages] = useState([])
   const [optimisticMessages, addOptimisticMessage] = useOptimistic(
     messages,
     (state, newMsg) => [...state, newMsg]
   )

   const sendMessage = async (text) => {
     addOptimisticMessage({ text, pending: true })
     await fetch('/api/messages', { body: text })
   }
   ```

2. **Refs simplifiées**
   ```typescript
   // AVANT (React 18 pattern obsolète)
   const Input = forwardRef((props, ref) => {
     return <input ref={ref} {...props} />
   })

   // APRÈS (React 19 - automatic)
   const Input = (props) => {
     return <input {...props} />  // ref automatique
   }
   ```

**Étape 3.3 : Sécurité et validations**

1. **Valider avec Zod dans Server Actions**
   ```typescript
   // lib/actions/profile.ts
   'use server'
   import { profileSchema } from '@/lib/validations/profile'

   export async function updateProfile(formData: FormData) {
     const data = Object.fromEntries(formData)

     // Valider
     const validated = profileSchema.safeParse(data)
     if (!validated.success) {
       return { error: 'Invalid data', issues: validated.error.issues }
     }

     // Update
     const { error } = await supabase
       .from('profiles')
       .update(validated.data)
       .eq('id', userId)

     if (error) return { error: error.message }

     revalidatePath('/couple/profile')
     return { success: true }
   }
   ```

2. **Rate limiting sur API routes sensibles**
   ```typescript
   // lib/rate-limit.ts
   import { Ratelimit } from '@upstash/ratelimit'
   import { Redis } from '@upstash/redis'

   export const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(10, '10 s'),
   })

   // app/api/messages/route.ts
   export async function POST(req: Request) {
     const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
     const { success } = await ratelimit.limit(ip)

     if (!success) {
       return Response.json({ error: 'Too many requests' }, { status: 429 })
     }

     // Process message
   }
   ```

3. **Vérifier RLS policies**
   ```sql
   -- Exemple : conversations accessibles uniquement par couple_id ou prestataire_id
   CREATE POLICY "Users can only access their conversations"
   ON conversations
   FOR SELECT
   USING (
     auth.uid() IN (
       SELECT user_id FROM couples WHERE id = conversations.couple_id
       UNION
       SELECT user_id FROM prestataires WHERE id = conversations.prestataire_id
     )
   );
   ```

---

### Phase 4 - Validation Finale (30 min)

**Étape 4.1 : Tests et build**

```bash
# 1. Vérifier TypeScript
npx tsc --noEmit

# 2. Linter final
npx eslint . --max-warnings 0

# 3. Build production
npm run build

# 4. Vérifier la taille du bundle
npm run build && npx next analyze  # Si @next/bundle-analyzer installé

# 5. Tests critiques (si existants)
npm test

# 6. Test de démarrage
npm run start  # Vérifier que l'app démarre correctement
```

**Étape 4.2 : Vérifications manuelles**

```bash
# 1. Aucun secret hardcodé
grep -r "sk_live\|sk_test\|service_role" app/ lib/ components/

# 2. Aucun console.log restant
grep -rn "console.log" app/ lib/ components/ --include="*.ts" --include="*.tsx"

# 3. Variables d'environnement complètes
node scripts/validate-env.ts

# 4. Documentation à jour
cat README.md  # Vérifier que le setup est correct
```

**Étape 4.3 : Checklist de déploiement**

```markdown
## Pre-deployment Checklist

### Code
- [ ] TypeScript compile sans erreurs
- [ ] ESLint passe sans warnings
- [ ] Build production réussit
- [ ] Aucun console.log en dehors de error logs
- [ ] Aucun secret hardcodé

### Performance
- [ ] Bundle size < 300KB (first load JS)
- [ ] Images optimisées avec next/image
- [ ] Server Components utilisés par défaut
- [ ] Dynamic imports pour grosses libs (pdf-lib, etc.)

### Sécurité
- [ ] Variables .env.production configurées
- [ ] RLS policies actives sur toutes les tables sensibles
- [ ] Rate limiting sur API routes critiques
- [ ] CORS configuré correctement
- [ ] Headers de sécurité dans next.config.ts

### Database (Supabase)
- [ ] Toutes les migrations appliquées en prod
- [ ] Indexes sur colonnes fréquentes (user_id, couple_id, created_at)
- [ ] Triggers et fonctions testés
- [ ] Storage buckets avec bonnes policies

### Intégrations
- [ ] Stripe webhooks configurés (prod endpoint)
- [ ] Resend email validé (domaine vérifié)
- [ ] OpenAI API key production
- [ ] Supabase production project créé

### Monitoring
- [ ] Sentry ou équivalent configuré
- [ ] Logs d'erreurs centralisés
- [ ] Uptime monitoring (Vercel, Checkly, etc.)
- [ ] Budget alerts Stripe configurés

### Documentation
- [ ] README à jour avec setup prod
- [ ] Variables d'environnement documentées
- [ ] Architecture documentée (docs/architecture/)
- [ ] Guides admin/couple/prestataire (docs/guides/)
```

---

## 🎯 Priorités de nettoyage

### ❌ CRITIQUE (à faire OBLIGATOIREMENT)

1. **Supprimer secrets et clés hardcodées**
   - Vérifier qu'aucune clé API n'est dans le code
   - S'assurer que `.env.local` est dans `.gitignore`

2. **Retirer console.log en production**
   - Supprimer tous les console.log sauf error logs critiques
   - Utiliser un logger structuré si nécessaire (pino, winston)

3. **Fixer les failles de sécurité**
   - Rate limiting sur signup, messages, webhooks
   - RLS policies sur toutes les tables sensibles
   - Validation Zod sur toutes les entrées utilisateur

4. **Implémenter la gestion d'erreurs critique**
   - error.tsx et global-error.tsx dans app/
   - Try/catch dans toutes les API routes et Server Actions
   - Fallbacks UI pour Suspense boundaries

5. **Nettoyer documentation de dev**
   - Supprimer .idea/
   - Archiver claude.md
   - Réorganiser 27 fichiers MD en racine

### ⚠️ IMPORTANT (fortement recommandé)

6. **Optimiser les performances**
   - Utiliser Server Components par défaut
   - Optimiser requêtes Supabase (joins, select efficace)
   - Dynamic imports pour grosses libs

7. **Nettoyer le code mort**
   - Supprimer imports inutilisés
   - Retirer composants non référencés
   - Éliminer fonctions obsolètes

8. **Améliorer la lisibilité**
   - Supprimer code commenté
   - Simplifier logique complexe
   - Ajouter JSDoc sur fonctions critiques

9. **Documenter le code complexe**
   - Ajouter comments sur logique métier
   - Documenter les Server Actions
   - Expliquer les RLS policies

### ✨ NICE TO HAVE (si temps disponible)

10. **Refactoring avancé**
    - Extraire hooks réutilisables
    - Créer composants génériques
    - Améliorer types TypeScript

11. **Tests supplémentaires**
    - Tests E2E critiques (signup, paiement)
    - Tests unitaires Server Actions
    - Tests integration Supabase

12. **Documentation exhaustive**
    - Guide admin complet
    - Guide couple/prestataire
    - Architecture détaillée

---

## 📊 Format de sortie souhaité

Pour chaque fichier nettoyé, fournis un rapport structuré :

```markdown
### Fichier : app/couple/dashboard/page.tsx

**Problèmes trouvés** :
- ❌ 3 imports inutilisés (Button, Card, Input)
- ⚠️ 2 console.log (lignes 45, 67)
- 🐛 Props drilling excessif (user passé sur 3 niveaux)
- ⚡ Re-render inutile (useEffect sans deps)

**Actions effectuées** :
- ✅ Supprimé imports inutilisés
- ✅ Retiré console.log
- ✅ Utilisé Zustand pour state user (éviter props drilling)
- ✅ Ajouté deps array à useEffect

**Suggestions additionnelles** :
- 💡 Considérer Server Component (pas de hooks nécessaires)
- 💡 Extraire EventList en composant séparé
- 💡 Ajouter Suspense boundary pour chargement events

**Impact** :
- Réduction bundle : -2.3 KB
- Performance : +15% (moins de re-renders)
- Maintenabilité : +++
```

---

## 🚀 Commande de démarrage rapide

Utilise cette commande pour commencer l'analyse :

```bash
# 1. Créer un rapport de nettoyage
cat > CLEANUP_REPORT.md <<EOF
# Rapport de nettoyage Nuply - $(date +%Y-%m-%d)

## Analyse en cours...
EOF

# 2. Identifier problèmes prioritaires
echo "\n## Console.logs détectés:" >> CLEANUP_REPORT.md
grep -rn "console.log" app/ lib/ components/ --include="*.ts" --include="*.tsx" | tee -a CLEANUP_REPORT.md

echo "\n## TODOs critiques:" >> CLEANUP_REPORT.md
grep -rn "TODO\|FIXME" app/ lib/ components/ --include="*.ts" --include="*.tsx" | tee -a CLEANUP_REPORT.md

echo "\n## Fichiers volumineux (>500 lignes):" >> CLEANUP_REPORT.md
find app/ lib/ components/ \( -name "*.ts" -o -name "*.tsx" \) -exec wc -l {} + | sort -rn | head -20 | tee -a CLEANUP_REPORT.md

# 3. Vérifier dépendances
echo "\n## Dépendances inutilisées:" >> CLEANUP_REPORT.md
npx depcheck | tee -a CLEANUP_REPORT.md

# 4. Vulnérabilités
echo "\n## Vulnérabilités npm:" >> CLEANUP_REPORT.md
npm audit --production | tee -a CLEANUP_REPORT.md

echo "\n✅ Rapport généré : CLEANUP_REPORT.md"
```

Ensuite, procède fichier par fichier de manière méthodique en commençant par :

1. **Nettoyage documentation** (15 min)
2. **Suppression console.log** (30 min)
3. **Nettoyage imports inutilisés** (30 min)
4. **Optimisations performance** (1-2h)
5. **Validations sécurité** (1h)

---

## ⚠️ Notes importantes

**Avant toute modification** :

1. ✅ **Assure-toi d'avoir un backup** ou que le code est versionné sur Git
2. ✅ **Crée une branche de nettoyage** : `git checkout -b cleanup/pre-launch`
3. ✅ **Commence par les fichiers les moins critiques** pour tester ton approche
4. ✅ **Teste après chaque modification** : `npm run build && npm run start`
5. ✅ **Commit régulièrement** avec messages clairs : `git commit -m "chore: remove console.logs from dashboard"`

**Pendant le nettoyage** :

- 🚫 **Ne jamais supprimer** du code que tu ne comprends pas
- 🚫 **Ne jamais refactorer** et nettoyer en même temps (séparer les commits)
- 🚫 **Ne jamais modifier** la logique métier sans tests
- ✅ **Toujours vérifier** que l'app build après modifications
- ✅ **Documenter** les décisions de suppression dans CLEANUP_REPORT.md

**Après le nettoyage** :

- ✅ **Build production** : `npm run build`
- ✅ **Tests complets** : Tester signup, auth, dashboard, messages, paiement
- ✅ **Review du code** : Demander une relecture si possible
- ✅ **Merge avec précaution** : `git merge cleanup/pre-launch`

---

## 📚 Ressources Nuply

**Documentation existante** :
- Architecture : `docs/architecture/ARCHITECTURE_ROBUSTE.md`
- Setup : `docs/setup/SUPABASE_SETUP.md`, `docs/setup/STRIPE_SETUP.md`
- Security : `docs/architecture/AUDIT_SECURITE_NUPLY.md`

**Structure du projet** :
- `/app` : Routes Next.js (couple, prestataire, admin, api)
- `/components` : Composants UI (ui, dashboard, landing, etc.)
- `/lib` : Logique métier (actions, auth, supabase, stripe, validations)
- `/hooks` : Custom hooks React
- `/store` : Zustand stores (user, budget, theme)
- `/types` : Types TypeScript
- `/public` : Assets statiques

**Technologies clés** :
- Next.js 16 : https://nextjs.org/docs
- React 19 : https://react.dev/blog/2024/12/05/react-19
- Supabase : https://supabase.com/docs
- Stripe : https://stripe.com/docs/api
- shadcn/ui : https://ui.shadcn.com

---

**Bonne chance pour le lancement de Nuply ! 🚀💍**
