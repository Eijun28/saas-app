# Corrections de Sécurité Supabase

## Date: 2026-01-06

Ce document détaille les corrections de sécurité appliquées pour résoudre les problèmes détectés par le linter Supabase.

## ❌ Problèmes Détectés (ERREURS)

### 1. Vues SECURITY DEFINER ⚠️

**Problème:** 3 vues utilisaient `SECURITY DEFINER`, ce qui exécute les requêtes avec les permissions du créateur plutôt que de l'utilisateur.

**Vues concernées:**
- `public.devis_with_details`
- `public.demandes_with_provider`
- `public.favoris_with_provider`

**Solution:**
- Suppression et recréation des vues **sans** `SECURITY DEFINER`
- Les vues utilisent maintenant les permissions de l'utilisateur qui les interroge
- Les policies RLS existantes s'appliquent normalement

### 2. RLS Désactivé sur Tables Publiques 🔒

**Problème:** 3 tables n'avaient pas RLS (Row Level Security) activé.

**Tables concernées:**
- `public.couples_archive_2026_01_05` - Table d'archive
- `public.cultures` - Table de référence
- `public.couple_preferences` - Réactivation par sécurité

**Solution:**
- **couples_archive_2026_01_05**: RLS activé avec accès admin uniquement (service_role)
- **cultures**: RLS activé avec lecture publique, écriture admin uniquement
- **couple_preferences**: RLS re-vérifié et activé

## ⚠️ Problèmes Détectés (WARNINGS)

### 3. Search Path Mutable sur Fonctions 🔧

**Problème:** 27 fonctions n'avaient pas de `search_path` fixe, risque de "function search path hijacking".

**Solution:** Toutes les fonctions ont été recréées avec `SET search_path = public, pg_temp`

**Fonctions corrigées:**
- Triggers de mise à jour (`update_updated_at_column`, etc.)
- Fonctions de messagerie (`get_unread_conversations_count`, etc.)
- Fonctions de conversation (`mark_messages_as_read`, etc.)
- Fonctions de profil (`calculate_couple_profile_completion`, etc.)

### 4. Extension Vector dans Schéma Public 📦

**Problème:** L'extension `vector` était installée dans le schéma `public`.

**Solution:**
- Création du schéma `extensions`
- Déplacement de l'extension `vector` vers `extensions`
- Mise à jour du `search_path` pour inclure le schéma `extensions`

### 5. Protection Mots de Passe Compromis 🔐

**Problème:** La protection contre les mots de passe compromis (HaveIBeenPwned) est désactivée.

**Solution:** À activer manuellement dans Supabase Dashboard
1. Aller dans `Authentication` > `Policies`
2. Activer "Leaked Password Protection"

## 🚀 Application de la Migration

### Méthode 1: Via Supabase CLI (Recommandée)

```bash
# Appliquer la migration
supabase db push

# Ou si vous utilisez des migrations locales
supabase migration up
```

### Méthode 2: Via Dashboard Supabase

1. Aller dans `SQL Editor`
2. Copier le contenu de `supabase/migrations/008_fix_security_issues.sql`
3. Exécuter le script

### Vérification Post-Migration

Vérifier que les erreurs ont disparu dans le Dashboard Supabase:
1. Aller dans `Database` > `Linter`
2. Vérifier qu'il n'y a plus d'erreurs de sécurité

## 📋 Checklist de Sécurité

- [x] Vues SECURITY DEFINER corrigées
- [x] RLS activé sur toutes les tables publiques
- [x] Search path fixé sur toutes les fonctions
- [x] Extension vector déplacée hors du schéma public
- [ ] Protection mots de passe compromis activée (manuel)

## ⚡ Actions Post-Migration Recommandées

### 1. Activer la Protection des Mots de Passe

Dans Supabase Dashboard:
```
Authentication > Policies > Leaked Password Protection: ON
```

### 2. Vérifier les Policies RLS

Assurez-vous que les policies RLS sont correctement configurées pour vos cas d'usage:

```sql
-- Vérifier les policies existantes
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 3. Tester les Vues

Vérifier que les vues fonctionnent correctement avec les permissions utilisateur:

```sql
-- Test: lire devis_with_details en tant qu'utilisateur authentifié
SELECT * FROM devis_with_details LIMIT 1;

-- Test: lire demandes_with_provider
SELECT * FROM demandes_with_provider LIMIT 1;

-- Test: lire favoris_with_provider
SELECT * FROM favoris_with_provider LIMIT 1;
```

### 4. Audit des Fonctions

Vérifier que toutes les fonctions ont bien le search_path défini:

```sql
-- Lister les fonctions sans search_path fixe
SELECT
  n.nspname as schema,
  p.proname as function,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%'
  AND pg_get_functiondef(p.oid) NOT LIKE '%SET search_path%';
```

## 🔍 Monitoring Continu

Pour surveiller la sécurité de votre base de données:

1. **Linter Supabase**: Vérifier régulièrement le Dashboard
2. **Policies RLS**: Auditer les policies tous les mois
3. **Fonctions**: Vérifier que les nouvelles fonctions ont `search_path` défini
4. **Extensions**: Installer les nouvelles extensions dans le schéma `extensions`

## 📚 Ressources

- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [Function Security](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Extension Security](https://www.postgresql.org/docs/current/sql-createextension.html)

## 🆘 Support

Si vous rencontrez des problèmes après la migration:

1. Vérifier les logs Supabase
2. Tester les queries avec différents rôles
3. Contacter le support Supabase si nécessaire

---

**Migration créée par:** Claude Code
**Date:** 2026-01-06
**Version:** 008_fix_security_issues
