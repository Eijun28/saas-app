-- Migration: add matching-relevant columns to profiles
-- Adds languages, guest capacity, and response_rate
-- so the scoring engine can actually use these criteria.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS guest_capacity_min INTEGER,
  ADD COLUMN IF NOT EXISTS guest_capacity_max INTEGER,
  ADD COLUMN IF NOT EXISTS response_rate NUMERIC(3,2) DEFAULT 0;

-- Index for language filtering (GIN index on array column)
CREATE INDEX IF NOT EXISTS idx_profiles_languages
  ON profiles USING GIN (languages);
