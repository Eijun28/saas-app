-- Migration: Correction des contraintes de clé étrangère incorrectes
-- Date: 2025-01
-- Description: Corrige les contraintes FK qui référencent profiles(id) au lieu de couples(id)
-- 
-- PROBLÈME IDENTIFIÉ:
-- - chatbot_conversations.couple_id référence profiles(id) au lieu de couples(id)
-- - matching_history.couple_id référence profiles(id) au lieu de couples(id)
--
-- SOLUTION:
-- Supprimer les contraintes incorrectes et les recréer avec la bonne référence

-- ============================================
-- CORRECTION 1: chatbot_conversations.couple_id
-- ============================================
-- La contrainte actuelle référence profiles(id) au lieu de couples(id)
-- On doit la supprimer et la recréer correctement

-- Supprimer l'ancienne contrainte incorrecte
ALTER TABLE public.chatbot_conversations 
DROP CONSTRAINT IF EXISTS chatbot_conversations_couple_id_fkey;

-- Recréer la contrainte correcte qui référence couples(id)
ALTER TABLE public.chatbot_conversations
ADD CONSTRAINT chatbot_conversations_couple_id_fkey 
FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;

-- ============================================
-- CORRECTION 2: matching_history.couple_id
-- ============================================
-- La contrainte actuelle référence profiles(id) au lieu de couples(id)
-- On doit la supprimer et la recréer correctement

-- Supprimer l'ancienne contrainte incorrecte
ALTER TABLE public.matching_history 
DROP CONSTRAINT IF EXISTS matching_history_couple_id_fkey;

-- Recréer la contrainte correcte qui référence couples(id)
ALTER TABLE public.matching_history
ADD CONSTRAINT matching_history_couple_id_fkey 
FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;

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
-- WHERE conname IN ('chatbot_conversations_couple_id_fkey', 'matching_history_couple_id_fkey');
