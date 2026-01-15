-- ============================================
-- Script de correction immédiate : provider_id -> prestataire_id
-- Date: 2025-01-13
-- Description: 
--   À exécuter directement dans Supabase SQL Editor pour corriger immédiatement le problème
-- ============================================

-- ÉTAPE 1: Renommer provider_id en prestataire_id dans conversations si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE conversations RENAME COLUMN provider_id TO prestataire_id;
    RAISE NOTICE '✅ Colonne provider_id renommée en prestataire_id dans conversations';
  ELSE
    RAISE NOTICE '✅ conversations.prestataire_id existe déjà';
  END IF;
END $$;

-- ÉTAPE 2: Supprimer TOUTES les politiques RLS pour messages
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can read messages" ON messages;
DROP POLICY IF EXISTS "Couples can view messages" ON messages;
DROP POLICY IF EXISTS "Prestataires can view messages" ON messages;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;

-- ÉTAPE 3: Recréer les politiques avec prestataire_id (PAS provider_id)
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        EXISTS (
          SELECT 1 FROM couples
          WHERE couples.id = conversations.couple_id
          AND couples.user_id = auth.uid()
        )
        OR conversations.prestataire_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can send messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    messages.sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        EXISTS (
          SELECT 1 FROM couples
          WHERE couples.id = conversations.couple_id
          AND couples.user_id = auth.uid()
        )
        OR conversations.prestataire_id = auth.uid()
      )
    )
  );

-- ÉTAPE 4: Vérification finale
DO $$
DECLARE
  policy_count INTEGER;
  has_provider_id BOOLEAN := FALSE;
BEGIN
  -- Compter les politiques
  SELECT COUNT(*) INTO policy_count
  FROM pg_policy
  WHERE polrelid = 'messages'::regclass;
  
  RAISE NOTICE '✅ Nombre de politiques RLS pour messages: %', policy_count;
  
  -- Vérifier qu'il n'y a pas de provider_id
  SELECT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'messages'::regclass
    AND (
      pg_get_expr(polqual, polrelid) LIKE '%provider_id%'
      OR pg_get_expr(polwithcheck, polrelid) LIKE '%provider_id%'
    )
  ) INTO has_provider_id;
  
  IF has_provider_id THEN
    RAISE WARNING '⚠️ ATTENTION : Des politiques contiennent encore provider_id';
  ELSE
    RAISE NOTICE '✅ Aucune référence à provider_id dans les politiques RLS';
  END IF;
END $$;

-- Message de succès
SELECT '✅ Correction terminée ! Les politiques RLS utilisent maintenant prestataire_id au lieu de provider_id.' as result;
