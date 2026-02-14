-- ============================================
-- Migration: Enrichissement de la table reviews
-- Description: Sous-notes par critère, réponse prestataire, photos, votes utiles
-- ============================================

-- 1. Ajouter les colonnes enrichies à la table reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS rating_quality integer CHECK (rating_quality IS NULL OR (rating_quality >= 1 AND rating_quality <= 5)),
  ADD COLUMN IF NOT EXISTS rating_communication integer CHECK (rating_communication IS NULL OR (rating_communication >= 1 AND rating_communication <= 5)),
  ADD COLUMN IF NOT EXISTS rating_value integer CHECK (rating_value IS NULL OR (rating_value >= 1 AND rating_value <= 5)),
  ADD COLUMN IF NOT EXISTS rating_punctuality integer CHECK (rating_punctuality IS NULL OR (rating_punctuality >= 1 AND rating_punctuality <= 5)),
  ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS provider_response text,
  ADD COLUMN IF NOT EXISTS provider_response_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS helpful_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- 2. Table des votes "utile" sur les avis
CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT review_helpful_votes_pkey PRIMARY KEY (id),
  CONSTRAINT review_helpful_votes_review_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE,
  CONSTRAINT review_helpful_votes_user_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT review_helpful_votes_unique UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review ON public.review_helpful_votes(review_id);

-- RLS for helpful votes
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view helpful votes" ON public.review_helpful_votes;
CREATE POLICY "Anyone can view helpful votes"
  ON public.review_helpful_votes FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can vote helpful" ON public.review_helpful_votes;
CREATE POLICY "Users can vote helpful"
  ON public.review_helpful_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove helpful vote" ON public.review_helpful_votes;
CREATE POLICY "Users can remove helpful vote"
  ON public.review_helpful_votes FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Trigger to update helpful_count on reviews
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
DECLARE
  v_review_id uuid;
  v_count integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_review_id := OLD.review_id;
  ELSE
    v_review_id := NEW.review_id;
  END IF;

  SELECT COUNT(*)::integer INTO v_count
  FROM public.review_helpful_votes
  WHERE review_id = v_review_id;

  UPDATE public.reviews
  SET helpful_count = v_count
  WHERE id = v_review_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_helpful_count ON public.review_helpful_votes;
CREATE TRIGGER trigger_update_helpful_count
  AFTER INSERT OR DELETE ON public.review_helpful_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

-- 4. Policy for provider to respond to reviews
DROP POLICY IF EXISTS "Providers can respond to reviews" ON public.reviews;
CREATE POLICY "Providers can respond to reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

-- 5. Update aggregate function to include sub-ratings averages
CREATE OR REPLACE FUNCTION update_provider_rating_aggregates()
RETURNS TRIGGER AS $$
DECLARE
  v_provider_id uuid;
  v_avg_rating numeric(3,2);
  v_total_reviews integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_provider_id := OLD.provider_id;
  ELSE
    v_provider_id := NEW.provider_id;
  END IF;

  SELECT
    COALESCE(AVG(rating)::numeric(3,2), 0),
    COUNT(*)::integer
  INTO v_avg_rating, v_total_reviews
  FROM public.reviews
  WHERE provider_id = v_provider_id;

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
