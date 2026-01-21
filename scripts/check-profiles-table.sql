-- Script de diagnostic pour vérifier la structure de la table profiles
-- À exécuter dans Supabase SQL Editor pour diagnostiquer les problèmes d'inscription

-- 1. Vérifier que la table profiles existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
) AS table_exists;

-- 2. Lister toutes les colonnes de la table profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Vérifier les contraintes sur la table profiles
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'profiles'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 4. Vérifier les index sur la table profiles
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- 5. Vérifier le trigger handle_new_user
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'profiles';

-- 6. Vérifier la fonction handle_new_user
SELECT
  proname AS function_name,
  pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 7. Vérifier les politiques RLS sur profiles
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
  AND tablename = 'profiles';

-- 8. Compter les prestataires existants
SELECT COUNT(*) AS total_prestataires
FROM profiles
WHERE role = 'prestataire';

-- 9. Vérifier les prestataires sans email
SELECT 
  id,
  email,
  role,
  prenom,
  nom,
  created_at
FROM profiles
WHERE role = 'prestataire'
  AND (email IS NULL OR email = '')
LIMIT 10;
