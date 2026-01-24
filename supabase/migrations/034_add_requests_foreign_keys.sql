-- Migration: Ajout des clés étrangères manquantes pour la table requests
-- Date: 2025-01
-- Description: Ajoute les contraintes FK manquantes pour requests.couple_id et requests.provider_id
-- 
-- PROBLÈME IDENTIFIÉ:
-- - requests.couple_id n'a pas de contrainte FK vers couples(user_id)
--   Note: couple_id contient auth.users.id qui correspond à couples.user_id (UNIQUE)
-- - requests.provider_id n'a pas de contrainte FK vers auth.users(id)
-- - Cela empêche PostgREST de détecter les relations pour les jointures
--
-- SOLUTION:
-- Ajouter les contraintes FK manquantes
-- IMPORTANT: couple_id référence couples.user_id (pas couples.id) car couple_id = auth.users.id

-- ============================================
-- CORRECTION 1: requests.couple_id -> couples(user_id)
-- ============================================
-- Ajouter la contrainte FK manquante
-- couple_id contient auth.users.id qui correspond à couples.user_id (colonne UNIQUE)
ALTER TABLE public.requests
ADD CONSTRAINT requests_couple_id_fkey 
FOREIGN KEY (couple_id) REFERENCES public.couples(user_id) ON DELETE CASCADE;

-- ============================================
-- CORRECTION 2: requests.provider_id -> auth.users(id)
-- ============================================
-- Ajouter la contrainte FK manquante pour provider_id
ALTER TABLE public.requests
ADD CONSTRAINT requests_provider_id_fkey 
FOREIGN KEY (provider_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Vérifier que les contraintes sont correctes
-- Cette requête peut être exécutée manuellement pour vérifier :
-- SELECT 
--     conname AS constraint_name,
--     conrelid::regclass AS table_name,
--     confrelid::regclass AS referenced_table
-- FROM pg_constraint
-- WHERE conname IN ('requests_couple_id_fkey', 'requests_provider_id_fkey');
