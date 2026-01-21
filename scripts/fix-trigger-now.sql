-- ============================================
-- SCRIPT URGENT : Créer le trigger manquant
-- ============================================
-- Copiez-collez ce script dans Supabase SQL Editor et exécutez-le

-- Étape 1 : Vérifier que la fonction existe
SELECT 
  proname AS function_name,
  CASE 
    WHEN proname = 'handle_new_user' THEN '✅ Fonction existe'
    ELSE '❌ Fonction manquante'
  END AS status
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Étape 2 : Supprimer le trigger s'il existe déjà (pour éviter les doublons)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Étape 3 : Créer le trigger sur auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Étape 4 : Vérifier que le trigger a été créé
SELECT 
  trigger_name,
  event_object_schema,
  event_object_table,
  event_manipulation,
  action_timing,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' THEN '✅ Trigger créé avec succès'
    ELSE '❌ Erreur lors de la création'
  END AS status
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';
