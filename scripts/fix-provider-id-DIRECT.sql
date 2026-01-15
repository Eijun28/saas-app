-- ============================================
-- CORRECTION DIRECTE : Trouver et corriger la politique problématique
-- ============================================

-- ÉTAPE 1: Voir EXACTEMENT quelle politique INSERT sur messages utilise provider_id
SELECT 
  polname as policy_name,
  pg_get_expr(polqual, polrelid) as using_clause,
  pg_get_expr(polwithcheck, polrelid) as with_check_clause
FROM pg_policy
WHERE polrelid = 'messages'::regclass
  AND polcmd = 'a'  -- 'a' = INSERT
  AND (
    pg_get_expr(polqual, polrelid) LIKE '%provider_id%'
    OR pg_get_expr(polwithcheck, polrelid) LIKE '%provider_id%'
  );

-- ÉTAPE 2: Supprimer TOUTES les politiques INSERT sur messages
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Couples can send messages" ON messages;
DROP POLICY IF EXISTS "Prestataires can send messages" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;

-- ÉTAPE 3: Recréer UNIQUEMENT la politique INSERT correcte
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

-- ÉTAPE 4: Vérifier qu'il n'y a plus de provider_id
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Aucune politique avec provider_id'
    ELSE '❌ ' || COUNT(*) || ' politique(s) avec provider_id trouvée(s)'
  END as verification
FROM pg_policy
WHERE polrelid = 'messages'::regclass
  AND (
    pg_get_expr(polqual, polrelid) LIKE '%provider_id%'
    OR pg_get_expr(polwithcheck, polrelid) LIKE '%provider_id%'
  );

SELECT '✅ Correction terminée' as result;
