-- Migration: Renommer onboarding_completed en inscription_completee
-- Date: 2024

-- Renommer la colonne dans la table profiles
ALTER TABLE profiles 
  RENAME COLUMN onboarding_completed TO inscription_completee;

-- Mettre à jour l'index si nécessaire
DROP INDEX IF EXISTS idx_profiles_onboarding;
CREATE INDEX idx_profiles_inscription ON profiles(inscription_completee);

