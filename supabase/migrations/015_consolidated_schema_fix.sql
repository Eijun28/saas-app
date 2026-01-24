-- ============================================
-- Migration consolidée : Uniformisation du schéma selon le schéma fourni
-- Date: 2025-01-13
-- Description: 
--   1. Uniformise les noms de colonnes (prestataire_id partout)
--   2. Corrige les références de clés étrangères
--   3. Consolide toutes les politiques RLS
--   4. Supprime les tables obsolètes si elles existent
-- ============================================

-- ============================================
-- PARTIE 1: Uniformiser les noms de colonnes
-- ============================================

-- Conversations : Renommer provider_id en prestataire_id si nécessaire
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE conversations RENAME COLUMN provider_id TO prestataire_id;
    RAISE NOTICE 'Colonne provider_id renommée en prestataire_id dans conversations';
  END IF;
END $$;

-- Demandes : Renommer provider_id en prestataire_id si nécessaire
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'demandes' 
    AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE demandes RENAME COLUMN provider_id TO prestataire_id;
    RAISE NOTICE 'Colonne provider_id renommée en prestataire_id dans demandes';
  END IF;
END $$;

-- Devis : Renommer provider_id en prestataire_id si nécessaire
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'devis' 
    AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE devis RENAME COLUMN provider_id TO prestataire_id;
    RAISE NOTICE 'Colonne provider_id renommée en prestataire_id dans devis';
  END IF;
END $$;

-- ============================================
-- PARTIE 2: Corriger les références de clés étrangères
-- ============================================

-- Budget_items : Corriger la référence couple_id pour pointer vers couples(id) au lieu de auth.users(id)
DO $$
BEGIN
  -- Vérifier si la contrainte actuelle référence auth.users
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'budget_items'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'auth.users'
  ) THEN
    -- Supprimer l'ancienne contrainte
    ALTER TABLE budget_items DROP CONSTRAINT IF EXISTS budget_items_couple_id_fkey;
    -- Ajouter la nouvelle contrainte vers couples
    ALTER TABLE budget_items 
      ADD CONSTRAINT budget_items_couple_id_fkey 
      FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE;
    RAISE NOTICE 'Référence budget_items.couple_id corrigée pour pointer vers couples(id)';
  END IF;
END $$;

-- Demandes : S'assurer que couple_id référence couples(id) et prestataire_id référence profiles(id)
DO $$
BEGIN
  -- Vérifier et corriger couple_id
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'demandes'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.column_name = 'couple_id'
    AND ccu.table_name = 'profiles'
  ) THEN
    ALTER TABLE demandes DROP CONSTRAINT IF EXISTS fk_demandes_couple;
    ALTER TABLE demandes 
      ADD CONSTRAINT fk_demandes_couple 
      FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE;
    RAISE NOTICE 'Référence demandes.couple_id corrigée pour pointer vers couples(id)';
  END IF;
  
  -- Vérifier et corriger prestataire_id (ou provider_id)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'demandes'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND (ccu.column_name = 'prestataire_id' OR ccu.column_name = 'provider_id')
    AND ccu.table_name = 'profiles'
  ) THEN
    ALTER TABLE demandes DROP CONSTRAINT IF EXISTS fk_demandes_provider;
    ALTER TABLE demandes DROP CONSTRAINT IF EXISTS fk_demandes_prestataire;
    ALTER TABLE demandes 
      ADD CONSTRAINT fk_demandes_provider 
      FOREIGN KEY (prestataire_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Référence demandes.prestataire_id vérifiée';
  END IF;
END $$;

-- Conversations : S'assurer que couple_id référence couples(id) et prestataire_id référence profiles(id)
DO $$
BEGIN
  -- Vérifier et corriger couple_id
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'conversations'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.column_name = 'couple_id'
    AND ccu.table_name = 'profiles'
  ) THEN
    ALTER TABLE conversations DROP CONSTRAINT IF EXISTS fk_conversations_couple;
    ALTER TABLE conversations 
      ADD CONSTRAINT fk_conversations_couple 
      FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE;
    RAISE NOTICE 'Référence conversations.couple_id corrigée pour pointer vers couples(id)';
  END IF;
  
  -- Vérifier et corriger prestataire_id
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'conversations'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND (ccu.column_name = 'prestataire_id' OR ccu.column_name = 'provider_id')
    AND ccu.table_name = 'profiles'
  ) THEN
    ALTER TABLE conversations DROP CONSTRAINT IF EXISTS fk_conversations_provider;
    ALTER TABLE conversations 
      ADD CONSTRAINT fk_conversations_provider 
      FOREIGN KEY (prestataire_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Référence conversations.prestataire_id vérifiée';
  END IF;
END $$;

-- ============================================
-- PARTIE 3: Ajouter les colonnes manquantes selon le schéma fourni
-- ============================================

-- Profiles : Ajouter les colonnes manquantes
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_path TEXT,
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS early_adopter_enrolled_at TIMESTAMPTZ;

-- Conversations : Ajouter les colonnes manquantes
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status = ANY (ARRAY['active'::text, 'archived'::text])),
  ADD COLUMN IF NOT EXISTS unread_count_couple INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unread_count_provider INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT now();

-- Messages : Ajouter read_at si nécessaire (remplace is_read)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'is_read'
  ) THEN
    -- Migrer les données de is_read vers read_at
    UPDATE messages SET read_at = created_at WHERE is_read = TRUE AND read_at IS NULL;
    -- Supprimer is_read après migration (on garde read_at selon le schéma)
    ALTER TABLE messages DROP COLUMN IF EXISTS is_read;
    RAISE NOTICE 'Colonne is_read migrée vers read_at dans messages';
  END IF;
END $$;

-- Demandes : Ajouter les colonnes manquantes
ALTER TABLE demandes
  ADD COLUMN IF NOT EXISTS service_type TEXT,
  ADD COLUMN IF NOT EXISTS wedding_date DATE,
  ADD COLUMN IF NOT EXISTS guest_count INTEGER,
  ADD COLUMN IF NOT EXISTS budget_indicatif NUMERIC,
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Devis : Ajouter les colonnes manquantes
ALTER TABLE devis
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS included_services TEXT[],
  ADD COLUMN IF NOT EXISTS excluded_services TEXT[],
  ADD COLUMN IF NOT EXISTS conditions TEXT,
  ADD COLUMN IF NOT EXISTS valid_until DATE,
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- ============================================
-- PARTIE 4: Consolider toutes les politiques RLS
-- ============================================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view prestataire profiles" ON profiles;
DROP POLICY IF EXISTS "Couples can view prestataire profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Politique simple : Tous les utilisateurs authentifiés peuvent voir tous les profils
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Politiques de mise à jour et insertion
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- COUPLES
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own couple" ON couples;
DROP POLICY IF EXISTS "Users can update own couple" ON couples;
DROP POLICY IF EXISTS "Users can insert own couple" ON couples;
DROP POLICY IF EXISTS "Users can delete own couple" ON couples;

CREATE POLICY "Users can view own couple"
  ON couples FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own couple"
  ON couples FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own couple"
  ON couples FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own couple"
  ON couples FOR DELETE
  USING (auth.uid() = user_id);

-- COUPLE_PREFERENCES
ALTER TABLE couple_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON couple_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON couple_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON couple_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON couple_preferences;
DROP POLICY IF EXISTS "Users can manage own preferences" ON couple_preferences;

CREATE POLICY "Users can manage own preferences"
  ON couple_preferences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = couple_preferences.couple_id
      AND couples.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = couple_preferences.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- BUDGET_ITEMS
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can insert own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can update own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can delete own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can manage own budget items" ON budget_items;

CREATE POLICY "Users can manage own budget items"
  ON budget_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = budget_items.couple_id
      AND couples.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = budget_items.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- TIMELINE_EVENTS
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own timeline events" ON timeline_events;
DROP POLICY IF EXISTS "Users can insert own timeline events" ON timeline_events;
DROP POLICY IF EXISTS "Users can update own timeline events" ON timeline_events;
DROP POLICY IF EXISTS "Users can delete own timeline events" ON timeline_events;
DROP POLICY IF EXISTS "Users can manage own timeline events" ON timeline_events;

CREATE POLICY "Users can manage own timeline events"
  ON timeline_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = timeline_events.couple_id
      AND couples.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = timeline_events.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- DEMANDES
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couples can view own demandes" ON demandes;
DROP POLICY IF EXISTS "Prestataires can view demandes" ON demandes;
DROP POLICY IF EXISTS "Couples can create demandes" ON demandes;
DROP POLICY IF EXISTS "Prestataires can update demandes" ON demandes;

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
  USING (auth.uid() = prestataire_id);

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
  USING (auth.uid() = prestataire_id);

-- CONVERSATIONS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = conversations.couple_id
      AND couples.user_id = auth.uid()
    )
    OR auth.uid() = prestataire_id
  );

CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = conversations.couple_id
      AND couples.user_id = auth.uid()
    )
    OR auth.uid() = prestataire_id
  );

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = conversations.couple_id
      AND couples.user_id = auth.uid()
    )
    OR auth.uid() = prestataire_id
  );

-- MESSAGES
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;

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

-- FAVORIS
ALTER TABLE favoris ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own favoris" ON favoris;

CREATE POLICY "Users can manage own favoris"
  ON favoris
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = favoris.couple_id
      AND couples.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = favoris.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- DEVIS
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couples can view own devis" ON devis;
DROP POLICY IF EXISTS "Prestataires can view own devis" ON devis;
DROP POLICY IF EXISTS "Couples can update own devis" ON devis;
DROP POLICY IF EXISTS "Prestataires can create devis" ON devis;

CREATE POLICY "Couples can view own devis"
  ON devis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = devis.couple_id
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Prestataires can view own devis"
  ON devis FOR SELECT
  USING (auth.uid() = prestataire_id);

CREATE POLICY "Couples can update own devis"
  ON devis FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = devis.couple_id
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Prestataires can create devis"
  ON devis FOR INSERT
  WITH CHECK (auth.uid() = prestataire_id);

-- PROVIDER_CULTURES, PROVIDER_ZONES, PROVIDER_PORTFOLIO
DO $$
BEGIN
  -- provider_cultures
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_cultures') THEN
    ALTER TABLE provider_cultures ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Couples can view prestataire cultures" ON provider_cultures;
    CREATE POLICY "Authenticated users can view prestataire cultures"
      ON provider_cultures FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;

  -- provider_zones
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_zones') THEN
    ALTER TABLE provider_zones ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Couples can view prestataire zones" ON provider_zones;
    CREATE POLICY "Authenticated users can view prestataire zones"
      ON provider_zones FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;

  -- provider_portfolio
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_portfolio') THEN
    ALTER TABLE provider_portfolio ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Couples can view prestataire portfolio" ON provider_portfolio;
    CREATE POLICY "Authenticated users can view prestataire portfolio"
      ON provider_portfolio FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- EVENEMENTS_PRESTATAIRE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evenements_prestataire') THEN
    ALTER TABLE evenements_prestataire ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Prestataires can view own events" ON evenements_prestataire;
    DROP POLICY IF EXISTS "Prestataires can insert own events" ON evenements_prestataire;
    DROP POLICY IF EXISTS "Prestataires can update own events" ON evenements_prestataire;
    DROP POLICY IF EXISTS "Prestataires can delete own events" ON evenements_prestataire;
    
    CREATE POLICY "Prestataires can manage own events"
      ON evenements_prestataire
      FOR ALL
      USING (auth.uid() = prestataire_id)
      WITH CHECK (auth.uid() = prestataire_id);
  END IF;
END $$;

-- ============================================
-- PARTIE 5: Index manquants
-- ============================================

-- Index pour améliorer les performances des recherches
CREATE INDEX IF NOT EXISTS idx_conversations_prestataire ON conversations(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_conversations_couple ON conversations(couple_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_demandes_prestataire ON demandes(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_demandes_status ON demandes(status);
CREATE INDEX IF NOT EXISTS idx_devis_prestataire ON devis(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_devis_status ON devis(status);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at) WHERE read_at IS NULL;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
