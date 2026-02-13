-- ============================================
-- MIGRATION: Update plan_type values
-- ============================================
-- Aligns plan_type with the validated pricing grid:
--   free    → discovery (0€/mois)
--   pro     → pro (59€/mois) — unchanged
--   premium → expert (109€/mois)
--
-- This migration is safe to run whether or not the table exists.
-- If the table was just created with migration 011 (updated), it already
-- has the correct constraint and this is a no-op.
-- ============================================

DO $$
BEGIN
  -- Only run if the subscriptions table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN

    -- Drop the old constraint if it exists
    ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

    -- Migrate any existing data with old plan names
    UPDATE subscriptions SET plan_type = 'discovery' WHERE plan_type = 'free';
    UPDATE subscriptions SET plan_type = 'expert' WHERE plan_type = 'premium';

    -- Add the new constraint
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_type_check
      CHECK (plan_type IN ('discovery', 'pro', 'expert'));

  END IF;
END $$;
