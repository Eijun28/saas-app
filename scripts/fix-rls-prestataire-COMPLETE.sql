-- ============================================
-- CORRECTION COMPLÈTE RLS POUR PRESTATAIRES
-- ============================================
-- Ce script corrige TOUS les problèmes RLS pour permettre aux prestataires de :
-- 1. Voir leurs demandes
-- 2. Voir les données des couples qui leur ont envoyé des demandes
-- 3. Envoyer des messages dans leurs conversations
-- ============================================

-- ============================================
-- PARTIE 1: Renommer provider_id en prestataire_id si nécessaire
-- ============================================

-- DEMANDES: Renommer provider_id en prestataire_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'demandes' 
    AND column_name = 'provider_id'
  ) THEN
    -- Renommer l'index
    DROP INDEX IF EXISTS idx_demandes_provider_id;
    -- Renommer la contrainte
    ALTER TABLE demandes DROP CONSTRAINT IF EXISTS fk_demandes_provider;
    -- Renommer la colonne
    ALTER TABLE demandes RENAME COLUMN provider_id TO prestataire_id;
    -- Recréer l'index
    CREATE INDEX IF NOT EXISTS idx_demandes_prestataire_id ON demandes(prestataire_id);
    -- Recréer la contrainte
    ALTER TABLE demandes ADD CONSTRAINT fk_demandes_prestataire 
      FOREIGN KEY (prestataire_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'OK: Colonne provider_id renommée en prestataire_id dans demandes';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'demandes' 
    AND column_name = 'prestataire_id'
  ) THEN
    RAISE NOTICE 'OK: Colonne prestataire_id existe déjà dans demandes';
  END IF;
END $$;

-- CONVERSATIONS: Renommer provider_id en prestataire_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'provider_id'
  ) THEN
    -- Renommer l'index
    DROP INDEX IF EXISTS idx_conversations_provider_id;
    -- Renommer la contrainte
    ALTER TABLE conversations DROP CONSTRAINT IF EXISTS fk_conversations_provider;
    -- Renommer la colonne
    ALTER TABLE conversations RENAME COLUMN provider_id TO prestataire_id;
    -- Recréer l'index
    CREATE INDEX IF NOT EXISTS idx_conversations_prestataire_id ON conversations(prestataire_id);
    -- Recréer la contrainte
    ALTER TABLE conversations ADD CONSTRAINT fk_conversations_prestataire 
      FOREIGN KEY (prestataire_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'OK: Colonne provider_id renommée en prestataire_id dans conversations';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'prestataire_id'
  ) THEN
    RAISE NOTICE 'OK: Colonne prestataire_id existe déjà dans conversations';
  END IF;
END $$;

-- DEVIS: Renommer provider_id en prestataire_id (au cas où)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'devis' 
    AND column_name = 'provider_id'
  ) THEN
    DROP INDEX IF EXISTS idx_devis_provider_id;
    ALTER TABLE devis DROP CONSTRAINT IF EXISTS fk_devis_provider;
    ALTER TABLE devis RENAME COLUMN provider_id TO prestataire_id;
    CREATE INDEX IF NOT EXISTS idx_devis_prestataire_id ON devis(prestataire_id);
    ALTER TABLE devis ADD CONSTRAINT fk_devis_prestataire 
      FOREIGN KEY (prestataire_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'OK: Colonne provider_id renommée en prestataire_id dans devis';
  END IF;
END $$;

-- ============================================
-- PARTIE 2: Corriger les politiques RLS pour DEMANDES
-- ============================================
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Couples can view own demandes" ON demandes;
DROP POLICY IF EXISTS "Prestataires can view demandes" ON demandes;
DROP POLICY IF EXISTS "Couples can create demandes" ON demandes;
DROP POLICY IF EXISTS "Prestataires can update demandes" ON demandes;
DROP POLICY IF EXISTS "Prestataires can view own demandes" ON demandes;

-- Recréer les politiques correctement
CREATE POLICY "Couples can view own demandes"
  ON demandes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = demandes.couple_id
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Prestataires can view demandes"
  ON demandes FOR SELECT
  USING (auth.uid() = demandes.prestataire_id);

CREATE POLICY "Couples can create demandes"
  ON demandes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = demandes.couple_id
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Prestataires can update demandes"
  ON demandes FOR UPDATE
  USING (auth.uid() = demandes.prestataire_id)
  WITH CHECK (auth.uid() = demandes.prestataire_id);

-- ============================================
-- PARTIE 3: Permettre aux prestataires de voir les couples
-- ============================================
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "Prestataires can view couples in demandes" ON couples;

-- Créer une politique pour permettre aux prestataires de voir les couples
-- qui leur ont envoyé des demandes OU avec qui ils ont des conversations
CREATE POLICY "Prestataires can view couples in demandes"
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

-- ============================================
-- PARTIE 4: Corriger les politiques RLS pour MESSAGES
-- ============================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Prestataires can view messages" ON messages;
DROP POLICY IF EXISTS "Prestataires can send messages" ON messages;

-- Recréer les politiques SELECT pour messages
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        -- Si l'utilisateur est le couple (via couples.user_id)
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

-- Recréer les politiques INSERT pour messages
CREATE POLICY "Users can send messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    messages.sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        -- Si l'utilisateur est le couple (via couples.user_id)
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

-- ============================================
-- PARTIE 5: Vérifier les politiques créées
-- ============================================
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Vérifier les politiques sur demandes
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'demandes';
  
  IF policy_count < 4 THEN
    RAISE WARNING 'ATTENTION: Seulement % politiques trouvées sur demandes (attendu: 4)', policy_count;
  ELSE
    RAISE NOTICE 'OK: % politiques trouvées sur demandes', policy_count;
  END IF;

  -- Vérifier les politiques sur messages
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'messages';
  
  IF policy_count < 2 THEN
    RAISE WARNING 'ATTENTION: Seulement % politiques trouvées sur messages (attendu: 2)', policy_count;
  ELSE
    RAISE NOTICE 'OK: % politiques trouvées sur messages', policy_count;
  END IF;

  -- Vérifier les politiques sur couples
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'couples'
  AND policyname = 'Prestataires can view couples in demandes';
  
  IF policy_count < 1 THEN
    RAISE WARNING 'ATTENTION: La politique pour prestataires sur couples n''existe pas';
  ELSE
    RAISE NOTICE 'OK: Politique pour prestataires sur couples existe';
  END IF;
END $$;

-- ============================================
-- PARTIE 6: Vérifier qu'il n'y a pas de références à provider_id
-- ============================================
DO $$
DECLARE
  policy_def TEXT;
  has_provider_id BOOLEAN := FALSE;
BEGIN
  -- Vérifier toutes les politiques sur demandes (utiliser pg_policies vue)
  FOR policy_def IN
    SELECT COALESCE(qual::TEXT, '') || ' ' || COALESCE(with_check::TEXT, '')
    FROM pg_policies
    WHERE tablename = 'demandes'
  LOOP
    IF policy_def LIKE '%provider_id%' THEN
      has_provider_id := TRUE;
      RAISE WARNING 'ATTENTION: Politique sur demandes contient provider_id: %', policy_def;
    END IF;
  END LOOP;

  -- Vérifier toutes les politiques sur messages (utiliser pg_policies vue)
  FOR policy_def IN
    SELECT COALESCE(qual::TEXT, '') || ' ' || COALESCE(with_check::TEXT, '')
    FROM pg_policies
    WHERE tablename = 'messages'
  LOOP
    IF policy_def LIKE '%provider_id%' THEN
      has_provider_id := TRUE;
      RAISE WARNING 'ATTENTION: Politique sur messages contient provider_id: %', policy_def;
    END IF;
  END LOOP;

  IF NOT has_provider_id THEN
    RAISE NOTICE 'OK: Aucune référence à provider_id dans les politiques RLS';
  END IF;
END $$;

SELECT '✅ CORRECTION RLS COMPLÈTE TERMINÉE ! Les prestataires peuvent maintenant voir leurs demandes, voir les couples, et envoyer des messages.' as result;
