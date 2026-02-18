-- =============================================
-- Migration 066: Fix onboarding_completed column
-- Problem: rename_onboarding_to_inscription.sql renamed the column to
--          inscription_completee, but ALL application code references
--          onboarding_completed → causes PostgREST PGRST204 error
-- Fix: Rename back to onboarding_completed and ensure all required columns exist
-- =============================================

-- 1. Rename inscription_completee back to onboarding_completed if it was renamed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'inscription_completee'
  ) THEN
    ALTER TABLE public.profiles
      RENAME COLUMN inscription_completee TO onboarding_completed;
  END IF;

  -- If onboarding_completed doesn't exist at all, create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  -- Ensure onboarding_completed_at exists (used in onboarding step 4)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'onboarding_completed_at'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
  END IF;

  -- Ensure onboarding_step exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'onboarding_step'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN onboarding_step INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 2. Fix indexes
DROP INDEX IF EXISTS idx_profiles_inscription;
DROP INDEX IF EXISTS idx_profiles_onboarding;
CREATE INDEX idx_profiles_onboarding ON public.profiles(onboarding_completed);

-- 3. Reload PostgREST schema cache so the column is immediately available
NOTIFY pgrst, 'reload schema';
