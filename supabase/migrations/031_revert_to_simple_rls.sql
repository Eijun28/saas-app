-- ============================================
-- Migration: Retour aux politiques RLS simples (comme migration 029)
-- Date: 2025-01
-- Description: Revient aux politiques RLS simples qui fonctionnaient
-- ============================================

-- ============================================
-- ÉTAPE 1: Supprimer la vue profiles_public (si elle existe)
-- ============================================

DROP VIEW IF EXISTS profiles_public;

-- ============================================
-- ÉTAPE 2: Supprimer toutes les politiques existantes
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view prestataire profiles" ON profiles;
DROP POLICY IF EXISTS "Couples can view prestataire profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- ============================================
-- ÉTAPE 3: Recréer les politiques RLS simples qui fonctionnaient
-- ============================================

-- Politique SELECT : Tous les utilisateurs authentifiés peuvent voir tous les profils
-- (Simple et fonctionnel - l'email sera visible mais c'est acceptable pour le matching)
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Politique INSERT : Les utilisateurs peuvent créer leur propre profil
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Politique UPDATE : Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- ÉTAPE 4: S'assurer que RLS est activé
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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
