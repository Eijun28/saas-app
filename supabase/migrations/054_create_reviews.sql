-- ============================================
-- Migration: Création de la table reviews
-- Description: Système d'avis des couples sur les prestataires
-- ============================================

-- Table des avis individuels
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  request_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT reviews_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT reviews_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(id) ON DELETE SET NULL,
  CONSTRAINT reviews_unique_couple_provider UNIQUE (couple_id, provider_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON public.reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_couple_id ON public.reviews(couple_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_updated_at_trigger
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les avis
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Les couples peuvent créer un avis (couple_id = auth.uid())
DROP POLICY IF EXISTS "Couples can create reviews" ON public.reviews;
CREATE POLICY "Couples can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = couple_id);

-- Les couples peuvent modifier leur propre avis
DROP POLICY IF EXISTS "Couples can update own reviews" ON public.reviews;
CREATE POLICY "Couples can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = couple_id)
  WITH CHECK (auth.uid() = couple_id);

-- Fonction pour recalculer les agrégats sur prestataire_public_profiles
CREATE OR REPLACE FUNCTION update_provider_rating_aggregates()
RETURNS TRIGGER AS $$
DECLARE
  v_provider_id uuid;
  v_avg_rating numeric(3,2);
  v_total_reviews integer;
BEGIN
  -- Déterminer le provider_id selon l'opération
  IF TG_OP = 'DELETE' THEN
    v_provider_id := OLD.provider_id;
  ELSE
    v_provider_id := NEW.provider_id;
  END IF;

  -- Calculer les agrégats
  SELECT
    COALESCE(AVG(rating)::numeric(3,2), 0),
    COUNT(*)::integer
  INTO v_avg_rating, v_total_reviews
  FROM public.reviews
  WHERE provider_id = v_provider_id;

  -- Upsert dans prestataire_public_profiles
  INSERT INTO public.prestataire_public_profiles (profile_id, rating, total_reviews)
  VALUES (v_provider_id, v_avg_rating, v_total_reviews)
  ON CONFLICT (profile_id)
  DO UPDATE SET
    rating = v_avg_rating,
    total_reviews = v_total_reviews,
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur INSERT/UPDATE/DELETE de reviews
DROP TRIGGER IF EXISTS trigger_update_provider_rating ON public.reviews;
CREATE TRIGGER trigger_update_provider_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_rating_aggregates();
