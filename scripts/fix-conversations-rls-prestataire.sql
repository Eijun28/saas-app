-- ============================================
-- CORRECTION : Politiques RLS pour conversations côté prestataire
-- ============================================

-- ÉTAPE 1: Vérifier que la colonne prestataire_id existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'prestataire_id'
  ) THEN
    -- Si prestataire_id n'existe pas mais provider_id existe, renommer
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'conversations' 
      AND column_name = 'provider_id'
    ) THEN
      ALTER TABLE conversations RENAME COLUMN provider_id TO prestataire_id;
      RAISE NOTICE '✅ Colonne provider_id renommée en prestataire_id';
    ELSE
      RAISE EXCEPTION '❌ Ni prestataire_id ni provider_id n''existent dans conversations';
    END IF;
  ELSE
    RAISE NOTICE '✅ La colonne prestataire_id existe déjà';
  END IF;
END $$;

-- ÉTAPE 2: Activer RLS sur conversations si ce n'est pas déjà fait
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 3: Supprimer les anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Prestataires can view conversations" ON conversations;
DROP POLICY IF EXISTS "Couples can view conversations" ON conversations;

-- ÉTAPE 4: Recréer les politiques RLS avec prestataire_id

-- Politique SELECT : Les prestataires peuvent voir leurs conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    -- Si l'utilisateur est un couple (via couples.user_id)
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = conversations.couple_id
      AND couples.user_id = auth.uid()
    )
    -- OU si l'utilisateur est le prestataire (via conversations.prestataire_id)
    OR conversations.prestataire_id = auth.uid()
  );

-- Politique INSERT : Les utilisateurs peuvent créer leurs conversations
CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    -- Si l'utilisateur est un couple
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = conversations.couple_id
      AND couples.user_id = auth.uid()
    )
    -- OU si l'utilisateur est le prestataire
    OR conversations.prestataire_id = auth.uid()
  );

-- Politique UPDATE : Les utilisateurs peuvent mettre à jour leurs conversations
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (
    -- Si l'utilisateur est un couple
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = conversations.couple_id
      AND couples.user_id = auth.uid()
    )
    -- OU si l'utilisateur est le prestataire
    OR conversations.prestataire_id = auth.uid()
  )
  WITH CHECK (
    -- Même condition pour WITH CHECK
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = conversations.couple_id
      AND couples.user_id = auth.uid()
    )
    OR conversations.prestataire_id = auth.uid()
  );

-- ÉTAPE 5: Vérifier que les politiques sont bien créées
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'conversations';
  
  IF policy_count < 3 THEN
    RAISE WARNING '⚠️ Seulement % politiques créées pour conversations (attendu: 3)', policy_count;
  ELSE
    RAISE NOTICE '✅ % politiques RLS créées pour conversations', policy_count;
  END IF;
END $$;

-- ÉTAPE 6: Vérifier qu'il n'y a pas de références à provider_id dans les politiques
DO $$
DECLARE
  policy_def TEXT;
  has_provider_id BOOLEAN := FALSE;
BEGIN
  -- Vérifier toutes les politiques
  FOR policy_def IN
    SELECT pg_get_expr(polqual, polrelid) || ' ' || COALESCE(pg_get_expr(polwithcheck, polrelid), '')
    FROM pg_policy
    WHERE polrelid = 'conversations'::regclass
  LOOP
    IF policy_def LIKE '%provider_id%' THEN
      has_provider_id := TRUE;
      RAISE WARNING '⚠️ ATTENTION : Une politique contient encore provider_id: %', policy_def;
    END IF;
  END LOOP;
  
  IF NOT has_provider_id THEN
    RAISE NOTICE '✅ Aucune référence à provider_id dans les politiques RLS';
  END IF;
END $$;

-- ============================================
-- FIN DE LA CORRECTION
-- ============================================

SELECT '✅ CORRECTION TERMINÉE ! Les politiques RLS pour conversations utilisent maintenant prestataire_id.' as result;
