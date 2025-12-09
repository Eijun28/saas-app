-- ============================================
-- POLICIES RLS POUR NUPLY
-- ============================================
-- Exécuter ce script dans Supabase SQL Editor
-- après avoir créé les tables
-- ============================================

-- ============================================
-- 1. TABLE: profiles
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies (si elles existent)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;

-- Lecture : L'utilisateur peut voir son profil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Mise à jour : L'utilisateur peut mettre à jour son profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Insertion : L'utilisateur peut créer son profil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- IMPORTANT : Policy pour permettre au trigger de créer des profils
-- Cette policy permet au service_role (utilisé par les triggers/functions)
-- de créer des profils lors de l'inscription. Elle est nécessaire pour que
-- le trigger handle_new_user() fonctionne correctement.
-- 
-- NOTE : Si tu utilises SECURITY DEFINER dans ta fonction trigger,
-- cette policy peut être omise. Mais si tu as des problèmes de permissions,
-- ajoute cette policy (elle est sécurisée car elle vérifie le service_role).
-- 
-- ⚠️ ATTENTION : Si tu utilises la version simple avec USING (true) WITH CHECK (true),
-- cela donnerait accès à tout le monde. Ne l'utilise QUE si tu es sûr de ce que tu fais.
-- 
-- VERSION RECOMMANDÉE (sécurisée) :
CREATE POLICY "Service role can manage profiles"
  ON profiles
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR current_setting('role', true) = 'service_role'
  )
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR current_setting('role', true) = 'service_role'
  );

-- VERSION ALTERNATIVE (si la version ci-dessus ne fonctionne pas) :
-- ⚠️ DÉCOMMENTE UNIQUEMENT SI :
-- 1. Ta fonction trigger utilise SECURITY DEFINER (elle bypass RLS)
-- 2. OU si tu as des problèmes de permissions avec la version sécurisée
-- 3. ET tu es sûr que seul le service_role peut exécuter cette policy
-- 
-- DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
-- CREATE POLICY "Service role can manage profiles"
--   ON profiles
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);

-- ============================================
-- 2. TABLE: couple_profiles
-- ============================================

ALTER TABLE couple_profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies (si elles existent)
DROP POLICY IF EXISTS "Users can view own couple profile" ON couple_profiles;
DROP POLICY IF EXISTS "Users can update own couple profile" ON couple_profiles;
DROP POLICY IF EXISTS "Users can insert own couple profile" ON couple_profiles;

-- Lecture : L'utilisateur peut voir son profil couple
CREATE POLICY "Users can view own couple profile"
  ON couple_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Mise à jour : L'utilisateur peut mettre à jour son profil couple
CREATE POLICY "Users can update own couple profile"
  ON couple_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Insertion : L'utilisateur peut créer son profil couple
CREATE POLICY "Users can insert own couple profile"
  ON couple_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. TABLE: prestataire_profiles
-- ============================================

ALTER TABLE prestataire_profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies (si elles existent)
DROP POLICY IF EXISTS "Users can view own prestataire profile" ON prestataire_profiles;
DROP POLICY IF EXISTS "Users can update own prestataire profile" ON prestataire_profiles;
DROP POLICY IF EXISTS "Users can insert own prestataire profile" ON prestataire_profiles;

-- Lecture : L'utilisateur peut voir son profil prestataire
CREATE POLICY "Users can view own prestataire profile"
  ON prestataire_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Mise à jour : L'utilisateur peut mettre à jour son profil prestataire
CREATE POLICY "Users can update own prestataire profile"
  ON prestataire_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Insertion : L'utilisateur peut créer son profil prestataire
CREATE POLICY "Users can insert own prestataire profile"
  ON prestataire_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Pour vérifier que les policies sont bien créées :
-- SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'couple_profiles', 'prestataire_profiles');
