-- ============================================
-- Script de diagnostic : Identifier les politiques RLS problématiques
-- Date: 2025-01-13
-- Description: 
--   Identifie toutes les politiques RLS qui pourraient référencer provider_id
-- ============================================

-- 1. Vérifier les colonnes de la table conversations
SELECT 
  'conversations' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'conversations'
AND column_name IN ('provider_id', 'prestataire_id')
ORDER BY column_name;

-- 2. Vérifier les colonnes de la table messages
SELECT 
  'messages' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'messages'
AND column_name IN ('provider_id', 'prestataire_id')
ORDER BY column_name;

-- 3. Lister toutes les politiques RLS pour messages
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;

-- 4. Vérifier si les politiques contiennent "provider_id"
SELECT 
  policyname,
  'USING clause' as clause_type,
  pg_get_expr(polqual, polrelid) as expression
FROM pg_policy
WHERE polrelid = 'messages'::regclass
AND pg_get_expr(polqual, polrelid) LIKE '%provider_id%'

UNION ALL

SELECT 
  policyname,
  'WITH CHECK clause' as clause_type,
  pg_get_expr(polwithcheck, polrelid) as expression
FROM pg_policy
WHERE polrelid = 'messages'::regclass
AND pg_get_expr(polwithcheck, polrelid) LIKE '%provider_id%';

-- 5. Vérifier les politiques RLS pour conversations
SELECT 
  policyname,
  'USING clause' as clause_type,
  pg_get_expr(polqual, polrelid) as expression
FROM pg_policy
WHERE polrelid = 'conversations'::regclass
AND pg_get_expr(polqual, polrelid) LIKE '%provider_id%'

UNION ALL

SELECT 
  policyname,
  'WITH CHECK clause' as clause_type,
  pg_get_expr(polwithcheck, polrelid) as expression
FROM pg_policy
WHERE polrelid = 'conversations'::regclass
AND pg_get_expr(polwithcheck, polrelid) LIKE '%provider_id%';

-- 6. Vérifier s'il y a des vues qui référencent provider_id
SELECT 
  table_schema,
  table_name,
  view_definition
FROM information_schema.views
WHERE view_definition LIKE '%provider_id%'
AND (table_name LIKE '%message%' OR table_name LIKE '%conversation%');

-- 7. Vérifier s'il y a des triggers qui référencent provider_id
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE action_statement LIKE '%provider_id%'
AND (event_object_table = 'messages' OR event_object_table = 'conversations');
