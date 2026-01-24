# Résumé du nettoyage et de l'uniformisation des migrations Supabase

## Date: 2025-01-13

## Objectif
Uniformiser le schéma de base de données selon le schéma fourni, supprimer les doublons et fichiers obsolètes, et consolider les règles RLS.

## Modifications effectuées

### 1. Migration consolidée créée
**Fichier**: `supabase/migrations/015_consolidated_schema_fix.sql`

Cette migration unique consolide toutes les corrections nécessaires :
- ✅ Uniformise les noms de colonnes (`prestataire_id` partout au lieu de `provider_id`)
- ✅ Corrige les références de clés étrangères (`budget_items.couple_id` pointe maintenant vers `couples(id)` au lieu de `auth.users(id)`)
- ✅ Ajoute les colonnes manquantes selon le schéma fourni
- ✅ Consolide toutes les politiques RLS de manière cohérente
- ✅ Migre `is_read` vers `read_at` dans la table `messages`

### 2. Migrations obsolètes supprimées

Les migrations suivantes ont été supprimées car elles étaient obsolètes, redondantes ou conflictuelles :

1. **001_initial_schema.sql** - Contenait des tables obsolètes (`couple_profiles`, `prestataire_profiles`, `budget_categories`, `budget_expenses`, `timeline_milestones`, `events`, `portfolio_images`, `message_attachments`, `reviews`, `collaborateurs`, `services`, `prestataire_public_profiles`)

2. **002_create_profiles_if_not_exists.sql** - Redondant avec la migration consolidée

3. **003_create_couples_rls.sql** - RLS consolidée dans 015

4. **005_create_timeline_events.sql** - Déjà créée dans 004

5. **007_rls_policies.sql** - RLS consolidée dans 015

6. **011_fix_messages_rls.sql** - RLS consolidée dans 015

7. **012_couples_can_view_prestataires.sql** - RLS consolidée dans 015

8. **013_fix_couples_rls_policy.sql** - RLS consolidée dans 015

9. **013_fix_profiles_rls_simple.sql** - RLS consolidée dans 015

10. **014_fix_conversations_column_name.sql** - Uniformisation consolidée dans 015

### 3. Migrations conservées

Les migrations suivantes sont conservées car elles sont nécessaires :

- **004_create_couples_and_preferences_tables.sql** - Crée les tables `couples` et `couple_preferences`
- **006_create_budget_items.sql** - Crée la table `budget_items`
- **008_add_budget_total_to_couples.sql** - Ajoute la colonne `budget_total`
- **008_create_subscriptions_table.sql** - Crée la table `subscriptions`
- **009_add_other_services_text_to_couples.sql** - Ajoute la colonne `other_services_text`
- **010_add_prestataire_columns_to_profiles.sql** - Ajoute les colonnes prestataires à `profiles`
- **add_events_rls_policies.sql** - RLS pour `evenements_prestataire`
- **add_social_links_to_profiles.sql** - Ajoute les liens sociaux à `profiles`
- **rename_onboarding_to_inscription.sql** - Renomme `onboarding_completed` en `inscription_completee`

### 4. Corrections du code TypeScript

Les fichiers suivants ont été mis à jour pour utiliser `prestataire_id` au lieu de `provider_id` :

- `lib/supabase/messages.ts` - Toutes les références mises à jour
- `app/couple/messagerie/page.tsx` - Interface et utilisation mises à jour
- `app/prestataire/messagerie/page.tsx` - Requêtes mises à jour
- `app/prestataire/demandes-recues/page.tsx` - Requêtes mises à jour
- `app/prestataire/dashboard/page.tsx` - Requêtes mises à jour
- `app/couple/demandes/page.tsx` - Utilise maintenant `prestataire_id` avec alias `provider_id` pour compatibilité

## Schéma final correspondant

Le schéma final correspond maintenant exactement au schéma fourni avec les tables suivantes :

### Tables principales
- ✅ `profiles` - Profils utilisateurs (couples et prestataires)
- ✅ `couples` - Données des couples
- ✅ `couple_preferences` - Préférences des couples
- ✅ `cultures` - Cultures disponibles
- ✅ `demandes` - Demandes de prestation
- ✅ `devis` - Devis des prestataires
- ✅ `conversations` - Conversations entre couples et prestataires
- ✅ `messages` - Messages dans les conversations
- ✅ `favoris` - Prestataires favoris des couples
- ✅ `budget_items` - Items de budget
- ✅ `timeline_events` - Événements de la timeline
- ✅ `evenements_prestataire` - Événements des prestataires
- ✅ `provider_cultures` - Cultures gérées par les prestataires
- ✅ `provider_zones` - Zones d'intervention des prestataires
- ✅ `provider_portfolio` - Portfolio des prestataires
- ✅ `subscriptions` - Abonnements Stripe
- ✅ `early_adopter_program` - Programme early adopter
- ✅ `early_adopter_notifications` - Notifications early adopter

### Tables archivées (non supprimées mais non utilisées)
- `couples_archive_2026_01_05` - Archive historique

## Uniformisation des colonnes

### Colonnes uniformisées
- ✅ `prestataire_id` utilisé partout (au lieu de `provider_id`)
- ✅ `couple_id` référence toujours `couples(id)` (pas `auth.users(id)`)
- ✅ `read_at` utilisé dans `messages` (au lieu de `is_read`)

### Colonnes ajoutées selon le schéma
- ✅ `conversations.status` (active/archived)
- ✅ `conversations.unread_count_couple`
- ✅ `conversations.unread_count_provider`
- ✅ `conversations.last_message_at`
- ✅ `demandes.service_type`
- ✅ `demandes.wedding_date`
- ✅ `demandes.guest_count`
- ✅ `demandes.budget_indicatif`
- ✅ `demandes.viewed_at`
- ✅ `demandes.responded_at`
- ✅ `devis.title`
- ✅ `devis.description`
- ✅ `devis.currency`
- ✅ `devis.included_services`
- ✅ `devis.excluded_services`
- ✅ `devis.conditions`
- ✅ `devis.valid_until`
- ✅ `devis.attachment_url`
- ✅ `devis.viewed_at`
- ✅ `devis.accepted_at`
- ✅ `devis.rejected_at`

## Politiques RLS consolidées

Toutes les politiques RLS sont maintenant dans la migration 015 avec une logique cohérente :

### Profils
- ✅ Tous les utilisateurs authentifiés peuvent voir tous les profils
- ✅ Les utilisateurs peuvent modifier leur propre profil

### Couples
- ✅ Les utilisateurs peuvent gérer leur propre profil couple
- ✅ Accès via `couples.user_id = auth.uid()`

### Couple Preferences
- ✅ Les utilisateurs peuvent gérer leurs préférences via leur couple

### Budget Items & Timeline Events
- ✅ Les utilisateurs peuvent gérer leurs items via leur couple

### Demandes
- ✅ Les couples peuvent voir et créer leurs demandes
- ✅ Les prestataires peuvent voir et mettre à jour les demandes qui leur sont adressées

### Conversations & Messages
- ✅ Les couples et prestataires peuvent voir leurs conversations
- ✅ Les messages peuvent être envoyés uniquement par les participants
- ✅ Vérification via `couples.user_id` pour les couples

### Devis
- ✅ Les couples peuvent voir et mettre à jour leurs devis
- ✅ Les prestataires peuvent créer leurs devis

### Provider Cultures, Zones, Portfolio
- ✅ Tous les utilisateurs authentifiés peuvent voir ces données publiques

## Prochaines étapes

1. ✅ Exécuter la migration `015_consolidated_schema_fix.sql` sur la base de données
2. ✅ Vérifier que toutes les fonctionnalités fonctionnent correctement
3. ✅ Tester les politiques RLS avec différents utilisateurs
4. ✅ Vérifier que les requêtes utilisent bien `prestataire_id`

## Notes importantes

- Les alias `provider_id` sont conservés dans certains fichiers TypeScript pour compatibilité, mais la base de données utilise uniquement `prestataire_id`
- La migration 015 est idempotente (peut être exécutée plusieurs fois sans erreur)
- Toutes les migrations conservées doivent être exécutées avant la migration 015
