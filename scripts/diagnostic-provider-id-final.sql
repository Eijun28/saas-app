-- ============================================
-- DIAGNOSTIC FINAL : Trouver EXACTEMENT où provider_id est encore utilisé
-- ============================================

-- 1. Vérifier TOUTES les politiques RLS sur messages
SELECT 
  'POLICY' as type,
  tablename,
  policyname,
  CASE 
    WHEN qual IS NOT NULL THEN qual
    WHEN with_check IS NOT NULL THEN with_check
    ELSE 'NULL'
  END as definition
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'messages'
  AND (
    qual LIKE '%provider_id%' 
    OR with_check LIKE '%provider_id%'
  );

-- 2. Vérifier TOUTES les politiques RLS sur conversations
SELECT 
  'POLICY' as type,
  tablename,
  policyname,
  CASE 
    WHEN qual IS NOT NULL THEN qual
    WHEN with_check IS NOT NULL THEN with_check
    ELSE 'NULL'
  END as definition
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'conversations'
  AND (
    qual LIKE '%provider_id%' 
    OR with_check LIKE '%provider_id%'
  );

-- 3. Vérifier les triggers sur messages
SELECT 
  'TRIGGER' as type,
  'messages' as tablename,
  tgname as name,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'messages'::regclass
  AND NOT tgisinternal
  AND pg_get_triggerdef(oid) LIKE '%provider_id%';

-- 4. Vérifier les triggers sur conversations
SELECT 
  'TRIGGER' as type,
  'conversations' as tablename,
  tgname as name,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'conversations'::regclass
  AND NOT tgisinternal
  AND pg_get_triggerdef(oid) LIKE '%provider_id%';

-- 5. Lister TOUTES les politiques sur messages (pour voir leur définition complète)
SELECT 
  policyname,
  cmd as command_type,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policy
WHERE polrelid = 'messages'::regclass
ORDER BY policyname, cmd;

-- 6. Vérifier s'il y a des fonctions qui sont appelées automatiquement
SELECT 
  'FUNCTION' as type,
  p.proname as name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%provider_id%'
  AND (
    pg_get_functiondef(p.oid) LIKE '%messages%'
    OR pg_get_functiondef(p.oid) LIKE '%conversations%'
  );
