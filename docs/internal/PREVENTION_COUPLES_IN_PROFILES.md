# Prévention : Couples dans la table profiles

## Problème identifié

Un couple a été incorrectement enregistré dans la table `profiles`, qui est réservée aux prestataires uniquement. Les couples doivent être dans la table `couples`.

## Cause racine

Le trigger `handle_new_user()` créait automatiquement un profil dans `profiles` pour **tous** les utilisateurs, y compris les couples, lors de leur inscription.

## Solutions mises en place

### 1. Migration SQL (020_fix_profiles_trigger_prevent_couples.sql)

Cette migration :
- ✅ Supprime les couples existants dans `profiles`
- ✅ Modifie le trigger `handle_new_user()` pour ne créer des profils QUE pour les prestataires
- ✅ Ajoute une contrainte CHECK pour empêcher `role='couple'` dans `profiles`

**À exécuter dans Supabase SQL Editor :**
```sql
-- Voir le fichier: supabase/migrations/020_fix_profiles_trigger_prevent_couples.sql
```

### 2. Protection dans le code d'inscription

Le code dans `lib/auth/actions.ts` a été amélioré pour :
- ✅ Supprimer automatiquement tout profil créé par erreur dans `profiles` lors de l'inscription d'un couple
- ✅ Créer directement dans la table `couples` (pas dans `profiles`)

### 3. Contrainte de base de données

Une contrainte CHECK empêche désormais l'insertion de `role='couple'` dans `profiles` :
```sql
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IS NULL OR role = 'prestataire');
```

## Structure attendue

### Couples
- ✅ Table : `couples`
- ✅ Pas d'enregistrement dans `profiles`
- ✅ Création via `lib/auth/actions.ts` → fonction `signUp()` avec `role === 'couple'`

### Prestataires
- ✅ Table : `profiles` avec `role = 'prestataire'`
- ✅ Création automatique via trigger `handle_new_user()` uniquement si `role = 'prestataire'`
- ✅ Création via `lib/auth/actions.ts` → fonction `signUp()` avec `role === 'prestataire'`

## Scripts de diagnostic et correction

### Diagnostic
```sql
-- scripts/diagnostic-couple-in-profiles.sql
-- Identifie les couples mal enregistrés dans profiles
```

### Correction
```sql
-- scripts/fix-couple-in-profiles.sql
-- Supprime les couples de la table profiles
```

## Vérification

Pour vérifier qu'il n'y a plus de couples dans `profiles` :

```sql
SELECT COUNT(*) as couples_dans_profiles
FROM profiles p
INNER JOIN couples c ON p.id = c.user_id;
-- Doit retourner 0
```

## Notes importantes

1. **Le trigger modifié** ne crée plus de profils pour les couples
2. **La contrainte CHECK** empêche l'insertion manuelle de couples dans `profiles`
3. **Le code d'inscription** nettoie automatiquement les profils créés par erreur
4. **Les couples existants** dans `profiles` doivent être supprimés manuellement si nécessaire

## Maintenance

Si le problème se reproduit :
1. Exécuter le script de diagnostic
2. Vérifier les logs d'inscription
3. Exécuter le script de correction si nécessaire
4. Vérifier que la migration 020 a bien été appliquée
