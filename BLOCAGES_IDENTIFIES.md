# Blocages identifiés dans le code

## Date: 2025-01-13

## Problèmes critiques identifiés

### 1. ❌ Tables inexistantes utilisées dans le code

#### `couple_profiles` (n'existe pas)
**Fichiers affectés:**
- `lib/actions/profile.ts` ligne 259
- `lib/actions/profile.ts` lignes 194, 202, 213

**Problème:** Le code essaie d'accéder à `couple_profiles` qui n'existe pas dans le schéma fourni. Le schéma utilise `couples` à la place.

**Solution:** Remplacer toutes les références à `couple_profiles` par `couples`.

#### `prestataire_profiles` (n'existe pas)
**Fichiers affectés:**
- `app/couple/demandes/page.tsx` lignes 225, 293, 365

**Problème:** Le code essaie d'accéder à `prestataire_profiles` qui n'existe pas. Les données prestataires sont dans `profiles` avec `role='prestataire'`.

**Solution:** Remplacer les requêtes vers `prestataire_profiles` par des requêtes vers `profiles` avec filtre `role='prestataire'`.

#### `couple_budgets` (n'existe pas)
**Fichiers affectés:**
- `lib/actions/profile.ts` ligne 266
- `lib/actions/budget.ts` lignes 24, 96

**Problème:** Le code essaie d'accéder à `couple_budgets` qui n'existe pas. Le budget est stocké dans `couples` (colonnes `budget_min`, `budget_max`, `budget_total`) ou dans `budget_items`.

**Solution:** Remplacer les requêtes vers `couple_budgets` par des requêtes vers `couples` ou `budget_items`.

### 2. ❌ Références incorrectes de clés étrangères

#### `conversations.couple_id` pointe vers `couples(id)`, pas `profiles(id)`
**Fichiers affectés:**
- `lib/supabase/messages.ts` lignes 30-35

**Problème:** Le code essaie de récupérer le profil couple depuis `profiles` avec `conv.couple_id`, mais `couple_id` dans `conversations` référence `couples(id)`, pas `profiles(id)`. Il faut d'abord récupérer le couple depuis `couples`, puis joindre avec `profiles` via `couples.user_id`.

**Solution:** 
```typescript
// Au lieu de:
supabase.from('profiles').eq('id', conv.couple_id)

// Utiliser:
const { data: couple } = await supabase
  .from('couples')
  .select('id, user_id, partner_1_name, partner_2_name')
  .eq('id', conv.couple_id)
  .single()

const { data: coupleProfile } = await supabase
  .from('profiles')
  .select('id, prenom, nom')
  .eq('id', couple.user_id)
  .single()
```

#### `app/couple/messagerie/page.tsx` utilise `user.id` directement pour `couple_id`
**Fichiers affectés:**
- `app/couple/messagerie/page.tsx` ligne 138

**Problème:** Le code utilise `user.id` (qui est l'ID de `auth.users`) directement pour filtrer `couple_id`, mais `couple_id` dans `conversations` référence `couples(id)`, pas `auth.users(id)`. Il faut d'abord récupérer le couple via `couples.user_id = user.id`, puis utiliser `couples.id`.

**Solution:**
```typescript
// Au lieu de:
.eq('couple_id', user.id)

// Utiliser:
const { data: couple } = await supabase
  .from('couples')
  .select('id')
  .eq('user_id', user.id)
  .single()

if (couple) {
  .eq('couple_id', couple.id)
}
```

#### `app/couple/demandes/page.tsx` utilise `user.id` directement pour `couple_id`
**Fichiers affectés:**
- `app/couple/demandes/page.tsx` ligne 266

**Problème:** Même problème que ci-dessus.

**Solution:** Utiliser `couples.id` au lieu de `user.id`.

### 3. ⚠️ Problèmes potentiels de RLS

#### Requêtes vers `profiles` pour les couples
**Problème:** Les couples n'ont pas de profil dans `profiles` selon le schéma fourni. Ils ont un profil dans `couples`. Les politiques RLS permettent à tous les utilisateurs authentifiés de voir tous les profils, mais si un couple n'a pas de profil dans `profiles`, les requêtes échoueront.

**Solution:** Vérifier si le couple a un profil dans `profiles` avant de faire la requête, ou utiliser directement les données de `couples`.

### 4. ⚠️ Colonnes manquantes ou incorrectes

#### `devis.couple_id` référence
**Fichiers affectés:**
- `app/couple/demandes/page.tsx` ligne 266

**Problème:** Le code utilise `user.id` pour filtrer `devis.couple_id`, mais `couple_id` dans `devis` référence `couples(id)`, pas `auth.users(id)`.

**Solution:** Utiliser `couples.id` au lieu de `user.id`.

## Résumé des corrections nécessaires

1. ✅ Remplacer `couple_profiles` par `couples` dans `lib/actions/profile.ts`
2. ✅ Remplacer `prestataire_profiles` par `profiles` avec filtre `role='prestataire'` dans `app/couple/demandes/page.tsx`
3. ✅ Remplacer `couple_budgets` par `couples` ou `budget_items` dans `lib/actions/profile.ts` et `lib/actions/budget.ts`
4. ✅ Corriger la récupération du profil couple dans `lib/supabase/messages.ts`
5. ✅ Corriger l'utilisation de `user.id` vs `couples.id` dans `app/couple/messagerie/page.tsx`
6. ✅ Corriger l'utilisation de `user.id` vs `couples.id` dans `app/couple/demandes/page.tsx`
