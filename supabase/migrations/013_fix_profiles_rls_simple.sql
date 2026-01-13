-- Fix simple pour permettre aux utilisateurs authentifiés de voir les profils prestataires
-- Solution simple : permettre à tous les utilisateurs authentifiés de voir tous les profils

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view prestataire profiles" ON profiles;
DROP POLICY IF EXISTS "Couples can view prestataire profiles" ON profiles;

-- Politique simple : Tous les utilisateurs authentifiés peuvent voir tous les profils
-- (pour la recherche et la messagerie)
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Garder les politiques de mise à jour et insertion pour la sécurité
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
