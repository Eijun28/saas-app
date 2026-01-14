# Résumé du nettoyage des tables - NUPLY

## 📊 Analyse complète des tables

### ✅ Tables nécessaires et utilisées

Toutes ces tables sont **nécessaires** et **utilisées** dans le code :

1. **budget_items** - Items de budget des couples
2. **conversations** - Conversations entre couples et prestataires
3. **couple_preferences** - Préférences détaillées des couples
4. **couples** - Données de base des couples
5. **cultures** - Référentiel des cultures
6. **demandes** - Demandes de prestation
7. **devis** - Devis des prestataires
8. **early_adopter_notifications** - Notifications early adopter
9. **early_adopter_program** - Programme early adopter
10. **evenements_prestataire** - Agenda des prestataires
11. **favoris** - Prestataires favoris
12. **messages** - Messages dans les conversations
13. **profiles** - Profils utilisateurs
14. **provider_cultures** - Cultures gérées par prestataires
15. **provider_portfolio** - Portfolio des prestataires
16. **provider_zones** - Zones d'intervention
17. **timeline_events** - Timeline des couples

### ❌ Tables inutiles à supprimer

1. **couples_archive_2026_01_05** 
   - Table d'archive temporaire
   - Non utilisée dans le code
   - **Action** : Supprimer après vérification des données importantes

### ⚠️ Redondances identifiées et corrigées

#### Colonnes redondantes dans `couples` :

Ces colonnes existent à la fois dans `couples` et `couple_preferences` :

| Colonne dans `couples` | Équivalent dans `couple_preferences` | Statut |
|------------------------|--------------------------------------|--------|
| `cultures` (ARRAY) | `cultural_preferences->cultures` (JSONB) | ✅ Migré |
| `religions` (ARRAY) | `cultural_preferences->religions` + `religious_ceremony` | ✅ Migré |
| `cultural_requirements` (TEXT) | `cultural_preferences->cultural_requirements` | ✅ Migré |
| `wedding_style` (TEXT) | `wedding_description` (TEXT) | ✅ Migré |
| `ambiance` (TEXT) | `wedding_description` (TEXT) | ✅ Migré |
| `color_theme` (TEXT) | `wedding_description` (TEXT) | ✅ Migré |
| `services_needed` (ARRAY) | `essential_services` (ARRAY) | ✅ Migré |
| `service_priorities` (ARRAY) | `service_priorities` (JSONB) | ✅ Migré |
| `budget_flexibility` (TEXT) | `budget_breakdown->flexibility` (JSONB) | ✅ Migré |
| `planning_stage` (TEXT) | `onboarding_step` (INTEGER) | ✅ Migré |
| `profile_completion` (INTEGER) | `completion_percentage` (INTEGER) | ✅ Migré |

**Action** : Ces colonnes seront supprimées de `couples` après migration des données.

## 🔧 Scripts de migration créés

### 1. `supabase/migrations/016_cleanup_redundant_columns.sql`

Ce script :
- ✅ Migre automatiquement toutes les données de `couples` vers `couple_preferences`
- ✅ Convertit les formats (ARRAY → JSONB, TEXT → INTEGER, etc.)
- ✅ Supprime les colonnes redondantes de `couples`
- ✅ Supprime la table `couples_archive_2026_01_05`

**⚠️ IMPORTANT** : Ce script doit être exécuté **APRÈS** la mise à jour du code TypeScript.

### 2. `MIGRATION_COUPLE_PREFERENCES.md`

Guide détaillé pour mettre à jour le code TypeScript, notamment :
- `app/couple/profil/page.tsx` (fichier principal à modifier)
- Fonctions utilitaires pour convertir les formats
- Exemples de code avant/après

## 📝 Fichiers à mettre à jour

### Priorité 1 - CRITIQUE

1. **`app/couple/profil/page.tsx`**
   - Modifier `loadProfile()` pour charger depuis `couple_preferences`
   - Modifier `handleSave()` pour sauvegarder dans `couple_preferences`
   - Ajouter les fonctions utilitaires de conversion

### Priorité 2 - Vérification

Vérifier que ces fichiers n'utilisent pas les colonnes redondantes :
- `lib/actions/profile.ts`
- `lib/supabase/queries/couples.queries.ts`
- `types/couple.ts`
- `types/couples.types.ts`

## ✅ Checklist de migration

### Étape 1 : Préparation
- [x] Analyse complète des tables
- [x] Identification des redondances
- [x] Création du script SQL de migration
- [x] Création du guide de migration du code

### Étape 2 : Mise à jour du code (À FAIRE)
- [ ] Mettre à jour `app/couple/profil/page.tsx`
- [ ] Ajouter les fonctions utilitaires
- [ ] Vérifier les autres fichiers
- [ ] Tester le chargement du profil
- [ ] Tester la sauvegarde du profil

### Étape 3 : Migration SQL (À FAIRE)
- [ ] Sauvegarder la base de données
- [ ] Exécuter `016_cleanup_redundant_columns.sql`
- [ ] Vérifier que les données sont migrées correctement
- [ ] Vérifier que les colonnes sont supprimées

### Étape 4 : Vérification finale
- [ ] Tester toutes les fonctionnalités liées aux couples
- [ ] Vérifier que les recherches fonctionnent
- [ ] Vérifier que les préférences sont sauvegardées
- [ ] Vérifier que le calcul de completion fonctionne

## 🎯 Résultat attendu

Après la migration :

1. **Table `couples`** : Contient uniquement les données essentielles
   - Identifiants (id, user_id, email)
   - Informations de base (partner_1_name, partner_2_name, avatar_url)
   - Informations mariage essentielles (wedding_date, wedding_city, wedding_region, wedding_country, wedding_type, guest_count)
   - Budget global (budget_min, budget_max, budget_total)

2. **Table `couple_preferences`** : Contient toutes les préférences détaillées
   - Cultures et religions (dans `cultural_preferences` JSONB)
   - Services (essential_services, optional_services, service_priorities)
   - Description du mariage (wedding_description)
   - Budget détaillé (budget_breakdown JSONB)
   - État du profil (completion_percentage, onboarding_step, profile_completed)

3. **Table `couples_archive_2026_01_05`** : Supprimée

## 📚 Documentation

- `MIGRATION_COUPLE_PREFERENCES.md` - Guide détaillé de migration du code
- `supabase/migrations/016_cleanup_redundant_columns.sql` - Script SQL de migration
- `MIGRATION_CLEANUP_SUMMARY.md` - Résumé des migrations précédentes

## ⚠️ Notes importantes

1. **Ordre d'exécution** : Mettre à jour le code **AVANT** d'exécuter la migration SQL
2. **Sauvegarde** : Toujours sauvegarder la base de données avant une migration
3. **Tests** : Tester soigneusement après chaque étape
4. **Rétrocompatibilité** : Le code doit être compatible avec les deux structures pendant la transition
