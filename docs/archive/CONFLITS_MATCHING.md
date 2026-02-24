# 🔍 Conflits potentiels identifiés dans les fichiers de matching

## ❌ PROBLÈMES CRITIQUES

### 1. **Table `prestataire_public_profiles` n'existe pas**
**Fichier** : `app/api/matching/route.ts` (lignes 41-44, 101-102)

**Problème** : La requête Supabase essaie d'accéder à une table `prestataire_public_profiles` qui n'existe pas dans les migrations.

**Impact** : L'API va échouer avec une erreur "relation does not exist".

**Solution** : 
- Vérifier si cette table existe sous un autre nom
- Ou créer la table si nécessaire
- Ou utiliser une autre source pour `rating` et `total_reviews`

---

### 2. **Table `portfolio_images` n'existe pas**
**Fichier** : `app/api/matching/route.ts` (lignes 91-94)

**Problème** : La requête utilise `portfolio_images` mais les migrations mentionnent `provider_portfolio`.

**Impact** : Le comptage du portfolio va échouer.

**Solution** : 
- Vérifier le nom exact de la table (probablement `provider_portfolio`)
- Vérifier le nom de la colonne (probablement `prestataire_id` au lieu de `prestataire_id`)

---

### 3. **Table `matching_history` n'existe pas**
**Fichier** : `app/api/matching/route.ts` (lignes 134-142)

**Problème** : Tentative d'insertion dans `matching_history` qui n'existe pas.

**Impact** : La sauvegarde de l'historique va échouer (mais l'erreur est catchée, donc l'API retournera quand même les résultats).

**Solution** : 
- Créer la table `matching_history` avec les colonnes appropriées
- Ou commenter cette partie temporairement

---

## ⚠️ PROBLÈMES MOYENS

### 4. **Champs manquants dans `profiles`**
**Fichier** : `app/api/matching/route.ts` (lignes 38-39)

**Problème** : Les champs suivants sont sélectionnés mais peuvent ne pas exister :
- `guest_capacity_min` - pas trouvé dans les migrations
- `guest_capacity_max` - pas trouvé dans les migrations
- `languages` - existe dans `couple_preferences` mais pas dans `profiles`
- `response_rate` - pas trouvé dans les migrations

**Impact** : La requête peut échouer ou retourner `null` pour ces champs.

**Solution** : 
- Vérifier quels champs existent réellement dans `profiles`
- Retirer les champs qui n'existent pas ou les rendre optionnels

---

### 5. **Nom de colonne dans `provider_cultures` et `provider_zones`**
**Fichier** : `app/api/matching/route.ts` (lignes 79-88)

**Problème** : Le code utilise `profile_id` mais selon les migrations, il pourrait s'agir de `prestataire_id`.

**Impact** : Les requêtes peuvent échouer si le nom de colonne est incorrect.

**Solution** : 
- Vérifier le nom exact de la colonne dans les tables `provider_cultures` et `provider_zones`
- Utiliser `prestataire_id` si c'est le standard dans le projet

---

## 💡 PROBLÈMES MINEURS

### 6. **Import incohérent de `SearchCriteria`**
**Fichier** : `lib/matching/scoring.ts` (ligne 3)

**Problème** : Import depuis `@/types/chatbot` alors que `@/types/matching` l'importe déjà.

**Impact** : Aucun impact fonctionnel, mais incohérence dans le code.

**Solution** : 
- Garder tel quel (fonctionne)
- Ou importer depuis `@/types/matching` pour plus de cohérence

---

### 7. **Type `any` utilisé pour `provider`**
**Fichier** : `lib/matching/scoring.ts` (ligne 164)

**Problème** : Le paramètre `provider` est typé `any` au lieu d'un type spécifique.

**Impact** : Perte de sécurité de type TypeScript.

**Solution** : 
- Créer un type `Provider` ou utiliser un type existant
- Typage plus strict pour éviter les erreurs à l'exécution

---

## 📋 RÉSUMÉ DES ACTIONS REQUISES

### Actions immédiates (bloquantes) :
1. ✅ Vérifier/créer la table `prestataire_public_profiles` ou utiliser une alternative
2. ✅ Vérifier le nom exact de la table portfolio (`portfolio_images` vs `provider_portfolio`)
3. ✅ Vérifier/créer la table `matching_history`
4. ✅ Vérifier les noms de colonnes dans `provider_cultures` et `provider_zones`

### Actions recommandées (non-bloquantes) :
5. ✅ Vérifier les champs existants dans `profiles` et retirer ceux qui n'existent pas
6. ✅ Créer un type TypeScript pour `Provider` au lieu d'utiliser `any`
7. ✅ Uniformiser les imports de types

---

## 🔧 FICHIERS À MODIFIER

1. **`app/api/matching/route.ts`** - Corrections des noms de tables et colonnes
2. **`lib/matching/scoring.ts`** - Amélioration du typage
3. **Créer les migrations manquantes** pour `matching_history` et autres tables si nécessaire
