-- ============================================
-- MIGRATION: Update plan_type values
-- ============================================
-- Aligns plan_type with the validated pricing grid:
--   free    → discovery (0€/mois)
--   pro     → pro (59€/mois) — unchanged
--   premium → expert (109€/mois)
-- ============================================

-- Step 1: Drop the existing constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

-- Step 2: Update existing data
UPDATE subscriptions SET plan_type = 'discovery' WHERE plan_type = 'free';
UPDATE subscriptions SET plan_type = 'expert' WHERE plan_type = 'premium';

-- Step 3: Add the new constraint
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_type_check
  CHECK (plan_type IN ('discovery', 'pro', 'expert'));
