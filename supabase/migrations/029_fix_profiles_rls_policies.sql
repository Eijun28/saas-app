-- ============================================
-- Migration: Correction des politiques RLS pour profiles
-- Date: 2025-01
-- Description: Corrige les politiques RLS pour permettre l'inscription des prestataires
-- ============================================

-- ============================================
-- ÉTAPE 1: Nettoyer les politiques existantes qui peuvent causer des conflits
-- ============================================

-- Supprimer toutes les politiques existantes pour repartir sur une base propre
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
-- ÉTAPE 2: Créer des politiques RLS claires et cohérentes
-- ============================================

-- Politique SELECT : Tous les utilisateurs authentifiés peuvent voir tous les profils
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Politique INSERT : Les utilisateurs peuvent créer leur propre profil
-- IMPORTANT: auth.uid() doit correspondre à l'id du profil
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
-- ÉTAPE 3: Vérifier que RLS est activé
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTE IMPORTANTE
-- ============================================
-- Le code d'application utilise createAdminClient() qui devrait utiliser
-- le service_role key et contourner RLS. Si les erreurs persistent,
-- vérifiez que :
-- 1. SUPABASE_SERVICE_ROLE_KEY est bien configuré dans .env.local
-- 2. Le client admin utilise bien ce service role key
-- 3. Le service role key a les permissions nécessaires

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Lister toutes les politiques RLS sur profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY cmd, policyname;
