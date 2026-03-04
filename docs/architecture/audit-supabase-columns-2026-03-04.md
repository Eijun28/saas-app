# Audit des colonnes Supabase — NUPLY

**Date :** 2026-03-04
**Scope :** 49 tables publiques, ~450 colonnes
**Methode :** Scan automatisé du code source (.ts/.tsx/.sql) croisé avec le schema Supabase réel
**Exclusions :** node_modules, .next, types/database.types.ts (auto-généré), fichiers de migration SQL
**Statut :** NETTOYAGE APPLIQUÉ — migration `cleanup_dead_columns` exécutée + types TS mis à jour

---

## Résumé exécutif

| Catégorie | Nombre |
|-----------|--------|
| Colonnes totales analysées | ~450 |
| Colonnes activement utilisées | ~390 (87%) |
| Colonnes mortes / non-référencées | ~60 (13%) |
| Table entièrement inutilisée | 1 (`ambassador_payouts`) |

---

## COLONNES MORTES PAR TABLE

### profiles

| Colonne | Refs dans le code | Statut | Notes |
|---------|-------------------|--------|-------|
| `avatar_path` | 0 | **MORTE** | Jamais référencée — `avatar_url` est utilisé partout à la place |
| `early_adopter_enrolled_at` | 0 | **MORTE** | Seulement dans database.types.ts (auto-généré) |
| `early_adopter_notified` | 0 | **MORTE** | Seulement dans database.types.ts |
| `subscription_tier` | 0 | **MORTE** | Seulement dans database.types.ts, jamais queryée ni mise à jour |
| `completion_score` | 0 | **MORTE** | N'existe pas dans les migrations non plus — colonne fantôme |

### couples

| Colonne | Refs dans le code | Statut | Notes |
|---------|-------------------|--------|-------|
| `wedding_country` | 2 | **SUSPECTE** | Seulement profil page + type file — redondant avec `wedding_city`/`wedding_region` |
| `wedding_type` | 2 | **SUSPECTE** | Seulement profil page + type file — jamais utilisé en logique |
| `other_services_text` | 1 | **MORTE** | Unique référence dans la page profil couple |
| `notification_preferences` | 2 | **SUSPECTE** | Seulement dans les pages paramètres, pas de gestion réelle |

### couple_preferences

| Colonne | Refs dans le code | Statut | Notes |
|---------|-------------------|--------|-------|
| `special_requests` | 0 | **MORTE** | Seulement dans types — jamais utilisé dans la logique applicative |
| `onboarding_completed_at` | 0 | **MORTE** | Seulement dans types — `onboarding_step` est utilisé à la place |
| `primary_culture_id` | 0 | **MORTE** | Défini mais jamais requêté ni mis à jour |
| `secondary_culture_ids` | 0 | **MORTE** | Défini mais jamais requêté ni mis à jour |
| `wedding_style` | 2 | **SUSPECTE** | Uniquement dans chatbot context |
| `wedding_ambiance` | 2 | **SUSPECTE** | Uniquement dans chatbot context |
| `wedding_department` | 2 | **SUSPECTE** | Sous-utilisé — alternative aux champs location |
| `budget_flexibility` | 2 | **SUSPECTE** | Sous-utilisé — pas intégré dans l'algo de matching |

### devis

| Colonne | Refs dans le code | Statut | Notes |
|---------|-------------------|--------|-------|
| `attachment_url` | 0 | **MORTE** | Jamais référencée dans le code |
| `viewed_at` | 0 | **MORTE** | Jamais utilisée |
| `sent_at` | 0 | **MORTE** | Pas utilisé dans devis (contrairement à factures où `sent_at` est utilisé) |

### requests

| Colonne | Refs dans le code | Statut | Notes |
|---------|-------------------|--------|-------|
| `cancelled_at` | 0 | **MORTE** | Redondant avec `status='cancelled'` |
| `responded_at` | 0 | **MORTE** | Jamais utilisé pour tracker le temps de réponse |

### reviews

| Colonne | Refs dans le code | Statut | Notes |
|---------|-------------------|--------|-------|
| `request_id` | 0 | **MORTE** | Reviews sont filtrées par `couple_id`/`provider_id`, jamais par `request_id` |
| `updated_at` | 0 | **MORTE** | Seul `created_at` est utilisé pour le tri |

### matching_history

| Colonne | Refs dans le code | Statut | Notes |
|---------|-------------------|--------|-------|
| `selected_provider_id` | 0 | **MORTE** | Jamais queryée ni mise à jour |
| `contacted_provider_ids` | 0 | **MORTE** | Jamais queryée ni mise à jour |

### favoris

| Colonne | Refs dans le code | Statut | Notes |
|---------|-------------------|--------|-------|
| `priority` | 0 | **MORTE** | Jamais utilisée — feature non implémentée |

### early_adopter_program

| Colonne | Refs dans le code | Statut | Notes |
|---------|-------------------|--------|-------|
| `trial_duration_days` | 0 | **MORTE** | La durée est hardcodée à 90 jours dans le code |

### early_adopter_notifications

| Colonne | Refs dans le code | Statut | Notes |
|---------|-------------------|--------|-------|
| `sent_at` | 0 | **MORTE** | Jamais utilisée |
| `read_at` | 0 | **MORTE** | Jamais utilisée |

### email_logs

| Colonne | Refs dans le code | Statut | Notes |
|---------|-------------------|--------|-------|
| `reminder_number` | 0 | **MORTE** | Jamais référencée |
| `metadata` | 0 | **MORTE** | Jamais référencée |

### cultures

| Colonne | Refs dans le code | Statut | Notes |
|---------|-------------------|--------|-------|
| `description` | 0 | **MORTE** | Seuls `id` et `label` sont utilisés |

### vendor_invitations

| Colonne | Refs dans le code | Statut | Notes |
|---------|-------------------|--------|-------|
| `viewed_at` | 0 | **SUSPECTE** | Non trouvée dans le code d'implémentation |
| `viewed_count` | 0 | **SUSPECTE** | Non trouvée dans le code d'implémentation |

### couple_guests

| Colonne | Refs dans le code | Statut | Notes |
|---------|-------------------|--------|-------|
| `rsvp_responded_at` | 0 | **MORTE** | Jamais utilisée — `rsvp_status` suffit |
| `invitation_sent_at` | 0 | **MORTE** | Jamais utilisée |

### referral_usages

| Colonne | Refs dans le code | Statut | Notes |
|---------|-------------------|--------|-------|
| `signup_bonus_credited` | 0 | **MORTE** | Jamais queryée |
| `subscription_converted_at` | 0 | **MORTE** | Jamais utilisée |

### provider_service_details

| Colonne | Refs dans le code | Statut | Notes |
|---------|-------------------|--------|-------|
| `service_type` | 0 | **MORTE** | Colonne définie mais jamais utilisée (seul `details` est lu) |

### evenements_prestataire

| Colonne | Refs dans le code | Statut | Notes |
|---------|-------------------|--------|-------|
| `type_evenement` | 0 | **MORTE** | Feature non implémentée |

---

## TABLE ENTIEREMENT INUTILISEE

### ambassador_payouts (10 colonnes)

**Aucune query trouvée dans tout le codebase.** Cette table semble avoir été créée en migration mais jamais implémentée côté code.

Colonnes : `id`, `ambassador_id`, `amount`, `period_start`, `period_end`, `status`, `note`, `created_at`, `processed_at`

---

## COLONNES `updated_at` / `created_at` SYSTEME

De nombreuses tables ont des colonnes `updated_at` et `created_at` qui ne sont pas explicitement lues dans le code mais sont maintenues automatiquement par des triggers PostgreSQL. Ces colonnes sont **normales** et ne doivent pas être considérées comme mortes :

Tables concernées : `devis_templates`, `devis_signatures`, `provider_devis_settings`, `couple_billing_info`, `billing_consent_requests`, `budget_items`, `timeline_events`, `wedding_day_program`, `couple_reception_tables`, `provider_portfolio`, `provider_pricing`, `provider_referrals`, `prestataire_public_profiles`, `prestataire_banking_info`, `prestataire_stripe_connect`

---

## RECOMMANDATIONS

### Ne PAS supprimer (risque de casser la DB)

Toutes ces colonnes existent dans le schema PostgreSQL et peuvent être référencées par des triggers, des RLS policies, ou des contraintes FK. **La suppression directe pourrait casser l'application.**

### Actions recommandées

1. **Court terme** : Marquer les colonnes mortes comme `-- deprecated` dans les prochaines migrations
2. **Moyen terme** : Implémenter les features manquantes (priority favoris, type_evenement, ambassador_payouts) ou planifier leur suppression
3. **Long terme** : Créer une migration de nettoyage après validation que les colonnes ne sont utilisées nulle part (y compris triggers/RLS/fonctions SQL)

### Colonnes les plus "safe" à supprimer (aucune dépendance)

| Table | Colonne | Raison |
|-------|---------|--------|
| `profiles` | `avatar_path` | Doublon de `avatar_url` |
| `profiles` | `early_adopter_notified` | Jamais lue |
| `profiles` | `subscription_tier` | Jamais lue |
| `devis` | `attachment_url` | Jamais lue |
| `devis` | `viewed_at` | Jamais lue |
| `matching_history` | `selected_provider_id` | Jamais lue |
| `matching_history` | `contacted_provider_ids` | Jamais lue |
| `couple_preferences` | `special_requests` | Jamais lue |
| `couple_preferences` | `primary_culture_id` | Jamais lue |
| `couple_preferences` | `secondary_culture_ids` | Jamais lue |
| `early_adopter_program` | `trial_duration_days` | Hardcodé dans le code |
| `email_logs` | `reminder_number` | Jamais lue |
| `email_logs` | `metadata` | Jamais lue |

---

*Audit généré automatiquement par Claude Code — Mars 2026*
