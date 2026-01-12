-- ============================================
-- Migration: Ajout des colonnes prestataires à profiles
-- Date: 2024-12
-- Description: Ajoute les colonnes nécessaires pour les prestataires dans la table profiles
-- ============================================

-- Ajouter les colonnes pour les prestataires dans la table profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS nom_entreprise TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS description_courte TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS budget_min NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS budget_max NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS ville_principale TEXT,
  ADD COLUMN IF NOT EXISTS annees_experience INTEGER,
  ADD COLUMN IF NOT EXISTS service_type TEXT,
  ADD COLUMN IF NOT EXISTS is_early_adopter BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS early_adopter_trial_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS early_adopter_notified BOOLEAN DEFAULT FALSE;

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN profiles.nom_entreprise IS 'Nom de l''entreprise du prestataire';
COMMENT ON COLUMN profiles.avatar_url IS 'URL de la photo de profil';
COMMENT ON COLUMN profiles.description_courte IS 'Description courte du prestataire (max 150 caractères)';
COMMENT ON COLUMN profiles.bio IS 'Biographie complète du prestataire';
COMMENT ON COLUMN profiles.budget_min IS 'Budget minimum proposé par le prestataire';
COMMENT ON COLUMN profiles.budget_max IS 'Budget maximum proposé par le prestataire';
COMMENT ON COLUMN profiles.ville_principale IS 'Ville principale d''intervention du prestataire';
COMMENT ON COLUMN profiles.annees_experience IS 'Nombre d''années d''expérience du prestataire';
COMMENT ON COLUMN profiles.service_type IS 'Type de service proposé par le prestataire';
COMMENT ON COLUMN profiles.is_early_adopter IS 'Indique si le prestataire est un early adopter';
COMMENT ON COLUMN profiles.early_adopter_trial_end_date IS 'Date de fin de la période d''essai pour les early adopters';
COMMENT ON COLUMN profiles.early_adopter_notified IS 'Indique si l''early adopter a été notifié de la fin de sa période d''essai';

-- Créer des index pour améliorer les performances des recherches
CREATE INDEX IF NOT EXISTS idx_profiles_nom_entreprise ON profiles(nom_entreprise) WHERE nom_entreprise IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_service_type ON profiles(service_type) WHERE service_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_ville_principale ON profiles(ville_principale) WHERE ville_principale IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_budget_range ON profiles(budget_min, budget_max) WHERE budget_min IS NOT NULL AND budget_max IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_early_adopter ON profiles(is_early_adopter) WHERE is_early_adopter = TRUE;
