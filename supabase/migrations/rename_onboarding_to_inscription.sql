-- Migration: NEUTRALIZED - This rename broke the signup flow
-- The application code uses onboarding_completed everywhere.
-- Reverted by migration 066_fix_onboarding_completed_column.sql
-- Original: ALTER TABLE profiles RENAME COLUMN onboarding_completed TO inscription_completee;

-- NO-OP: Do nothing
SELECT 1;
