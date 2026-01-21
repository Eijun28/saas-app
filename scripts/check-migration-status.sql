-- Script pour vérifier si la migration 028 a été appliquée
-- Vérifie les éléments clés de la migration

-- 1. Vérifier si la colonne email existe dans profiles
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'email'
) AS email_column_exists;

-- 2. Vérifier si l'index unique partiel sur email existe
SELECT EXISTS (
  SELECT 1 FROM pg_indexes 
  WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND indexname = 'idx_profiles_email_unique'
) AS email_unique_index_exists;

-- 3. Vérifier la contrainte CHECK sur role
SELECT EXISTS (
  SELECT 1 FROM information_schema.table_constraints 
  WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND constraint_name = 'profiles_role_check'
) AS role_check_constraint_exists;

-- 4. Vérifier le trigger handle_new_user sur auth.users (pas sur profiles !)
SELECT EXISTS (
  SELECT 1 FROM information_schema.triggers
  WHERE trigger_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created'
) AS trigger_exists;

-- 5. Vérifier la fonction handle_new_user (vérifier si elle contient 'prestataire')
SELECT 
  proname AS function_name,
  CASE 
    WHEN pg_get_functiondef(oid) LIKE '%prestataire%' THEN true
    ELSE false
  END AS function_has_prestataire_check
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 6. Résumé : Toutes les vérifications en une seule requête
SELECT 
  (SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name = 'email'
  )) AS "Colonne email existe",
  (SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND indexname = 'idx_profiles_email_unique'
  )) AS "Index unique email existe",
  (SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND constraint_name = 'profiles_role_check'
  )) AS "Contrainte CHECK role existe",
  (SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'auth'
    AND event_object_table = 'users'
    AND trigger_name = 'on_auth_user_created'
  )) AS "Trigger existe";
