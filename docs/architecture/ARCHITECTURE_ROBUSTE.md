# Architecture Robuste - Guide de Développement

## Vue d'ensemble

Cette architecture remplace les "pansements" par une solution robuste et maintenable sur le long terme.

## Principes de conception

### 1. ✅ Validation stricte au démarrage

**Avant** : Les variables d'environnement étaient vérifiées à l'exécution, causant des erreurs silencieuses.

**Maintenant** : 
- Validation avec Zod au chargement du module
- L'application ne démarre pas si les variables requises sont manquantes
- Messages d'erreur clairs indiquant exactement ce qui manque

```typescript
// lib/config/env.ts
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  // ...
})

// Validation au chargement - échoue immédiatement si invalide
const config = getEnvConfig()
```

### 2. ✅ Configuration typée et centralisée

**Avant** : Variables d'environnement accédées directement avec `process.env`

**Maintenant** :
- Configuration validée et typée dans `lib/config/env.ts`
- Accès type-safe via `getEnvConfig()`
- Vérification des fonctionnalités optionnelles avec `isFeatureEnabled()`

```typescript
import { getEnvConfig, isFeatureEnabled } from '@/lib/config/env'

const config = getEnvConfig() // Type-safe, toujours valide
if (isFeatureEnabled('email')) {
  // Utiliser Resend
}
```

### 3. ✅ Système d'erreur typé

**Avant** : Erreurs génériques avec messages strings

**Maintenant** :
- Classes d'erreur typées dans `lib/errors/api-errors.ts`
- Codes d'erreur standardisés (`ApiErrorCode`)
- Factory functions pour créer des erreurs cohérentes

```typescript
import { ApiErrors } from '@/lib/errors/api-errors'

if (!user) {
  throw ApiErrors.unauthorized()
}

if (validationError) {
  throw ApiErrors.validation('Message invalide', details)
}
```

### 4. ✅ Gestion d'erreur automatique

**Avant** : Try-catch manuel dans chaque route

**Maintenant** :
- Wrapper `withErrorHandling` qui capture automatiquement les erreurs
- Conversion automatique en réponses HTTP appropriées
- Logging structuré selon le type d'erreur

```typescript
import { withErrorHandling } from '@/lib/errors/error-handler'

async function myHandler(req: NextRequest) {
  // Pas besoin de try-catch
  // Les erreurs sont automatiquement capturées et formatées
  throw ApiErrors.notFound()
}

export const POST = withErrorHandling(myHandler)
```

### 5. ✅ Clients Supabase centralisés

**Avant** : Création de clients avec validation à chaque appel

**Maintenant** :
- Clients créés une fois avec la configuration validée
- Pas de vérification répétée
- Code plus propre et performant

```typescript
// lib/config/supabase.ts
export function createBrowserSupabaseClient() {
  const config = getEnvConfig() // Déjà validé
  return createBrowserClient(config.NEXT_PUBLIC_SUPABASE_URL, ...)
}
```

## Structure des fichiers

```
lib/
├── config/
│   ├── env.ts              # Validation et typage des variables d'env
│   └── supabase.ts         # Clients Supabase centralisés
├── errors/
│   ├── api-errors.ts       # Classes d'erreur typées
│   └── error-handler.ts     # Gestionnaire d'erreur centralisé
└── supabase/
    ├── client.ts           # Export du client navigateur
    ├── server.ts           # Export du client serveur
    └── admin.ts            # Export du client admin
```

## Workflow de développement

### 1. Ajouter une nouvelle variable d'environnement

```typescript
// lib/config/env.ts
const envSchema = z.object({
  // ... existantes
  MA_NOUVELLE_VAR: z.string().min(1, 'Description de l\'erreur'),
})
```

### 2. Créer une nouvelle route API

```typescript
import { NextRequest } from 'next/server'
import { withErrorHandling } from '@/lib/errors/error-handler'
import { ApiErrors } from '@/lib/errors/api-errors'
import { createClient } from '@/lib/supabase/server'

async function myHandler(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw ApiErrors.unauthorized()
  }
  
  // Votre logique ici
  return NextResponse.json({ success: true })
}

export const POST = withErrorHandling(myHandler)
```

### 3. Valider la configuration avant déploiement

```bash
npm run validate:env
```

## Avantages de cette architecture

1. **Fail-fast** : Les erreurs de configuration sont détectées immédiatement
2. **Type-safe** : TypeScript garantit la cohérence des types
3. **Maintenable** : Code organisé et facile à comprendre
4. **Testable** : Fonctions pures faciles à tester
5. **Évolutif** : Facile d'ajouter de nouvelles fonctionnalités
6. **Robuste** : Pas de surprises en production

## Migration depuis l'ancien système

### Ancien code
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) {
  return NextResponse.json({ error: 'Config manquante' }, { status: 500 })
}
```

### Nouveau code
```typescript
// La validation est faite au démarrage
// Si la config est invalide, l'app ne démarre pas
const supabase = await createClient() // Toujours valide
```

## Validation au build

Le script `validate-env.ts` est exécuté automatiquement avant chaque build :

```bash
npm run build
# → Valide la config
# → Build seulement si valide
```

Pour valider manuellement :

```bash
npm run validate:env
```

## Prochaines améliorations possibles

1. **Monitoring** : Intégrer Sentry pour le tracking d'erreurs
2. **Tests** : Ajouter des tests unitaires pour la validation
3. **Documentation** : Générer automatiquement la doc des variables d'env
4. **Secrets** : Intégrer avec un gestionnaire de secrets (Vault, etc.)
