-- Migration 075: Add forfait_items to provider_pricing
-- Permet aux prestataires de lister les prestations incluses dans un forfait

ALTER TABLE provider_pricing
  ADD COLUMN IF NOT EXISTS forfait_items TEXT[] DEFAULT NULL;

COMMENT ON COLUMN provider_pricing.forfait_items IS
  'Liste des prestations incluses dans ce forfait (uniquement pour pricing_unit = ''forfait'')';
