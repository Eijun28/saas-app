-- ============================================
-- Migration: Correction des politiques RLS pour messages
-- Date: 2025-01-13
-- Description: 
--   Corrige les politiques RLS qui pourraient référencer provider_id au lieu de prestataire_id
--   dans les sous-requêtes de la table messages
-- ============================================

-- ÉTAPE 1: Vérifier et renommer provider_id en prestataire_id dans conversations si nécessaire
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'provider_id'
  ) THEN
    -- Renommer provider_id en prestataire_id si elle existe encore
    ALTER TABLE conversations RENAME COLUMN provider_id TO prestataire_id;
    RAISE NOTICE 'Colonne provider_id renommée en prestataire_id dans conversations';
  ELSE
    RAISE NOTICE 'La colonne conversations.prestataire_id existe déjà (pas de renommage nécessaire)';
  END IF;
END $$;

-- ÉTAPE 2: Vérifier qu'il n'y a pas de colonne provider_id dans messages (ne devrait jamais exister)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'provider_id'
  ) THEN
    RAISE EXCEPTION 'La colonne provider_id ne devrait pas exister dans la table messages';
  ELSE
    RAISE NOTICE 'Vérification OK : pas de colonne provider_id dans messages';
  END IF;
END $$;

-- ÉTAPE 3: Supprimer toutes les politiques RLS existantes pour messages
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can read messages" ON messages;
DROP POLICY IF EXISTS "Couples can view messages" ON messages;
DROP POLICY IF EXISTS "Prestataires can view messages" ON messages;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;

-- ÉTAPE 4: Recréer les politiques RLS avec prestataire_id (pas provider_id)
-- Politique SELECT : Les utilisateurs peuvent voir les messages dans leurs conversations
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        -- Vérifier si l'utilisateur est le couple (via couples.user_id)
        EXISTS (
          SELECT 1 FROM couples
          WHERE couples.id = conversations.couple_id
          AND couples.user_id = auth.uid()
        )
        -- OU si l'utilisateur est le prestataire (via conversations.prestataire_id)
        OR conversations.prestataire_id = auth.uid()
      )
    )
  );

-- Politique INSERT : Les utilisateurs peuvent envoyer des messages dans leurs conversations
CREATE POLICY "Users can send messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    -- L'expéditeur doit être l'utilisateur connecté
    messages.sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        -- Vérifier si l'utilisateur est le couple (via couples.user_id)
        EXISTS (
          SELECT 1 FROM couples
          WHERE couples.id = conversations.couple_id
          AND couples.user_id = auth.uid()
        )
        -- OU si l'utilisateur est le prestataire (via conversations.prestataire_id)
        OR conversations.prestataire_id = auth.uid()
      )
    )
  );

-- ÉTAPE 5: Vérifier que les politiques utilisent bien prestataire_id
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'messages'
  AND policyname IN ('Users can view messages in own conversations', 'Users can send messages in own conversations');
  
  IF policy_count < 2 THEN
    RAISE WARNING 'Attention : Seulement % politiques créées pour messages (attendu: 2)', policy_count;
  ELSE
    RAISE NOTICE 'Vérification OK : % politiques RLS créées pour messages', policy_count;
  END IF;
END $$;

-- ÉTAPE 6: Vérifier qu'il n'y a pas de références à provider_id dans les politiques
DO $$
DECLARE
  policy_def TEXT;
  has_provider_id BOOLEAN := FALSE;
BEGIN
  -- Vérifier la politique SELECT
  SELECT pg_get_expr(polqual, polrelid) INTO policy_def
  FROM pg_policy
  WHERE polname = 'Users can view messages in own conversations'
  AND polrelid = 'messages'::regclass;
  
  IF policy_def LIKE '%provider_id%' THEN
    has_provider_id := TRUE;
    RAISE WARNING 'ATTENTION : La politique SELECT contient encore provider_id';
  END IF;
  
  -- Vérifier la politique INSERT
  SELECT pg_get_expr(polqual, polrelid) INTO policy_def
  FROM pg_policy
  WHERE polname = 'Users can send messages in own conversations'
  AND polrelid = 'messages'::regclass;
  
  IF policy_def LIKE '%provider_id%' THEN
    has_provider_id := TRUE;
    RAISE WARNING 'ATTENTION : La politique INSERT contient encore provider_id';
  END IF;
  
  IF NOT has_provider_id THEN
    RAISE NOTICE 'Vérification OK : Aucune référence à provider_id dans les politiques RLS';
  END IF;
END $$;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 017 terminée avec succès : politiques RLS pour messages corrigées';
END $$;
