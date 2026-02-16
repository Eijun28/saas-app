-- Migration: Create provider_service_details table
-- Stores dynamic, service-type-specific details for providers (JSONB flexible schema)
-- Example: a traiteur stores { regime_alimentaire: ["halal", "vegan"], max_personnes: 300, ... }
--          a photographe stores { style: ["reportage", "artistique"], duree_max: 12, ... }

CREATE TABLE IF NOT EXISTS provider_service_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One entry per provider (they have one service_type)
  CONSTRAINT provider_service_details_profile_unique UNIQUE (profile_id)
);

-- Index for fast lookups
CREATE INDEX idx_provider_service_details_profile ON provider_service_details(profile_id);
CREATE INDEX idx_provider_service_details_service_type ON provider_service_details(service_type);
-- GIN index for JSONB queries (filtering by specific detail values)
CREATE INDEX idx_provider_service_details_details ON provider_service_details USING GIN (details);

-- RLS policies
ALTER TABLE provider_service_details ENABLE ROW LEVEL SECURITY;

-- Providers can read/write their own details
CREATE POLICY "providers_read_own_service_details"
  ON provider_service_details FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "providers_insert_own_service_details"
  ON provider_service_details FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "providers_update_own_service_details"
  ON provider_service_details FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "providers_delete_own_service_details"
  ON provider_service_details FOR DELETE
  USING (auth.uid() = profile_id);

-- Couples can read provider service details (for matching/filtering)
CREATE POLICY "couples_read_service_details"
  ON provider_service_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'couple'
    )
  );

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_provider_service_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_provider_service_details_updated_at
  BEFORE UPDATE ON provider_service_details
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_service_details_updated_at();
