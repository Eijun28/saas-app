-- Migration: Création de la table cultures avec RLS (VERSION CORRIGÉE)
-- Date: 2026-01-21
-- Description: Table de référence pour les cultures (publique en lecture seule)

-- ============================================
-- NETTOYAGE : Supprimer la table existante
-- ============================================

-- Supprimer d'abord les dépendances dans couple_preferences si elles existent
ALTER TABLE IF EXISTS public.couple_preferences
  DROP CONSTRAINT IF EXISTS couple_preferences_primary_culture_id_fkey;

-- Supprimer la table cultures existante
DROP TABLE IF EXISTS public.cultures CASCADE;

-- ============================================
-- TABLE: cultures
-- ============================================

CREATE TABLE public.cultures (
  -- Identifiant (utilise les mêmes IDs que dans lib/constants/cultures.ts)
  id TEXT PRIMARY KEY,

  -- Label affiché
  label TEXT NOT NULL,

  -- Métadonnées
  description TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX idx_cultures_label ON public.cultures(label);

-- ============================================
-- DONNÉES INITIALES
-- ============================================

INSERT INTO public.cultures (id, label, description) VALUES
  ('maghrebin', 'Maghrébin', 'Cultures du Maghreb'),
  ('indien', 'Indien', 'Culture indienne'),
  ('pakistanais', 'Pakistanais', 'Culture pakistanaise'),
  ('antillais', 'Antillais', 'Cultures antillaises'),
  ('africain', 'Africain', 'Cultures africaines'),
  ('asiatique', 'Asiatique', 'Cultures asiatiques'),
  ('europeen', 'Européen', 'Cultures européennes'),
  ('turc', 'Turc', 'Culture turque'),
  ('libanais', 'Libanais', 'Culture libanaise'),
  ('mixte', 'Mixte/Multiculturel', 'Mariage mixte ou multiculturel');

-- ============================================
-- TRIGGER pour updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_cultures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cultures_updated_at_trigger
  BEFORE UPDATE ON public.cultures
  FOR EACH ROW
  EXECUTE FUNCTION update_cultures_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur la table cultures
ALTER TABLE public.cultures ENABLE ROW LEVEL SECURITY;

-- Policy 1: Tous les utilisateurs authentifiés peuvent LIRE les cultures
CREATE POLICY "Authenticated users can read cultures"
  ON public.cultures
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy 2: Seul le service_role peut INSÉRER de nouvelles cultures
CREATE POLICY "Service role can insert cultures"
  ON public.cultures
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Policy 3: Seul le service_role peut MODIFIER les cultures
CREATE POLICY "Service role can update cultures"
  ON public.cultures
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Policy 4: Seul le service_role peut SUPPRIMER des cultures
CREATE POLICY "Service role can delete cultures"
  ON public.cultures
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE public.cultures IS 'Table de référence pour les cultures - publique en lecture seule pour les utilisateurs';
COMMENT ON COLUMN public.cultures.id IS 'Identifiant unique de la culture (slug)';
COMMENT ON COLUMN public.cultures.label IS 'Label affiché pour la culture';
COMMENT ON COLUMN public.cultures.description IS 'Description optionnelle de la culture';
