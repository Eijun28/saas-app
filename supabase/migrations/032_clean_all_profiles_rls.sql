-- ============================================
-- Migration: Nettoyage complet des politiques RLS profiles
-- Date: 2025-01
-- Description: Supprime TOUTES les politiques existantes et recrée uniquement celles nécessaires
-- ============================================

-- ============================================
-- ÉTAPE 1: Supprimer TOUTES les politiques existantes sur profiles
-- ============================================

-- Supprimer toutes les politiques connues (y compris celles avec des noms génériques)
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

-- Supprimer toutes les autres politiques qui pourraient exister
-- (PostgreSQL ne permet pas de supprimer toutes les politiques en une fois, donc on doit les lister)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
    RAISE NOTICE 'Politique supprimée: %', r.policyname;
  END LOOP;
END $$;

-- ============================================
-- ÉTAPE 2: Créer UNIQUEMENT les politiques nécessaires et sécurisées
-- ============================================

-- Politique SELECT : Tous les utilisateurs authentifiés peuvent voir tous les profils
-- (Nécessaire pour le matching - l'email sera visible mais c'est acceptable pour les prestataires)
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
-- ÉTAPE 3: S'assurer que RLS est activé
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

-- Lister toutes les politiques RLS sur profiles (devrait être exactement 3)
SELECT 
  policyname,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- Vérifier le nombre de politiques (devrait être 3)
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'profiles';
  
  IF policy_count = 3 THEN
    RAISE NOTICE '✅ Exactement 3 politiques RLS créées (SELECT, INSERT, UPDATE)';
  ELSE
    RAISE WARNING '⚠️ Nombre de politiques inattendu: % (attendu: 3)', policy_count;
  END IF;
END $$;
