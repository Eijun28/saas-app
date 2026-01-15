-- ============================================
-- CORRECTION COMPLÈTE : Supprimer TOUTES les références à provider_id
-- À EXÉCUTER DANS SUPABASE SQL EDITOR
-- ============================================

-- ÉTAPE 1: Vérifier et corriger la fonction get_or_create_conversation
DO $$
BEGIN
  -- Supprimer l'ancienne fonction si elle existe
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
  
  -- Supprimer aussi avec prestataire_id si elle existe déjà
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
  
  RAISE NOTICE '✅ Anciennes fonctions get_or_create_conversation supprimées';
END $$;

-- ÉTAPE 2: Recréer la fonction avec prestataire_id
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

RAISE NOTICE '✅ Fonction get_or_create_conversation recréée avec prestataire_id';

-- ÉTAPE 3: Vérifier et corriger les triggers sur messages
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  -- Lister tous les triggers sur messages
  FOR trigger_record IN
    SELECT trigger_name, event_manipulation, event_object_table
    FROM information_schema.triggers
    WHERE event_object_table = 'messages'
  LOOP
    RAISE NOTICE 'Trigger trouvé: % sur %', trigger_record.trigger_name, trigger_record.event_object_table;
    
    -- Vérifier si le trigger utilise provider_id
    -- (On ne peut pas directement lire le code, mais on peut le recréer)
  END LOOP;
END $$;

-- ÉTAPE 4: Vérifier et corriger les triggers sur conversations
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  FOR trigger_record IN
    SELECT trigger_name, event_manipulation, event_object_table
    FROM information_schema.triggers
    WHERE event_object_table = 'conversations'
  LOOP
    RAISE NOTICE 'Trigger trouvé: % sur %', trigger_record.trigger_name, trigger_record.event_object_table;
  END LOOP;
END $$;

-- ÉTAPE 5: Vérifier toutes les fonctions qui pourraient utiliser provider_id
DO $$
DECLARE
  func_record RECORD;
  func_body TEXT;
BEGIN
  FOR func_record IN
    SELECT 
      p.proname as function_name,
      pg_get_functiondef(p.oid) as function_definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND pg_get_functiondef(p.oid) LIKE '%provider_id%'
  LOOP
    RAISE WARNING '⚠️ Fonction trouvée avec provider_id: %', func_record.function_name;
    RAISE NOTICE 'Définition: %', func_record.function_definition;
  END LOOP;
END $$;

-- ÉTAPE 6: Vérifier les vues qui pourraient utiliser provider_id
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
  END LOOP;
END $$;

-- ÉTAPE 7: Vérifier les politiques RLS une dernière fois
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT 
      tablename,
      policyname,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('messages', 'conversations')
      AND (
        qual LIKE '%provider_id%' 
        OR with_check LIKE '%provider_id%'
      )
  LOOP
    RAISE WARNING '⚠️ Politique RLS trouvée avec provider_id: %.%', policy_record.tablename, policy_record.policyname;
  END LOOP;
END $$;

-- Message de succès
SELECT '✅ Vérification terminée ! Vérifiez les warnings ci-dessus pour les fonctions/vues à corriger manuellement.' as result;
