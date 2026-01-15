-- ============================================
-- CORRECTION URGENTE : provider_id -> prestataire_id
-- À EXÉCUTER IMMÉDIATEMENT DANS SUPABASE SQL EDITOR
-- ============================================

-- ÉTAPE 1: Vérifier l'état actuel
SELECT 
  'État actuel des colonnes' as info,
  table_name,
  column_name
FROM information_schema.columns
WHERE table_name IN ('conversations', 'messages')
AND column_name IN ('provider_id', 'prestataire_id')
ORDER BY table_name, column_name;

-- ÉTAPE 2: Renommer provider_id en prestataire_id dans conversations si nécessaire
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

-- ÉTAPE 3: Lister TOUTES les politiques RLS pour messages AVANT suppression
SELECT 
  'Politiques RLS AVANT correction' as info,
  polname as policyname,
  polcmd as cmd,
  pg_get_expr(polqual, polrelid) as using_clause,
  pg_get_expr(polwithcheck, polrelid) as with_check_clause
FROM pg_policy
WHERE polrelid = 'messages'::regclass;

-- ÉTAPE 4: Supprimer TOUTES les politiques RLS pour messages
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can read messages" ON messages;
DROP POLICY IF EXISTS "Couples can view messages" ON messages;
DROP POLICY IF EXISTS "Prestataires can view messages" ON messages;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;

-- ÉTAPE 5: Recréer les politiques avec prestataire_id (PAS provider_id)
-- Politique SELECT
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

-- Politique INSERT
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

-- ÉTAPE 6: Vérification finale - Lister les politiques APRÈS correction
SELECT 
  'Politiques RLS APRÈS correction' as info,
  polname as policyname,
  polcmd as cmd,
  pg_get_expr(polqual, polrelid) as using_clause,
  pg_get_expr(polwithcheck, polrelid) as with_check_clause
FROM pg_policy
WHERE polrelid = 'messages'::regclass;

-- ÉTAPE 7: Vérifier qu'il n'y a plus de références à provider_id
DO $$
DECLARE
  has_provider_id BOOLEAN := FALSE;
  policy_name TEXT;
BEGIN
  -- Vérifier toutes les politiques pour messages
  FOR policy_name IN 
    SELECT polname FROM pg_policy WHERE polrelid = 'messages'::regclass
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_policy
      WHERE polrelid = 'messages'::regclass
      AND polname = policy_name
      AND (
        pg_get_expr(polqual, polrelid) LIKE '%provider_id%'
        OR pg_get_expr(polwithcheck, polrelid) LIKE '%provider_id%'
      )
    ) THEN
      has_provider_id := TRUE;
      RAISE WARNING '⚠️ ATTENTION : La politique % contient encore provider_id', policy_name;
    END IF;
  END LOOP;
  
  IF NOT has_provider_id THEN
    RAISE NOTICE '✅ Aucune référence à provider_id dans les politiques RLS pour messages';
  END IF;
END $$;

-- Message de succès
SELECT '✅ CORRECTION TERMINÉE ! Les politiques RLS utilisent maintenant prestataire_id au lieu de provider_id.' as result;
