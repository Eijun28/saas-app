-- ============================================
-- CORRECTION FORCÉE : Supprimer TOUTES les politiques et les recréer
-- À EXÉCUTER DANS SUPABASE SQL EDITOR
-- ============================================

-- ÉTAPE 1: Supprimer TOUTES les politiques sur messages (sans exception)
DO $$
DECLARE
  policy_name TEXT;
BEGIN
  FOR policy_name IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'messages'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON messages', policy_name);
    RAISE NOTICE '✅ Politique supprimée: %', policy_name;
  END LOOP;
END $$;

-- ÉTAPE 2: Supprimer TOUTES les politiques sur conversations
DO $$
DECLARE
  policy_name TEXT;
BEGIN
  FOR policy_name IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'conversations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON conversations', policy_name);
    RAISE NOTICE '✅ Politique supprimée: %', policy_name;
  END LOOP;
END $$;

-- ÉTAPE 3: Recréer les politiques messages avec prestataire_id UNIQUEMENT
-- Messages SELECT
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

-- Messages INSERT (CRITIQUE - c'est celle qui bloque l'envoi)
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

-- Messages UPDATE
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- ÉTAPE 4: Recréer les politiques conversations avec prestataire_id UNIQUEMENT
-- Conversations SELECT
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = conversations.couple_id
      AND couples.user_id = auth.uid()
    )
    OR conversations.prestataire_id = auth.uid()
  );

-- Conversations INSERT
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = conversations.couple_id
      AND couples.user_id = auth.uid()
    )
    OR conversations.prestataire_id = auth.uid()
  );

-- Conversations UPDATE
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = conversations.couple_id
      AND couples.user_id = auth.uid()
    )
    OR conversations.prestataire_id = auth.uid()
  );

-- ÉTAPE 5: Vérification finale - S'assurer qu'il n'y a plus de provider_id
DO $$
DECLARE
  policy_count INTEGER;
  has_provider_id BOOLEAN := FALSE;
BEGIN
  -- Compter les politiques
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('messages', 'conversations');
  
  RAISE NOTICE '✅ Nombre de politiques RLS créées: %', policy_count;
  
  -- Vérifier qu'il n'y a pas de provider_id
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('messages', 'conversations')
      AND (
        qual LIKE '%provider_id%'
        OR with_check LIKE '%provider_id%'
      )
  ) INTO has_provider_id;
  
  IF has_provider_id THEN
    RAISE WARNING '⚠️ ATTENTION : Des politiques contiennent encore provider_id';
  ELSE
    RAISE NOTICE '✅ Aucune référence à provider_id dans les politiques RLS';
  END IF;
END $$;

-- Message de succès
SELECT '✅ CORRECTION FORCÉE TERMINÉE ! Toutes les politiques ont été supprimées et recréées avec prestataire_id.' as result;
