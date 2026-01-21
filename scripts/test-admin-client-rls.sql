-- Script pour tester si le service role peut bypass RLS
-- À exécuter pour vérifier les permissions

-- Vérifier que RLS est activé sur profiles
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- Lister toutes les politiques RLS
SELECT 
  policyname,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- Note: Le service role key devrait bypass RLS automatiquement
-- Si les erreurs persistent, le problème peut venir de :
-- 1. Le service role key n'est pas utilisé correctement
-- 2. Les politiques RLS sont trop restrictives même pour le service role
-- 3. Il y a un problème avec la fonction handle_new_user qui utilise SECURITY DEFINER
