-- Migration: Mise à jour des colonnes culture dans couple_preferences
-- Date: 2026-01-21
-- Description: Conversion des colonnes UUID en TEXT pour correspondre à la table cultures

-- ============================================
-- MODIFICATION couple_preferences
-- ============================================

-- Étape 1: Supprimer les colonnes UUID existantes
ALTER TABLE public.couple_preferences
  DROP COLUMN IF EXISTS primary_culture_id,
  DROP COLUMN IF EXISTS secondary_culture_ids;

-- Étape 2: Ajouter les nouvelles colonnes TEXT
ALTER TABLE public.couple_preferences
  ADD COLUMN primary_culture_id TEXT REFERENCES public.cultures(id) ON DELETE SET NULL,
  ADD COLUMN secondary_culture_ids TEXT[] DEFAULT '{}';

-- Étape 3: Recréer les index
CREATE INDEX IF NOT EXISTS idx_couple_preferences_primary_culture
  ON public.couple_preferences(primary_culture_id);

CREATE INDEX IF NOT EXISTS idx_couple_preferences_secondary_cultures
  ON public.couple_preferences USING GIN(secondary_culture_ids);

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON COLUMN public.couple_preferences.primary_culture_id IS 'Culture principale du couple (référence à cultures.id)';
COMMENT ON COLUMN public.couple_preferences.secondary_culture_ids IS 'Cultures secondaires du couple (array de cultures.id)';
