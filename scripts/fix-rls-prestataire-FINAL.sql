-- ============================================
-- CORRECTION RLS POUR PRESTATAIRES
-- ============================================
-- Ce script corrige les politiques RLS pour permettre aux prestataires de :
-- 1. Voir leurs demandes
-- 2. Envoyer des messages dans leurs conversations
-- ============================================

-- ============================================
-- PARTIE 1: Vérifier que la colonne prestataire_id existe
-- ============================================
DO $$
BEGIN
  -- Vérifier demandes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'demandes' 
    AND column_name = 'prestataire_id'
  ) THEN
    RAISE EXCEPTION 'ERREUR: La colonne prestataire_id n''existe pas dans demandes';
  ELSE
    RAISE NOTICE 'OK: Colonne prestataire_id existe dans demandes';
  END IF;

  -- Vérifier conversations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'prestataire_id'
  ) THEN
    RAISE EXCEPTION 'ERREUR: La colonne prestataire_id n''existe pas dans conversations';
  ELSE
    RAISE NOTICE 'OK: Colonne prestataire_id existe dans conversations';
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
-- PARTIE 3: Corriger les politiques RLS pour MESSAGES
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
-- PARTIE 4: Vérifier les politiques créées
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
END $$;

-- ============================================
-- PARTIE 5: Vérifier qu'il n'y a pas de références à provider_id
-- ============================================
DO $$
DECLARE
  policy_def TEXT;
  has_provider_id BOOLEAN := FALSE;
BEGIN
  -- Vérifier toutes les politiques sur demandes
  FOR policy_def IN
    SELECT pg_get_expr(qual, polrelid)::TEXT
    FROM pg_policy
    WHERE polrelid = 'demandes'::regclass
  LOOP
    IF policy_def LIKE '%provider_id%' THEN
      has_provider_id := TRUE;
      RAISE WARNING 'ATTENTION: Politique sur demandes contient provider_id: %', policy_def;
    END IF;
  END LOOP;

  -- Vérifier toutes les politiques sur messages
  FOR policy_def IN
    SELECT pg_get_expr(qual, polrelid)::TEXT
    FROM pg_policy
    WHERE polrelid = 'messages'::regclass
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

SELECT '✅ CORRECTION RLS TERMINÉE ! Les prestataires peuvent maintenant voir leurs demandes et envoyer des messages.' as result;
