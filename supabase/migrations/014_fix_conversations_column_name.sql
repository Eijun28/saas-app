-- Migration: Corriger les politiques RLS pour messages (erreur 409)
-- Date: 2025-01-13
-- Description: 
--   1. Vérifie et corrige le nom de colonne (prestataire_id vs provider_id)
--   2. Ajoute la vérification sender_id = auth.uid() dans la politique INSERT
--   3. Corrige l'erreur 409 (Conflict) lors de l'envoi de messages

-- ============================================
-- Vérifier quelle colonne existe réellement
-- ============================================

-- Si provider_id existe, le renommer en prestataire_id pour cohérence
DO $$
BEGIN
  -- Vérifier si provider_id existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'provider_id'
  ) THEN
    -- Renommer provider_id en prestataire_id
    ALTER TABLE conversations RENAME COLUMN provider_id TO prestataire_id;
    RAISE NOTICE 'Colonne provider_id renommée en prestataire_id';
  END IF;
END $$;

-- ============================================
-- Corriger les politiques RLS pour messages
-- ============================================

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;

-- Recréer avec le bon nom de colonne (prestataire_id)
-- IMPORTANT: Vérifier que sender_id = auth.uid() pour éviter les erreurs 409
CREATE POLICY "Users can send messages in own conversations" ON messages
  FOR INSERT
  WITH CHECK (
    -- Le sender_id DOIT être égal à auth.uid() (l'utilisateur authentifié)
    messages.sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.couple_id = auth.uid() 
        OR conversations.prestataire_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view messages in own conversations" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.couple_id = auth.uid() 
        OR conversations.prestataire_id = auth.uid()
      )
    )
  );
