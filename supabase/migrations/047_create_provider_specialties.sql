-- Migration: Create provider specialties system for ultra-personalization
-- This allows providers to specify detailed specialties based on their service type

-- Table for storing provider specialty selections
-- Each row represents a provider's selection within a specialty group
CREATE TABLE IF NOT EXISTS provider_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL, -- The service type this specialty belongs to (e.g., 'traiteur', 'photographe')
  group_id TEXT NOT NULL, -- The specialty group (e.g., 'type_cuisine', 'regimes')
  option_value TEXT NOT NULL, -- The selected option value (e.g., 'halal', 'gastronomique')
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique combinations
  UNIQUE(profile_id, service_type, group_id, option_value)
);

-- Index for faster lookups by profile
CREATE INDEX IF NOT EXISTS idx_provider_specialties_profile
ON provider_specialties(profile_id);

-- Index for faster lookups by service type (for search/filtering)
CREATE INDEX IF NOT EXISTS idx_provider_specialties_service_type
ON provider_specialties(service_type);

-- Index for faster lookups by group_id (for filtering by specialty type)
CREATE INDEX IF NOT EXISTS idx_provider_specialties_group
ON provider_specialties(group_id);

-- Index for faster lookups by option_value (for matching)
CREATE INDEX IF NOT EXISTS idx_provider_specialties_option
ON provider_specialties(option_value);

-- Composite index for search queries (service_type + option_value)
CREATE INDEX IF NOT EXISTS idx_provider_specialties_search
ON provider_specialties(service_type, option_value);

-- Table for custom specialties created by providers (not predefined)
CREATE TABLE IF NOT EXISTS provider_custom_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  group_id TEXT NOT NULL, -- Which group this custom specialty belongs to
  custom_label TEXT NOT NULL, -- The custom label created by provider
  custom_value TEXT NOT NULL, -- Slugified version for searching
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(profile_id, service_type, group_id, custom_value)
);

-- Index for custom specialties
CREATE INDEX IF NOT EXISTS idx_provider_custom_specialties_profile
ON provider_custom_specialties(profile_id);

CREATE INDEX IF NOT EXISTS idx_provider_custom_specialties_search
ON provider_custom_specialties(service_type, custom_value);

-- RLS Policies

-- Enable RLS
ALTER TABLE provider_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_custom_specialties ENABLE ROW LEVEL SECURITY;

-- Provider specialties: Anyone can read (for search/matching)
CREATE POLICY "Anyone can view provider specialties"
ON provider_specialties FOR SELECT
TO authenticated
USING (true);

-- Provider specialties: Only owner can insert
CREATE POLICY "Providers can insert own specialties"
ON provider_specialties FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

-- Provider specialties: Only owner can update
CREATE POLICY "Providers can update own specialties"
ON provider_specialties FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- Provider specialties: Only owner can delete
CREATE POLICY "Providers can delete own specialties"
ON provider_specialties FOR DELETE
TO authenticated
USING (auth.uid() = profile_id);

-- Custom specialties: Anyone can read
CREATE POLICY "Anyone can view custom specialties"
ON provider_custom_specialties FOR SELECT
TO authenticated
USING (true);

-- Custom specialties: Only owner can insert
CREATE POLICY "Providers can insert own custom specialties"
ON provider_custom_specialties FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

-- Custom specialties: Only owner can update
CREATE POLICY "Providers can update own custom specialties"
ON provider_custom_specialties FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- Custom specialties: Only owner can delete
CREATE POLICY "Providers can delete own custom specialties"
ON provider_custom_specialties FOR DELETE
TO authenticated
USING (auth.uid() = profile_id);

-- Comment on tables
COMMENT ON TABLE provider_specialties IS 'Stores provider selections from predefined specialty options based on their service type';
COMMENT ON TABLE provider_custom_specialties IS 'Stores custom specialties created by providers that are not in the predefined list';
