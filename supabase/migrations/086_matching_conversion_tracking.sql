-- Migration: Matching conversion tracking
-- Tracks when matching results lead to demandes (requests)

CREATE TABLE IF NOT EXISTS matching_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  service_type text NOT NULL,
  matching_score integer NOT NULL,
  matching_rank integer NOT NULL,
  converted boolean DEFAULT false,
  conversion_delay_hours numeric,
  demande_id uuid REFERENCES demandes(id),
  created_at timestamptz DEFAULT now(),
  converted_at timestamptz
);

CREATE INDEX idx_matching_views_couple ON matching_views(couple_id);
CREATE INDEX idx_matching_views_provider ON matching_views(provider_id);
CREATE INDEX idx_matching_views_lookup ON matching_views(couple_id, provider_id, converted);

-- RLS
ALTER TABLE matching_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Couples can view own matching views" ON matching_views FOR SELECT USING (auth.uid() = couple_id);
CREATE POLICY "System can insert matching views" ON matching_views FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update matching views" ON matching_views FOR UPDATE USING (true);
