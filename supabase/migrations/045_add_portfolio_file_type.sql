-- Migration: Add file_type column to provider_portfolio
-- Allows providers to upload PDFs in addition to images

-- Add file_type column with default 'image' for existing records
ALTER TABLE provider_portfolio ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'image';

-- Add constraint to ensure only valid file types
ALTER TABLE provider_portfolio DROP CONSTRAINT IF EXISTS provider_portfolio_file_type_check;
ALTER TABLE provider_portfolio ADD CONSTRAINT provider_portfolio_file_type_check
  CHECK (file_type IN ('image', 'pdf'));

-- Update any NULL values to 'image' (for existing records)
UPDATE provider_portfolio SET file_type = 'image' WHERE file_type IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE provider_portfolio ALTER COLUMN file_type SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN provider_portfolio.file_type IS 'Type of file: image or pdf';
