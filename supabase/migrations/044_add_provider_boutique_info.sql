-- Migration: Add boutique/showroom info for providers
-- Optional physical location with address, hours, and notes

-- Add columns to profiles table for boutique info
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_physical_location BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boutique_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boutique_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boutique_address_complement TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boutique_postal_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boutique_city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boutique_country TEXT DEFAULT 'France';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boutique_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boutique_email TEXT;

-- Opening hours stored as JSONB for flexibility
-- Format: { "lundi": { "open": "09:00", "close": "18:00", "closed": false }, ... }
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boutique_hours JSONB DEFAULT '{}';

-- Additional info
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boutique_notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boutique_appointment_only BOOLEAN DEFAULT false;

-- Comments for documentation
COMMENT ON COLUMN profiles.has_physical_location IS 'Whether the provider has a physical boutique/showroom';
COMMENT ON COLUMN profiles.boutique_name IS 'Name of the boutique if different from business name';
COMMENT ON COLUMN profiles.boutique_address IS 'Street address of the boutique';
COMMENT ON COLUMN profiles.boutique_address_complement IS 'Additional address info (apt, floor, etc.)';
COMMENT ON COLUMN profiles.boutique_postal_code IS 'Postal code';
COMMENT ON COLUMN profiles.boutique_city IS 'City';
COMMENT ON COLUMN profiles.boutique_country IS 'Country (default: France)';
COMMENT ON COLUMN profiles.boutique_phone IS 'Boutique phone number';
COMMENT ON COLUMN profiles.boutique_email IS 'Boutique contact email';
COMMENT ON COLUMN profiles.boutique_hours IS 'Opening hours as JSON: {"lundi": {"open": "09:00", "close": "18:00", "closed": false}, ...}';
COMMENT ON COLUMN profiles.boutique_notes IS 'Additional notes about the boutique (parking, accessibility, etc.)';
COMMENT ON COLUMN profiles.boutique_appointment_only IS 'If true, visits are by appointment only';
