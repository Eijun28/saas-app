# Analyse de la table `profiles` et corrections apportées

## ✅ Vérification de la table `profiles`

Votre table `profiles` est **correcte** et permet aux prestataires de s'inscrire. Voici les points validés :

### Structure de la table
- ✅ `id` : UUID avec contrainte PRIMARY KEY et FOREIGN KEY vers `auth.users(id)`
- ✅ `email` : TEXT NOT NULL avec index unique partiel (permet plusieurs NULL mais pas de doublons)
- ✅ `role` : TEXT NULL avec contrainte CHECK `(role IS NULL OR role = 'prestataire')`
- ✅ `prenom`, `nom`, `nom_entreprise` : TEXT NULL (données d'inscription)
- ✅ Toutes les colonnes nécessaires pour le profil prestataire (service_type, avatar_url, bio, etc.)
- ✅ Contraintes de validation (budget_range_valid, description_courte_length)
- ✅ Index optimisés pour les recherches

### Points importants
1. **Séparation claire** : Seuls les prestataires sont dans `profiles`, les couples sont dans `couples`
2. **Email unique** : Index unique partiel sur `email` (permet NULL mais pas de doublons)
3. **Role nullable** : Le `role` peut être NULL, mais s'il est défini, il doit être `'prestataire'`

## 🔧 Corrections apportées au code

### 1. Simplification de la logique de connexion

**Avant** : Vérification explicite du `role = 'prestataire'`
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', data.user.id)
  .eq('role', 'prestataire')
  .single()
```

**Après** : Simplification car si dans `profiles`, c'est forcément un prestataire
```typescript
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id')
  .eq('id', data.user.id)
  .maybeSingle()
```

**Avantages** :
- ✅ Plus simple et plus rapide (pas besoin de vérifier le role)
- ✅ Utilise `.maybeSingle()` au lieu de `.single()` pour éviter les erreurs si aucun résultat
- ✅ Logique cohérente : si dans `profiles` → prestataire, si dans `couples` → couple

### 2. Retrait de la référence à `onboarding_completed`

Le code d'inscription utilisait `onboarding_completed: false` mais cette colonne n'existe pas dans votre table. Cette référence a été retirée.

### 3. Fichiers modifiés

- ✅ `lib/auth/actions.ts` : Fonction `signIn()` simplifiée
- ✅ `lib/auth/actions.ts` : Retrait de `onboarding_completed` dans `profileInsertData`
- ✅ `proxy.ts` : Logique de redirection simplifiée (2 endroits)
- ✅ `app/(auth)/auth/callback/route.ts` : Logique de callback simplifiée

## ⚠️ Attention : Trigger à corriger

Le trigger `handle_new_user()` dans la migration `028_fix_prestataire_signup.sql` utilise encore `onboarding_completed` qui n'existe pas dans votre table. 

**Options** :
1. **Retirer `onboarding_completed` du trigger** (recommandé si vous n'avez pas besoin de cette colonne)
2. **Ajouter la colonne `onboarding_completed` à votre table** (si vous en avez besoin)

## 📋 Résumé du flux d'inscription prestataire

1. **Inscription** (`/sign-up`) :
   - Création dans `auth.users` avec métadonnées (role, prenom, nom, nom_entreprise)
   - Trigger crée un profil basique dans `profiles` (si role = 'prestataire')
   - Code d'application fait un `upsert` pour compléter le profil avec toutes les données

2. **Connexion** (`/sign-in`) :
   - Authentification via `auth.users`
   - Vérification dans `couples` → si trouvé → couple
   - Sinon vérification dans `profiles` → si trouvé → prestataire
   - Redirection vers le dashboard approprié

## ✅ Conclusion

Votre table `profiles` est **correcte** et permet aux prestataires de s'inscrire sans problème. Les corrections apportées simplifient la logique de connexion et éliminent les vérifications inutiles du role.

**Prochaine étape** : Corriger le trigger pour retirer la référence à `onboarding_completed` si cette colonne n'existe pas dans votre table.
