-- ============================================
-- SQL Supabase pour la nouvelle inscription simplifiée
-- Crée toutes les tables nécessaires si elles n'existent pas
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter les colonnes si elles n'existent pas déjà
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prenom TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nom TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telephone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('couple', 'prestataire'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Supprimer onboarding_completed si elle existe (plus nécessaire)
ALTER TABLE profiles DROP COLUMN IF EXISTS onboarding_completed;

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
ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS ville_marriage TEXT;
ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS date_marriage DATE;
ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS budget_min NUMERIC(10, 2);
ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS budget_max NUMERIC(10, 2);
ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS culture TEXT;
ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS prestataires_recherches TEXT[] DEFAULT '{}';
ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Créer la table prestataire_profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS prestataire_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  nom_entreprise TEXT,
  type_prestation TEXT,
  ville_exercice TEXT,
  tarif_min NUMERIC(10, 2),
  tarif_max NUMERIC(10, 2),
  cultures_gerees TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter les colonnes si elles n'existent pas déjà
ALTER TABLE prestataire_profiles ADD COLUMN IF NOT EXISTS nom_entreprise TEXT;
ALTER TABLE prestataire_profiles ADD COLUMN IF NOT EXISTS type_prestation TEXT;
ALTER TABLE prestataire_profiles ADD COLUMN IF NOT EXISTS ville_exercice TEXT;
ALTER TABLE prestataire_profiles ADD COLUMN IF NOT EXISTS tarif_min NUMERIC(10, 2);
ALTER TABLE prestataire_profiles ADD COLUMN IF NOT EXISTS tarif_max NUMERIC(10, 2);
ALTER TABLE prestataire_profiles ADD COLUMN IF NOT EXISTS cultures_gerees TEXT[] DEFAULT '{}';
ALTER TABLE prestataire_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE prestataire_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Activer RLS sur les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestataire_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Politiques RLS pour couple_profiles
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

-- 7. Fonction trigger pour créer automatiquement le profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, prenom, nom, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::TEXT, 'couple'),
    COALESCE((NEW.raw_user_meta_data->>'prenom')::TEXT, ''),
    COALESCE((NEW.raw_user_meta_data->>'nom')::TEXT, ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = COALESCE((NEW.raw_user_meta_data->>'role')::TEXT, profiles.role),
    prenom = COALESCE((NEW.raw_user_meta_data->>'prenom')::TEXT, profiles.prenom),
    nom = COALESCE((NEW.raw_user_meta_data->>'nom')::TEXT, profiles.nom),
    updated_at = NOW();

  -- Si c'est un prestataire, créer aussi le profil prestataire
  IF (NEW.raw_user_meta_data->>'role')::TEXT = 'prestataire' THEN
    INSERT INTO public.prestataire_profiles (user_id, nom_entreprise, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE((NEW.raw_user_meta_data->>'nomEntreprise')::TEXT, ''),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      nom_entreprise = COALESCE((NEW.raw_user_meta_data->>'nomEntreprise')::TEXT, prestataire_profiles.nom_entreprise),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger pour exécuter la fonction lors de la création d'un utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 9. Politiques RLS pour profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 10. Politiques RLS pour prestataire_profiles
DROP POLICY IF EXISTS "Users can view own prestataire profile" ON prestataire_profiles;
CREATE POLICY "Users can view own prestataire profile"
  ON prestataire_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own prestataire profile" ON prestataire_profiles;
CREATE POLICY "Users can update own prestataire profile"
  ON prestataire_profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own prestataire profile" ON prestataire_profiles;
CREATE POLICY "Users can insert own prestataire profile"
  ON prestataire_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 11. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_couple_user_id ON couple_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_prestataire_user_id ON prestataire_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_prestataire_type ON prestataire_profiles(type_prestation);
CREATE INDEX IF NOT EXISTS idx_prestataire_ville ON prestataire_profiles(ville_exercice);

-- 12. Triggers pour updated_at
DROP TRIGGER IF EXISTS update_couple_profiles_updated_at ON couple_profiles;
CREATE TRIGGER update_couple_profiles_updated_at
  BEFORE UPDATE ON couple_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prestataire_profiles_updated_at ON prestataire_profiles;
CREATE TRIGGER update_prestataire_profiles_updated_at
  BEFORE UPDATE ON prestataire_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- 1. Ce script crée les tables si elles n'existent pas
-- 2. La fonction handle_new_user() crée automatiquement le profil lors de l'inscription
-- 3. Les données (role, prenom, nom, nomEntreprise) sont passées via raw_user_meta_data
-- 4. Le trigger s'exécute après l'insertion dans auth.users
-- 5. Les politiques RLS permettent aux utilisateurs de voir/modifier leur propre profil
-- 6. Plus besoin de onboarding_completed car l'inscription est directe
-- 7. ON CONFLICT permet de mettre à jour si le profil existe déjà
