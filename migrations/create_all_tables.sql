-- ============================================
-- Script SQL consolidé pour créer toutes les tables nécessaires
-- Exécutez ce script dans Supabase SQL Editor
-- ============================================

-- 1. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Créer la table profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('couple', 'prestataire')) DEFAULT NULL,
  prenom TEXT,
  nom TEXT,
  telephone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter les colonnes si elles n'existent pas déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'telephone') THEN
        ALTER TABLE profiles ADD COLUMN telephone TEXT;
    END IF;
END $$;

-- 3. Créer la table couple_profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS couple_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  ville_marriage TEXT,
  date_marriage DATE,
  budget_min NUMERIC(10, 2),
  budget_max NUMERIC(10, 2),
  culture TEXT,
  prestataires_recherches TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter les colonnes si elles n'existent pas déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couple_profiles' AND column_name = 'date_marriage') THEN
        ALTER TABLE couple_profiles ADD COLUMN date_marriage DATE;
    END IF;
END $$;

-- 4. Créer la table budget_items
CREATE TABLE IF NOT EXISTS budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Créer la table timeline_events
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- 7. Politiques RLS pour couple_profiles
DROP POLICY IF EXISTS "Users can view own couple profile" ON couple_profiles;
CREATE POLICY "Users can view own couple profile"
  ON couple_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own couple profile" ON couple_profiles;
CREATE POLICY "Users can update own couple profile"
  ON couple_profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own couple profile" ON couple_profiles;
CREATE POLICY "Users can insert own couple profile"
  ON couple_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 8. Politiques RLS pour budget_items
DROP POLICY IF EXISTS "Users can view own budget items" ON budget_items;
CREATE POLICY "Users can view own budget items"
  ON budget_items FOR SELECT
  USING (auth.uid() = couple_id);

DROP POLICY IF EXISTS "Users can insert own budget items" ON budget_items;
CREATE POLICY "Users can insert own budget items"
  ON budget_items FOR INSERT
  WITH CHECK (auth.uid() = couple_id);

DROP POLICY IF EXISTS "Users can update own budget items" ON budget_items;
CREATE POLICY "Users can update own budget items"
  ON budget_items FOR UPDATE
  USING (auth.uid() = couple_id);

DROP POLICY IF EXISTS "Users can delete own budget items" ON budget_items;
CREATE POLICY "Users can delete own budget items"
  ON budget_items FOR DELETE
  USING (auth.uid() = couple_id);

-- 9. Politiques RLS pour timeline_events
DROP POLICY IF EXISTS "Users can view own timeline events" ON timeline_events;
CREATE POLICY "Users can view own timeline events"
  ON timeline_events FOR SELECT
  USING (auth.uid() = couple_id);

DROP POLICY IF EXISTS "Users can insert own timeline events" ON timeline_events;
CREATE POLICY "Users can insert own timeline events"
  ON timeline_events FOR INSERT
  WITH CHECK (auth.uid() = couple_id);

DROP POLICY IF EXISTS "Users can update own timeline events" ON timeline_events;
CREATE POLICY "Users can update own timeline events"
  ON timeline_events FOR UPDATE
  USING (auth.uid() = couple_id);

DROP POLICY IF EXISTS "Users can delete own timeline events" ON timeline_events;
CREATE POLICY "Users can delete own timeline events"
  ON timeline_events FOR DELETE
  USING (auth.uid() = couple_id);

-- 10. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_budget_items_couple ON budget_items(couple_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category ON budget_items(category);
CREATE INDEX IF NOT EXISTS idx_timeline_events_couple ON timeline_events(couple_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON timeline_events(event_date);
CREATE INDEX IF NOT EXISTS idx_couple_user_id ON couple_profiles(user_id);

-- 11. Triggers pour updated_at
DROP TRIGGER IF EXISTS update_budget_items_updated_at ON budget_items;
CREATE TRIGGER update_budget_items_updated_at
  BEFORE UPDATE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_timeline_events_updated_at ON timeline_events;
CREATE TRIGGER update_timeline_events_updated_at
  BEFORE UPDATE ON timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_couple_profiles_updated_at ON couple_profiles;
CREATE TRIGGER update_couple_profiles_updated_at
  BEFORE UPDATE ON couple_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 12. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Toutes les tables ont été créées avec succès!';
    RAISE NOTICE '- profiles';
    RAISE NOTICE '- couple_profiles';
    RAISE NOTICE '- budget_items';
    RAISE NOTICE '- timeline_events';
END $$;

