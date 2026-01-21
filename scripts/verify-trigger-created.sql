-- Script de vérification rapide : Vérifier que le trigger existe maintenant
-- Exécutez ce script pour confirmer que le trigger a été créé

SELECT 
  trigger_name,
  event_object_schema,
  event_object_table,
  event_manipulation,
  action_timing,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' THEN '✅ Trigger créé avec succès !'
    ELSE '❌ Trigger non trouvé'
  END AS status
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

-- Vérification complète de la migration
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
