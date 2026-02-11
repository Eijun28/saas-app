-- Migration 055: Add expertise_level to provider_cultures + onboarding_step to profiles
-- This migration supports the new guided onboarding flow for prestataires

-- 1. Add expertise_level column to provider_cultures
-- Values: 'specialise' (deep knowledge) or 'experimente' (has worked with)
ALTER TABLE provider_cultures
  ADD COLUMN IF NOT EXISTS expertise_level TEXT NOT NULL DEFAULT 'experimente';

-- Add check constraint for valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'provider_cultures_expertise_level_check'
  ) THEN
    ALTER TABLE provider_cultures
      ADD CONSTRAINT provider_cultures_expertise_level_check
      CHECK (expertise_level IN ('specialise', 'experimente'));
  END IF;
END $$;

-- 2. Add onboarding_step to profiles to track guided onboarding progress
-- 0 = not started, 1-4 = in progress, 5 = completed
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER NOT NULL DEFAULT 0;

-- Index for fast lookup of providers who haven't completed onboarding
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_step
  ON profiles(onboarding_step) WHERE role = 'prestataire';

-- 3. Mark existing prestataires with data as having completed onboarding
-- (so they don't get blocked by the new flow)
UPDATE profiles
SET onboarding_step = 5
WHERE role = 'prestataire'
  AND onboarding_step = 0
  AND service_type IS NOT NULL;

-- Also mark any prestataire who already has cultures or zones as completed
UPDATE profiles
SET onboarding_step = 5
WHERE role = 'prestataire'
  AND onboarding_step = 0
  AND id IN (
    SELECT DISTINCT profile_id FROM provider_cultures
    UNION
    SELECT DISTINCT profile_id FROM provider_zones
  );
