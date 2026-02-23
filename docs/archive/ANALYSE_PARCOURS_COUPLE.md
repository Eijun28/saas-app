# Analyse du Parcours Utilisateur Couple

## Bugs Corrigés ✅

### 1. **BUG CRITIQUE - Incohérence des noms lors de l'inscription**
**Problème** : Lors de l'inscription, le formulaire demande un seul "Prénom" et "Nom", mais le code les stockait comme `partner_1_name` et `partner_2_name` séparément, ce qui est incorrect.

**Correction appliquée** :
- Dans `lib/auth/actions.ts` : Stocker le prénom et nom combinés dans `partner_1_name` uniquement, et laisser `partner_2_name` à `null` pour être complété plus tard dans le profil.
- Dans `app/(auth)/auth/callback/route.ts` : Même correction pour la récupération du profil manquant.

**Fichiers modifiés** :
- `lib/auth/actions.ts` (lignes 212-220)
- `app/(auth)/auth/callback/route.ts` (lignes 52-62)

## Incohérences Identifiées ⚠️

### 1. **Incohérence des colonnes de localisation du mariage**
**Problème** : 
- La migration initiale (`004_create_couples_and_preferences_tables.sql`) définit seulement `wedding_location` (TEXT)
- Mais le code dans `app/couple/profil/page.tsx` utilise `wedding_city`, `wedding_region`, et `wedding_country`
- Aucune migration trouvée qui ajoute ces colonnes

**Impact** : Les tentatives de sauvegarde de la ville, région et pays du mariage dans le profil échoueront probablement avec une erreur SQL.

**Recommandation** : 
- Option 1 : Créer une migration pour ajouter ces colonnes à la table `couples`
- Option 2 : Utiliser uniquement `wedding_location` et stocker les informations combinées
- Option 3 : Stocker ces informations dans `couple_preferences` si elles sont considérées comme des préférences

**Fichiers concernés** :
- `app/couple/profil/page.tsx` (lignes 175-179, 423-427, 547-551, 1103-1153)
- `types/couple.ts` (lignes 20-22)
- `supabase/migrations/004_create_couples_and_preferences_tables.sql` (ligne 20)

### 2. **Gestion silencieuse des erreurs lors de la création des préférences**
**Problème** : Dans `lib/auth/actions.ts` (lignes 241-259), la création des préférences couple est dans un try-catch qui ignore les erreurs silencieusement avec seulement un `logger.warn`.

**Impact** : Si la création des préférences échoue, l'utilisateur n'aura pas de préférences mais l'inscription sera considérée comme réussie. Cela peut causer des problèmes plus tard lors de l'utilisation de l'application.

**Recommandation** : 
- Améliorer le logging pour capturer plus de détails sur l'erreur
- Considérer une tentative de récupération automatique lors de la première connexion
- Ou au moins informer l'utilisateur qu'il doit compléter son profil

**Fichiers concernés** :
- `lib/auth/actions.ts` (lignes 241-259)

### 3. **Extraction du prénom/nom dans le dashboard**
**Problème** : Dans `app/couple/dashboard/page.tsx` (lignes 74-78), le code essaie d'extraire le prénom et nom depuis `partner_1_name` en divisant par espaces, ce qui peut ne pas fonctionner correctement si le nom complet contient plusieurs mots.

**Impact** : L'affichage du nom dans le dashboard peut être incorrect.

**Recommandation** : 
- Garder l'affichage du nom complet tel quel
- Ou stocker séparément le prénom et nom lors de l'inscription si nécessaire pour l'affichage

**Fichiers concernés** :
- `app/couple/dashboard/page.tsx` (lignes 74-78)

## Points à Vérifier 🔍

### 1. **Colonne `budget_total`**
- Migration `008_add_budget_total_to_couples.sql` ajoute cette colonne ✅
- Utilisée dans `app/couple/profil/page.tsx` ✅
- Cohérence vérifiée ✅

### 2. **Colonne `other_services_text`**
- Migration `009_add_other_services_text_to_couples.sql` ajoute cette colonne ✅
- Utilisée dans `app/couple/profil/page.tsx` ✅
- Cohérence vérifiée ✅

### 3. **Redirection après inscription**
- Après inscription : redirection vers `/auth/confirm` ✅
- Après confirmation email : callback vers `/auth/callback` qui redirige vers `/couple/dashboard` ✅
- Logique cohérente ✅

## Résumé

**Bugs corrigés** : 1 bug critique corrigé
**Incohérences identifiées** : 3 incohérences majeures nécessitant une attention
**Points à vérifier** : Tous vérifiés et cohérents

## Actions Recommandées

1. **URGENT** : Créer une migration pour ajouter les colonnes `wedding_city`, `wedding_region`, et `wedding_country` à la table `couples`, OU modifier le code pour utiliser uniquement `wedding_location`
2. **IMPORTANT** : Améliorer la gestion des erreurs lors de la création des préférences couple
3. **MOYEN** : Revoir l'extraction du prénom/nom dans le dashboard pour une meilleure robustesse
