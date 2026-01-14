# 🚀 Guide Complet de Migration SQL - Nettoyage des Tables

## 📋 Vue d'ensemble

Ce guide vous accompagne étape par étape pour exécuter la migration SQL qui :
1. ✅ Migre les données redondantes de `couples` vers `couple_preferences`
2. ✅ Supprime les colonnes redondantes de `couples`
3. ✅ Supprime la table d'archive `couples_archive_2026_01_05`

## ⚠️ IMPORTANT - Avant de commencer

### ✅ Prérequis

1. **Le code TypeScript doit être mis à jour AVANT la migration SQL**
   - ✅ `app/couple/profil/page.tsx` a été mis à jour pour utiliser `couple_preferences`
   - ✅ Les fonctions utilitaires de conversion ont été ajoutées
   - ✅ Le chargement et la sauvegarde utilisent maintenant `couple_preferences`

2. **Sauvegarde de la base de données**
   - ⚠️ **OBLIGATOIRE** : Faire une sauvegarde complète de votre base Supabase avant la migration
   - Utilisez l'outil de sauvegarde de Supabase ou exportez les données importantes

3. **Environnement**
   - Migration testée sur Supabase
   - Compatible avec PostgreSQL 14+

## 📝 Étape 1 : Vérification pré-migration

### 1.1 Vérifier que le code est à jour

Vérifiez que `app/couple/profil/page.tsx` utilise bien `couple_preferences` :

```bash
# Rechercher les références aux colonnes redondantes
grep -r "data.cultures\|data.religions\|data.wedding_style" app/couple/profil/page.tsx
```

Si vous voyez encore ces références, le code n'est pas à jour. **Ne continuez pas la migration.**

### 1.2 Vérifier l'état actuel de la base de données

Connectez-vous à votre Supabase Dashboard et exécutez cette requête pour vérifier les colonnes existantes :

```sql
-- Vérifier les colonnes de la table couples
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'couples' 
AND column_name IN (
  'cultures', 'religions', 'cultural_requirements', 
  'wedding_style', 'ambiance', 'color_theme',
  'services_needed', 'service_priorities',
  'budget_flexibility', 'planning_stage', 'profile_completion'
)
ORDER BY column_name;
```

Si cette requête retourne des résultats, les colonnes existent et doivent être migrées.

### 1.3 Vérifier les données existantes

```sql
-- Compter les couples avec des données à migrer
SELECT 
  COUNT(*) as total_couples,
  COUNT(cultures) as avec_cultures,
  COUNT(religions) as avec_religions,
  COUNT(wedding_style) as avec_wedding_style,
  COUNT(services_needed) as avec_services_needed
FROM couples;
```

Notez ces nombres pour vérifier après la migration.

## 📝 Étape 2 : Sauvegarde de la base de données

### Option 1 : Sauvegarde via Supabase Dashboard

1. Allez dans **Settings** → **Database**
2. Cliquez sur **Backups**
3. Créez une nouvelle sauvegarde manuelle

### Option 2 : Export SQL

Dans le SQL Editor de Supabase, exécutez :

```sql
-- Exporter les données importantes (optionnel mais recommandé)
COPY (
  SELECT * FROM couples 
  WHERE cultures IS NOT NULL 
     OR religions IS NOT NULL 
     OR wedding_style IS NOT NULL
) TO STDOUT WITH CSV HEADER;
```

## 📝 Étape 3 : Exécution de la migration

### 3.1 Ouvrir le SQL Editor

1. Connectez-vous à votre **Supabase Dashboard**
2. Allez dans **SQL Editor**
3. Cliquez sur **New query**

### 3.2 Copier le script de migration

Ouvrez le fichier `supabase/migrations/016_cleanup_redundant_columns.sql` et copiez tout son contenu.

### 3.3 Exécuter la migration

1. Collez le script dans le SQL Editor
2. **Lisez attentivement** le script pour comprendre ce qu'il fait
3. Cliquez sur **Run** ou appuyez sur `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### 3.4 Vérifier l'exécution

Le script affichera des messages `RAISE NOTICE` pour chaque étape. Vous devriez voir :

```
NOTICE: Colonne cultures supprimée
NOTICE: Colonne religions supprimée
NOTICE: Colonne cultural_requirements supprimée
...
NOTICE: Migration 016 terminée avec succès
```

## 📝 Étape 4 : Vérification post-migration

### 4.1 Vérifier que les colonnes sont supprimées

```sql
-- Vérifier que les colonnes redondantes n'existent plus
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'couples' 
AND column_name IN (
  'cultures', 'religions', 'cultural_requirements', 
  'wedding_style', 'ambiance', 'color_theme',
  'services_needed', 'service_priorities',
  'budget_flexibility', 'planning_stage', 'profile_completion'
);
```

Cette requête ne doit retourner **aucun résultat**.

### 4.2 Vérifier que les données sont migrées

```sql
-- Vérifier que les données sont dans couple_preferences
SELECT 
  cp.id,
  cp.couple_id,
  cp.cultural_preferences->>'cultures' as cultures,
  cp.cultural_preferences->>'religions' as religions,
  cp.essential_services,
  cp.completion_percentage,
  c.partner_1_name
FROM couple_preferences cp
JOIN couples c ON c.id = cp.couple_id
LIMIT 10;
```

Vous devriez voir les données migrées.

### 4.3 Vérifier que la table d'archive est supprimée

```sql
-- Vérifier que la table d'archive n'existe plus
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'couples_archive_2026_01_05';
```

Cette requête ne doit retourner **aucun résultat**.

### 4.4 Compter les couples avec préférences

```sql
-- Vérifier que tous les couples ont des préférences (ou presque)
SELECT 
  COUNT(DISTINCT c.id) as total_couples,
  COUNT(DISTINCT cp.couple_id) as couples_avec_preferences,
  COUNT(DISTINCT c.id) - COUNT(DISTINCT cp.couple_id) as couples_sans_preferences
FROM couples c
LEFT JOIN couple_preferences cp ON cp.couple_id = c.id;
```

## 📝 Étape 5 : Tests fonctionnels

### 5.1 Tester le chargement du profil

1. Connectez-vous en tant que couple
2. Allez sur la page `/couple/profil`
3. Vérifiez que le profil se charge correctement
4. Vérifiez que toutes les données sont affichées (cultures, religions, services, etc.)

### 5.2 Tester la sauvegarde du profil

1. Modifiez quelques champs du profil
2. Cliquez sur **Sauvegarder**
3. Vérifiez que la sauvegarde fonctionne sans erreur
4. Rechargez la page et vérifiez que les modifications sont persistées

### 5.3 Vérifier le calcul de completion

1. Vérifiez que le pourcentage de completion s'affiche correctement
2. Modifiez des champs et vérifiez que le pourcentage se met à jour

## 🔧 Résolution de problèmes

### Problème 1 : Erreur "column does not exist"

**Symptôme** : Le script échoue avec une erreur indiquant qu'une colonne n'existe pas.

**Solution** : C'est normal si certaines colonnes n'existent pas encore. Le script utilise `IF EXISTS` pour gérer cela. Vérifiez les messages `RAISE NOTICE` pour voir quelles colonnes ont été trouvées.

### Problème 2 : Erreur lors de la migration des données

**Symptôme** : Erreur lors de l'insertion/mise à jour dans `couple_preferences`.

**Solution** :
1. Vérifiez que la table `couple_preferences` existe
2. Vérifiez que les contraintes RLS permettent l'insertion
3. Vérifiez les logs détaillés dans Supabase

### Problème 3 : Données manquantes après migration

**Symptôme** : Certaines données ne sont pas visibles après la migration.

**Solution** :
1. Vérifiez que les données sont bien dans `couple_preferences`
2. Vérifiez que le code charge bien depuis `couple_preferences`
3. Vérifiez les fonctions de conversion dans `app/couple/profil/page.tsx`

### Problème 4 : Erreur de type JSONB

**Symptôme** : Erreur lors de la conversion en JSONB.

**Solution** : Le script gère automatiquement les conversions. Si vous avez des erreurs, vérifiez que les données source sont valides.

## 📊 Vérification finale

### Checklist de vérification

- [ ] Les colonnes redondantes sont supprimées de `couples`
- [ ] Les données sont migrées vers `couple_preferences`
- [ ] La table `couples_archive_2026_01_05` est supprimée
- [ ] Le profil se charge correctement
- [ ] La sauvegarde fonctionne
- [ ] Le calcul de completion fonctionne
- [ ] Aucune erreur dans la console du navigateur
- [ ] Aucune erreur dans les logs Supabase

## 🔄 Rollback (en cas de problème)

Si vous devez annuler la migration :

### Option 1 : Restaurer depuis la sauvegarde

1. Allez dans **Settings** → **Database** → **Backups**
2. Restaurez la sauvegarde créée avant la migration

### Option 2 : Recréer les colonnes (si nécessaire)

```sql
-- Recréer les colonnes supprimées (si nécessaire pour rollback)
ALTER TABLE couples ADD COLUMN IF NOT EXISTS cultures TEXT[];
ALTER TABLE couples ADD COLUMN IF NOT EXISTS religions TEXT[];
ALTER TABLE couples ADD COLUMN IF NOT EXISTS cultural_requirements TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS wedding_style TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS ambiance TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS color_theme TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS services_needed TEXT[];
ALTER TABLE couples ADD COLUMN IF NOT EXISTS service_priorities TEXT[];
ALTER TABLE couples ADD COLUMN IF NOT EXISTS budget_flexibility TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS planning_stage TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS profile_completion INTEGER;
```

**Note** : Cette option ne restaure pas les données, seulement la structure. Utilisez la restauration depuis la sauvegarde pour restaurer les données.

## 📚 Ressources supplémentaires

- `MIGRATION_COUPLE_PREFERENCES.md` - Guide de migration du code TypeScript
- `CLEANUP_TABLES_SUMMARY.md` - Résumé de l'analyse des tables
- `supabase/migrations/016_cleanup_redundant_columns.sql` - Script SQL de migration

## ✅ Conclusion

Une fois toutes les étapes terminées et vérifiées, votre base de données sera nettoyée et normalisée. Les données redondantes seront dans `couple_preferences` et la structure sera plus maintenable.

**N'hésitez pas à tester soigneusement avant de déployer en production !**
