-- Migration: Add SIRET field to profiles table for providers
-- This allows providers to store their SIRET number directly in their profile

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS siret TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN profiles.siret IS 'Numéro SIRET du prestataire (14 chiffres)';

-- Add a check constraint to ensure SIRET is either null or 14 digits
ALTER TABLE profiles ADD CONSTRAINT profiles_siret_format
  CHECK (siret IS NULL OR siret ~ '^\d{14}$');
