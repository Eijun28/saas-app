-- ============================================
-- CORRECTION COMPLÈTE DES POLITIQUES RLS
-- ============================================
-- Ce script corrige TOUS les problèmes RLS pour que :
-- 1. Les couples voient leurs conversations et demandes
-- 2. Les prestataires voient leurs conversations et demandes
-- 3. Les prestataires peuvent voir les couples avec qui ils communiquent
-- 4. Les messages fonctionnent pour tous
-- ============================================

-- ============================================
-- PARTIE 1: Renommer provider_id en prestataire_id si nécessaire
-- ============================================

-- DEMANDES
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'demandes' 
    AND column_name = 'provider_id'
  ) THEN
    DROP INDEX IF EXISTS idx_demandes_provider_id;
    ALTER TABLE demandes DROP CONSTRAINT IF EXISTS fk_demandes_provider;
    ALTER TABLE demandes RENAME COLUMN provider_id TO prestataire_id;
    CREATE INDEX IF NOT EXISTS idx_demandes_prestataire_id ON demandes(prestataire_id);
    ALTER TABLE demandes ADD CONSTRAINT fk_demandes_prestataire 
      FOREIGN KEY (prestataire_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'OK: Colonne provider_id renommée en prestataire_id dans demandes';
  END IF;
END $$;

-- CONVERSATIONS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'provider_id'
  ) THEN
    DROP INDEX IF EXISTS idx_conversations_provider_id;
    ALTER TABLE conversations DROP CONSTRAINT IF EXISTS fk_conversations_provider;
    ALTER TABLE conversations RENAME COLUMN provider_id TO prestataire_id;
    CREATE INDEX IF NOT EXISTS idx_conversations_prestataire_id ON conversations(prestataire_id);
    ALTER TABLE conversations ADD CONSTRAINT fk_conversations_prestataire 
      FOREIGN KEY (prestataire_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'OK: Colonne provider_id renommée en prestataire_id dans conversations';
  END IF;
END $$;

-- ============================================
-- PARTIE 2: POLITIQUES RLS POUR COUPLES
-- ============================================
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes sur couples
DROP POLICY IF EXISTS "Users can view own couple" ON couples;
DROP POLICY IF EXISTS "Users can insert own couple" ON couples;
DROP POLICY IF EXISTS "Users can update own couple" ON couples;
DROP POLICY IF EXISTS "Users can delete own couple" ON couples;
DROP POLICY IF EXISTS "Prestataires can view couples in demandes" ON couples;

-- Politique pour les couples : voir leur propre couple
CREATE POLICY "Users can view own couple"
  ON couples FOR SELECT
  USING (auth.uid() = user_id);

-- Politique pour les prestataires : voir les couples avec qui ils ont des demandes ou conversations
CREATE POLICY "Prestataires can view couples"
  ON couples FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM demandes
      WHERE demandes.couple_id = couples.id
      AND demandes.prestataire_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.couple_id = couples.id
      AND conversations.prestataire_id = auth.uid()
    )
  );

-- Politiques INSERT/UPDATE/DELETE pour les couples
CREATE POLICY "Users can insert own couple"
  ON couples FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own couple"
  ON couples FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own couple"
  ON couples FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PARTIE 3: POLITIQUES RLS POUR DEMANDES
-- ============================================
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Couples can view own demandes" ON demandes;
DROP POLICY IF EXISTS "Prestataires can view demandes" ON demandes;
DROP POLICY IF EXISTS "Couples can create demandes" ON demandes;
DROP POLICY IF EXISTS "Prestataires can update demandes" ON demandes;

-- Couples : voir leurs demandes
CREATE POLICY "Couples can view own demandes"
  ON demandes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = demandes.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- Prestataires : voir leurs demandes
CREATE POLICY "Prestataires can view demandes"
  ON demandes FOR SELECT
  USING (auth.uid() = demandes.prestataire_id);

-- Couples : créer des demandes
CREATE POLICY "Couples can create demandes"
  ON demandes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = demandes.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- Prestataires : mettre à jour leurs demandes
CREATE POLICY "Prestataires can update demandes"
  ON demandes FOR UPDATE
  USING (auth.uid() = demandes.prestataire_id)
  WITH CHECK (auth.uid() = demandes.prestataire_id);

-- ============================================
-- PARTIE 4: POLITIQUES RLS POUR CONVERSATIONS
-- ============================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;

-- Couples ET Prestataires : voir leurs conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    -- Si l'utilisateur est le couple
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = conversations.couple_id
      AND couples.user_id = auth.uid()
    )
    -- OU si l'utilisateur est le prestataire
    OR conversations.prestataire_id = auth.uid()
  );

-- Couples ET Prestataires : créer des conversations
CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    -- Si l'utilisateur est le couple
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = conversations.couple_id
      AND couples.user_id = auth.uid()
    )
    -- OU si l'utilisateur est le prestataire
    OR conversations.prestataire_id = auth.uid()
  );

-- Couples ET Prestataires : mettre à jour leurs conversations
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = conversations.couple_id
      AND couples.user_id = auth.uid()
    )
    OR conversations.prestataire_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = conversations.couple_id
      AND couples.user_id = auth.uid()
    )
    OR conversations.prestataire_id = auth.uid()
  );

-- ============================================
-- PARTIE 5: POLITIQUES RLS POUR MESSAGES
-- ============================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;

-- Couples ET Prestataires : voir les messages dans leurs conversations
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        -- Si l'utilisateur est le couple
        EXISTS (
          SELECT 1 FROM couples
          WHERE couples.id = conversations.couple_id
          AND couples.user_id = auth.uid()
        )
        -- OU si l'utilisateur est le prestataire
        OR conversations.prestataire_id = auth.uid()
      )
    )
  );

-- Couples ET Prestataires : envoyer des messages dans leurs conversations
CREATE POLICY "Users can send messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    messages.sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        -- Si l'utilisateur est le couple
        EXISTS (
          SELECT 1 FROM couples
          WHERE couples.id = conversations.couple_id
          AND couples.user_id = auth.uid()
        )
        -- OU si l'utilisateur est le prestataire
        OR conversations.prestataire_id = auth.uid()
      )
    )
  );

-- Couples ET Prestataires : mettre à jour les messages (pour read_at)
CREATE POLICY "Users can update messages in own conversations"
  ON messages FOR UPDATE
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
  )
  WITH CHECK (
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

-- ============================================
-- PARTIE 6: VÉRIFICATION FINALE
-- ============================================
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Vérifier les politiques sur couples
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'couples';
  RAISE NOTICE 'Politiques sur couples: %', policy_count;
  
  -- Vérifier les politiques sur demandes
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'demandes';
  RAISE NOTICE 'Politiques sur demandes: %', policy_count;
  
  -- Vérifier les politiques sur conversations
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'conversations';
  RAISE NOTICE 'Politiques sur conversations: %', policy_count;
  
  -- Vérifier les politiques sur messages
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'messages';
  RAISE NOTICE 'Politiques sur messages: %', policy_count;
END $$;

SELECT '✅ CORRECTION COMPLÈTE TERMINÉE ! Toutes les politiques RLS sont maintenant correctement configurées.' as result;
