-- ============================================
-- DIAGNOSTIC : Vérifier l'état de la table demandes
-- ============================================
-- Ce script vérifie :
-- 1. Si la colonne prestataire_id existe
-- 2. Si la colonne provider_id existe encore
-- 3. L'état des politiques RLS
-- ============================================

-- ÉTAPE 1: Vérifier les colonnes de la table demandes
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'demandes'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ÉTAPE 2: Vérifier si provider_id existe encore
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'demandes' 
      AND column_name = 'provider_id'
    ) THEN '❌ ERREUR: provider_id existe encore dans demandes'
    ELSE '✅ OK: provider_id n''existe pas'
  END as check_provider_id;

-- ÉTAPE 3: Vérifier si prestataire_id existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'demandes' 
      AND column_name = 'prestataire_id'
    ) THEN '✅ OK: prestataire_id existe'
    ELSE '❌ ERREUR: prestataire_id n''existe pas dans demandes'
  END as check_prestataire_id;

-- ÉTAPE 4: Lister toutes les politiques RLS sur demandes
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
WHERE tablename = 'demandes'
ORDER BY policyname;

-- ÉTAPE 5: Vérifier si les politiques utilisent provider_id
SELECT 
  policyname,
  CASE 
    WHEN qual::text LIKE '%provider_id%' OR with_check::text LIKE '%provider_id%' THEN
      '❌ ERREUR: Cette politique utilise provider_id'
    WHEN qual::text LIKE '%prestataire_id%' OR with_check::text LIKE '%prestataire_id%' THEN
      '✅ OK: Cette politique utilise prestataire_id'
    ELSE
      '⚠️ ATTENTION: Cette politique n''utilise ni provider_id ni prestataire_id'
  END as status
FROM pg_policies
WHERE tablename = 'demandes';

-- ÉTAPE 6: Compter les demandes avec prestataire_id
SELECT 
  COUNT(*) as total_demandes,
  COUNT(prestataire_id) as avec_prestataire_id,
  COUNT(*) - COUNT(prestataire_id) as sans_prestataire_id
FROM demandes;

-- ÉTAPE 7: Vérifier RLS activé
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'demandes';
