-- Migration: Vérifier et créer la table couple_profiles si nécessaire
-- Ce script doit être exécuté dans Supabase SQL Editor si la table n'existe pas

-- 1. Vérifier si la table existe et la créer si nécessaire
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

-- 2. Ajouter les colonnes si elles n'existent pas déjà
DO $$ 
BEGIN
    -- Vérifier et ajouter chaque colonne individuellement
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couple_profiles' AND column_name = 'ville_marriage') THEN
        ALTER TABLE couple_profiles ADD COLUMN ville_marriage TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couple_profiles' AND column_name = 'date_marriage') THEN
        ALTER TABLE couple_profiles ADD COLUMN date_marriage DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couple_profiles' AND column_name = 'budget_min') THEN
        ALTER TABLE couple_profiles ADD COLUMN budget_min NUMERIC(10, 2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couple_profiles' AND column_name = 'budget_max') THEN
        ALTER TABLE couple_profiles ADD COLUMN budget_max NUMERIC(10, 2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couple_profiles' AND column_name = 'culture') THEN
        ALTER TABLE couple_profiles ADD COLUMN culture TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couple_profiles' AND column_name = 'prestataires_recherches') THEN
        ALTER TABLE couple_profiles ADD COLUMN prestataires_recherches TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couple_profiles' AND column_name = 'created_at') THEN
        ALTER TABLE couple_profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couple_profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE couple_profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Activer RLS si ce n'est pas déjà fait
ALTER TABLE couple_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Créer ou remplacer les politiques RLS
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

-- 5. Créer l'index si nécessaire
CREATE INDEX IF NOT EXISTS idx_couple_user_id ON couple_profiles(user_id);

-- 6. Créer le trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_couple_profiles_updated_at ON couple_profiles;
CREATE TRIGGER update_couple_profiles_updated_at
  BEFORE UPDATE ON couple_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Vérifier que la table profiles existe (nécessaire pour la foreign key)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('couple', 'prestataire')) DEFAULT NULL,
  prenom TEXT,
  nom TEXT,
  telephone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Table couple_profiles créée/vérifiée avec succès!';
END $$;

