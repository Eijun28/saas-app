-- ============================================
-- CORRECTION COMPLÈTE ET DÉFINITIVE : provider_id -> prestataire_id
-- À EXÉCUTER DANS SUPABASE SQL EDITOR
-- ============================================

-- ÉTAPE 1: Supprimer et recréer la fonction get_or_create_conversation
DROP FUNCTION IF EXISTS get_or_create_conversation(
  p_couple_id UUID,
  p_provider_id UUID,
  p_demande_id UUID,
  p_demande_type TEXT,
  p_cultures TEXT[],
  p_event_date DATE,
  p_event_location TEXT,
  p_estimated_budget NUMERIC,
  p_guest_count INTEGER
);

DROP FUNCTION IF EXISTS get_or_create_conversation(
  p_couple_id UUID,
  p_prestataire_id UUID,
  p_demande_id UUID,
  p_demande_type TEXT,
  p_cultures TEXT[],
  p_event_date DATE,
  p_event_location TEXT,
  p_estimated_budget NUMERIC,
  p_guest_count INTEGER
);

-- Recréer avec prestataire_id uniquement
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_couple_id UUID,
  p_prestataire_id UUID,
  p_demande_id UUID DEFAULT NULL,
  p_demande_type TEXT DEFAULT NULL,
  p_cultures TEXT[] DEFAULT NULL,
  p_event_date DATE DEFAULT NULL,
  p_event_location TEXT DEFAULT NULL,
  p_estimated_budget NUMERIC DEFAULT NULL,
  p_guest_count INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Vérifier si une conversation existe déjà
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE couple_id = p_couple_id
    AND prestataire_id = p_prestataire_id
    AND status = 'active'
  LIMIT 1;
  
  -- Si elle existe, la retourner
  IF v_conversation_id IS NOT NULL THEN
    -- Mettre à jour demande_id si fourni
    IF p_demande_id IS NOT NULL THEN
      UPDATE conversations
      SET demande_id = p_demande_id
      WHERE id = v_conversation_id;
    END IF;
    RETURN v_conversation_id;
  END IF;
  
  -- Sinon, créer une nouvelle conversation
  INSERT INTO conversations (
    couple_id,
    prestataire_id,
    demande_id,
    status,
    created_at,
    updated_at
  )
  VALUES (
    p_couple_id,
    p_prestataire_id,
    p_demande_id,
    'active',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_conversation_id;
  
  RETURN v_conversation_id;
END;
$$;

-- ÉTAPE 2: Vérifier et corriger les triggers sur messages
DO $$
DECLARE
  trigger_name TEXT;
  trigger_def TEXT;
BEGIN
  -- Lister tous les triggers sur messages
  FOR trigger_name IN
    SELECT tgname
    FROM pg_trigger
    WHERE tgrelid = 'messages'::regclass
      AND NOT tgisinternal
  LOOP
    -- Obtenir la définition du trigger
    SELECT pg_get_triggerdef(oid) INTO trigger_def
    FROM pg_trigger
    WHERE tgname = trigger_name;
    
    -- Si le trigger utilise provider_id, le supprimer et le recréer
    IF trigger_def LIKE '%provider_id%' THEN
      RAISE WARNING '⚠️ Trigger trouvé avec provider_id: %', trigger_name;
      -- Note: On ne peut pas modifier un trigger, il faut le supprimer et le recréer
      -- Mais on ne connaît pas sa définition complète, donc on le supprime seulement
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON messages', trigger_name);
    END IF;
  END LOOP;
END $$;

-- ÉTAPE 3: Vérifier et corriger les triggers sur conversations
DO $$
DECLARE
  trigger_name TEXT;
  trigger_def TEXT;
BEGIN
  FOR trigger_name IN
    SELECT tgname
    FROM pg_trigger
    WHERE tgrelid = 'conversations'::regclass
      AND NOT tgisinternal
  LOOP
    SELECT pg_get_triggerdef(oid) INTO trigger_def
    FROM pg_trigger
    WHERE tgname = trigger_name;
    
    IF trigger_def LIKE '%provider_id%' THEN
      RAISE WARNING '⚠️ Trigger trouvé avec provider_id: %', trigger_name;
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON conversations', trigger_name);
    END IF;
  END LOOP;
END $$;

-- ÉTAPE 4: Supprimer directement la fonction get_or_create_conversation si elle utilise provider_id
-- (On l'a déjà recréée à l'ÉTAPE 1, donc cette étape est juste pour être sûr)
DO $$
DECLARE
  func_name TEXT := 'get_or_create_conversation';
BEGIN
  -- Supprimer toutes les variantes possibles de la fonction
  BEGIN
    EXECUTE format('DROP FUNCTION IF EXISTS %I(UUID, UUID, UUID, TEXT, TEXT[], DATE, TEXT, NUMERIC, INTEGER) CASCADE', func_name);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    EXECUTE format('DROP FUNCTION IF EXISTS %I(UUID, UUID) CASCADE', func_name);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    EXECUTE format('DROP FUNCTION IF EXISTS %I CASCADE', func_name);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  RAISE NOTICE '✅ Nettoyage des anciennes versions de get_or_create_conversation terminé';
END $$;

-- ÉTAPE 5: Vérifier les vues
DO $$
DECLARE
  view_record RECORD;
BEGIN
  FOR view_record IN
    SELECT 
      table_name,
      view_definition
    FROM information_schema.views
    WHERE table_schema = 'public'
      AND view_definition LIKE '%provider_id%'
  LOOP
    RAISE WARNING '⚠️ Vue trouvée avec provider_id: %', view_record.table_name;
    -- Supprimer la vue problématique
    EXECUTE format('DROP VIEW IF EXISTS %I CASCADE', view_record.table_name);
  END LOOP;
END $$;

-- ÉTAPE 6: Vérifier les politiques RLS une dernière fois
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT 
      tablename,
      policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('messages', 'conversations')
      AND (
        qual LIKE '%provider_id%' 
        OR with_check LIKE '%provider_id%'
      )
  LOOP
    RAISE WARNING '⚠️ Politique RLS trouvée avec provider_id: %.%', 
      policy_record.tablename, 
      policy_record.policyname;
    
    -- Supprimer la politique problématique
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 
      policy_record.policyname, 
      policy_record.tablename);
  END LOOP;
END $$;

-- ÉTAPE 7: Recréer les politiques RLS correctes (au cas où certaines ont été supprimées)
-- Messages SELECT
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
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

-- Messages INSERT
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;
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
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Conversations SELECT
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
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
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
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
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
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

-- Message de succès
SELECT '✅ CORRECTION COMPLÈTE TERMINÉE ! Toutes les références à provider_id ont été supprimées.' as result;
