-- Migration: Create provider pricing system
-- Allows providers to define multiple pricing options (forfait, per person, per hour, etc.)

-- Create pricing type enum
DO $$ BEGIN
    CREATE TYPE pricing_unit AS ENUM (
        'forfait',           -- Prix fixe / forfait
        'par_personne',      -- Par invité/personne
        'par_heure',         -- Par heure
        'par_demi_journee',  -- Par demi-journée (4h)
        'par_journee',       -- Par journée complète
        'par_part',          -- Par part (gâteaux, traiteur)
        'par_essayage',      -- Par essayage (robes, costumes)
        'par_piece',         -- Par pièce/unité
        'par_km',            -- Par kilomètre (déplacement)
        'sur_devis'          -- Sur devis uniquement
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create provider_pricing table
CREATE TABLE IF NOT EXISTS provider_pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Pricing details
    label TEXT,                              -- Optional label (ex: "Formule journée", "Menu standard")
    pricing_unit pricing_unit NOT NULL,      -- Type of pricing
    price_min NUMERIC(10, 2),                -- Minimum price (can be null for "sur_devis")
    price_max NUMERIC(10, 2),                -- Maximum price (optional, for ranges)

    -- Display options
    is_primary BOOLEAN DEFAULT false,        -- Is this the main/highlighted pricing?
    display_order INTEGER DEFAULT 0,         -- Order for display
    description TEXT,                        -- Optional description

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_price_range CHECK (
        (price_min IS NULL AND price_max IS NULL) OR  -- sur_devis case
        (price_min IS NOT NULL AND (price_max IS NULL OR price_max >= price_min))
    )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_provider_pricing_provider_id ON provider_pricing(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_pricing_primary ON provider_pricing(provider_id, is_primary) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE provider_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Providers can manage their own pricing
CREATE POLICY "Providers can view their own pricing"
    ON provider_pricing FOR SELECT
    USING (provider_id = auth.uid());

CREATE POLICY "Providers can insert their own pricing"
    ON provider_pricing FOR INSERT
    WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers can update their own pricing"
    ON provider_pricing FOR UPDATE
    USING (provider_id = auth.uid());

CREATE POLICY "Providers can delete their own pricing"
    ON provider_pricing FOR DELETE
    USING (provider_id = auth.uid());

-- Everyone can view provider pricing (for search/display)
CREATE POLICY "Anyone can view provider pricing"
    ON provider_pricing FOR SELECT
    USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_provider_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_provider_pricing_updated_at ON provider_pricing;
CREATE TRIGGER trigger_update_provider_pricing_updated_at
    BEFORE UPDATE ON provider_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_provider_pricing_updated_at();

-- Function to ensure only one primary pricing per provider
CREATE OR REPLACE FUNCTION ensure_single_primary_pricing()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE provider_pricing
        SET is_primary = false
        WHERE provider_id = NEW.provider_id
        AND id != NEW.id
        AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for single primary pricing
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_pricing ON provider_pricing;
CREATE TRIGGER trigger_ensure_single_primary_pricing
    BEFORE INSERT OR UPDATE ON provider_pricing
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_pricing();

-- Add comment for documentation
COMMENT ON TABLE provider_pricing IS 'Stores pricing options for providers (forfait, per person, per hour, etc.)';
COMMENT ON COLUMN provider_pricing.pricing_unit IS 'Type of pricing: forfait, par_personne, par_heure, par_demi_journee, par_journee, par_part, par_essayage, par_piece, par_km, sur_devis';
COMMENT ON COLUMN provider_pricing.is_primary IS 'Indicates if this is the main pricing to display on cards';
