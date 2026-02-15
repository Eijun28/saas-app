-- ============================================
-- Migration: Enrichissement favoris avec notes perso
-- Description: Ajoute notes personnelles et ordre de préférence aux favoris
-- ============================================

ALTER TABLE public.favoris
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_favoris_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_favoris_updated_at_trigger ON public.favoris;
CREATE TRIGGER update_favoris_updated_at_trigger
  BEFORE UPDATE ON public.favoris
  FOR EACH ROW
  EXECUTE FUNCTION update_favoris_updated_at();
