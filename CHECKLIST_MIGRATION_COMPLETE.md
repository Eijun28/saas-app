# ✅ Checklist Complète de Migration

## 📋 Préparation

### Code TypeScript
- [x] `app/couple/profil/page.tsx` mis à jour pour utiliser `couple_preferences`
- [x] Fonctions utilitaires de conversion ajoutées
- [x] `loadProfile()` charge depuis `couple_preferences`
- [x] `handleSave()` sauvegarde dans `couple_preferences`
- [x] `calculateCompletion()` utilise les bonnes données
- [x] Aucune erreur de lint

### Documentation
- [x] Guide de migration SQL créé (`GUIDE_MIGRATION_SQL.md`)
- [x] Guide de migration du code créé (`MIGRATION_COUPLE_PREFERENCES.md`)
- [x] Résumé de l'analyse créé (`CLEANUP_TABLES_SUMMARY.md`)
- [x] Checklist de migration créée

### Script SQL
- [x] Script de migration créé (`016_cleanup_redundant_columns.sql`)
- [x] Script migre les données automatiquement
- [x] Script supprime les colonnes redondantes
- [x] Script supprime la table d'archive

## 🚀 Migration SQL (À FAIRE)

### Avant la migration
- [ ] Sauvegarde complète de la base de données créée
- [ ] Vérification que le code TypeScript est déployé
- [ ] Vérification de l'état actuel de la base de données
- [ ] Comptage des données à migrer

### Exécution
- [ ] Script SQL copié dans Supabase SQL Editor
- [ ] Script exécuté avec succès
- [ ] Messages `RAISE NOTICE` vérifiés

### Vérification post-migration
- [ ] Colonnes redondantes supprimées de `couples`
- [ ] Données migrées vers `couple_preferences`
- [ ] Table `couples_archive_2026_01_05` supprimée
- [ ] Vérification des données migrées

## 🧪 Tests fonctionnels

### Tests de chargement
- [ ] Profil couple se charge correctement
- [ ] Toutes les données sont affichées (cultures, religions, services)
- [ ] Aucune erreur dans la console du navigateur
- [ ] Aucune erreur dans les logs Supabase

### Tests de sauvegarde
- [ ] Modification du profil fonctionne
- [ ] Sauvegarde réussit sans erreur
- [ ] Données persistées après rechargement
- [ ] Calcul de completion fonctionne

### Tests de conversion
- [ ] Cultures chargées depuis `cultural_preferences`
- [ ] Religions chargées depuis `cultural_preferences`
- [ ] Services chargés depuis `essential_services`
- [ ] Style/ambiance/couleurs extraits de `wedding_description`
- [ ] Planning stage converti depuis `onboarding_step`

## 📊 Vérification finale

### Base de données
- [ ] Structure de `couples` nettoyée
- [ ] Structure de `couple_preferences` correcte
- [ ] Toutes les données préservées
- [ ] Aucune donnée perdue

### Code
- [ ] Tous les fichiers utilisent `couple_preferences`
- [ ] Aucune référence aux colonnes supprimées
- [ ] Types TypeScript à jour
- [ ] Pas d'erreurs de compilation

### Documentation
- [ ] Guide de migration SQL consulté
- [ ] Guide de migration du code consulté
- [ ] Checklist complétée

## 🎯 Résultat attendu

Après la migration complète :

1. ✅ **Table `couples`** : Contient uniquement les données essentielles
   - Identifiants (id, user_id, email)
   - Informations de base (partner_1_name, partner_2_name, avatar_url)
   - Informations mariage essentielles (wedding_date, wedding_city, wedding_region, wedding_country, wedding_type, guest_count)
   - Budget global (budget_min, budget_max, budget_total)

2. ✅ **Table `couple_preferences`** : Contient toutes les préférences détaillées
   - Cultures et religions (dans `cultural_preferences` JSONB)
   - Services (essential_services, optional_services, service_priorities)
   - Description du mariage (wedding_description)
   - Budget détaillé (budget_breakdown JSONB)
   - État du profil (completion_percentage, onboarding_step, profile_completed)

3. ✅ **Table `couples_archive_2026_01_05`** : Supprimée

## ⚠️ Notes importantes

1. **Ordre d'exécution** : Le code doit être mis à jour AVANT la migration SQL
2. **Sauvegarde** : Toujours sauvegarder avant une migration
3. **Tests** : Tester soigneusement après chaque étape
4. **Rollback** : Avoir un plan de rollback en cas de problème

## 📞 Support

En cas de problème :
1. Consultez `GUIDE_MIGRATION_SQL.md` pour la résolution de problèmes
2. Vérifiez les logs Supabase
3. Vérifiez la console du navigateur
4. Restaurez depuis la sauvegarde si nécessaire
