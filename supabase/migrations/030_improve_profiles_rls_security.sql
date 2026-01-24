-- ============================================
-- Migration: Amélioration de la sécurité RLS pour profiles
-- Date: 2025-01
-- Description: Restreint l'accès aux données sensibles (email) tout en permettant le matching
-- ============================================

-- ============================================
-- PROBLÈME DE SÉCURITÉ IDENTIFIÉ
-- ============================================
-- La politique actuelle permet à tous les utilisateurs authentifiés de voir
-- TOUS les profils, y compris l'email qui est une donnée sensible.
-- 
-- SOLUTION :
-- 1. Les prestataires peuvent voir leur propre profil complet (y compris email)
-- 2. Les autres utilisateurs peuvent voir les profils prestataires mais SANS l'email
-- 3. Utilisation d'une vue sécurisée ou de politiques plus restrictives

-- ============================================
-- ÉTAPE 1: Supprimer la politique SELECT trop permissive
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;

-- ============================================
-- ÉTAPE 2: Créer des politiques SELECT plus sécurisées
-- ============================================

-- Politique 1 : Les utilisateurs peuvent voir leur propre profil complet
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Politique 2 : Les utilisateurs authentifiés peuvent voir les profils prestataires (pour le matching)
-- MAIS on ne peut pas filtrer les colonnes avec RLS, donc on autorise la vue complète
-- L'application doit filtrer l'email côté client si nécessaire
-- Note: Pour une sécurité maximale, utilisez une vue ou une fonction sécurisée
CREATE POLICY "Authenticated users can view prestataire profiles"
  ON profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND role = 'prestataire'
  );

-- ============================================
-- ÉTAPE 3: Les politiques INSERT et UPDATE restent inchangées (déjà sécurisées)
-- ============================================
-- Les politiques existantes sont déjà correctes :
-- - INSERT : auth.uid() = id
-- - UPDATE : auth.uid() = id

-- ============================================
-- ÉTAPE 4: Créer une vue sécurisée pour masquer l'email (OPTIONNEL mais recommandé)
-- ============================================

-- Vue qui masque l'email pour les autres utilisateurs
CREATE OR REPLACE VIEW profiles_public AS
SELECT 
  id,
  role,
  prenom,
  nom,
  nom_entreprise,
  avatar_url,
  description_courte,
  bio,
  budget_min,
  budget_max,
  ville_principale,
  annees_experience,
  service_type,
  is_early_adopter,
  subscription_tier,
  created_at,
  updated_at
  -- email est intentionnellement omis pour la sécurité
FROM profiles
WHERE role = 'prestataire';

-- Activer RLS sur la vue (nécessite PostgreSQL 15+ ou gestion manuelle)
-- Pour PostgreSQL < 15, utilisez la vue dans l'application au lieu de la table directement

-- Commentaire pour documentation
COMMENT ON VIEW profiles_public IS 
'Vue publique des profils prestataires sans données sensibles (email masqué). Utilisez cette vue pour le matching au lieu de la table profiles directement.';

-- ============================================
-- ÉTAPE 5: Politique RLS pour la vue (si supporté)
-- ============================================

-- Note: Les vues héritent des politiques RLS de la table sous-jacente
-- Pour une sécurité maximale, créez une fonction sécurisée à la place

-- ============================================
-- RECOMMANDATION POUR L'APPLICATION
-- ============================================
-- Dans votre code d'application, pour le matching :
-- - Utilisez la vue profiles_public au lieu de profiles
-- - Ou filtrez l'email côté application lors des requêtes SELECT
-- 
-- Exemple :
-- SELECT id, prenom, nom, nom_entreprise, ... FROM profiles_public WHERE ...
-- au lieu de
-- SELECT * FROM profiles WHERE role = 'prestataire'

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Lister toutes les politiques RLS sur profiles
SELECT 
  policyname,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- Vérifier que la vue existe
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'profiles_public';
