-- Migration 048: Systeme de tracking des impressions et d'equite
-- Ce systeme permet de:
-- 1. Tracker combien de fois chaque prestataire est affiche (impressions)
-- 2. Tracker les clics/vues detaillees
-- 3. Calculer un score d'equite pour eviter de toujours montrer les memes prestataires

-- ============================================================================
-- TABLE: provider_impressions
-- Stocke les statistiques agregees d'impressions par prestataire et service_type
-- ============================================================================

CREATE TABLE IF NOT EXISTS provider_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,

  -- Compteurs d'impressions
  total_impressions INTEGER NOT NULL DEFAULT 0,
  impressions_today INTEGER NOT NULL DEFAULT 0,
  impressions_this_week INTEGER NOT NULL DEFAULT 0,
  impressions_this_month INTEGER NOT NULL DEFAULT 0,

  -- Compteurs de clics (quand un couple clique pour voir le profil)
  total_clicks INTEGER NOT NULL DEFAULT 0,
  clicks_today INTEGER NOT NULL DEFAULT 0,
  clicks_this_week INTEGER NOT NULL DEFAULT 0,

  -- Compteurs de contacts (demandes de contact/devis)
  total_contacts INTEGER NOT NULL DEFAULT 0,
  contacts_this_week INTEGER NOT NULL DEFAULT 0,

  -- Metriques de performance
  click_through_rate DECIMAL(5,4) DEFAULT 0, -- CTR = clicks/impressions
  contact_rate DECIMAL(5,4) DEFAULT 0, -- contacts/clicks

  -- Derniere mise a jour
  last_impression_at TIMESTAMPTZ,
  last_click_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,

  -- Reset tracking
  today_reset_at DATE DEFAULT CURRENT_DATE,
  week_reset_at DATE DEFAULT date_trunc('week', CURRENT_DATE)::date,
  month_reset_at DATE DEFAULT date_trunc('month', CURRENT_DATE)::date,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(profile_id, service_type)
);

-- Index pour les requetes frequentes
CREATE INDEX IF NOT EXISTS idx_provider_impressions_profile_id ON provider_impressions(profile_id);
CREATE INDEX IF NOT EXISTS idx_provider_impressions_service_type ON provider_impressions(service_type);
CREATE INDEX IF NOT EXISTS idx_provider_impressions_today ON provider_impressions(impressions_today);
CREATE INDEX IF NOT EXISTS idx_provider_impressions_week ON provider_impressions(impressions_this_week);

-- ============================================================================
-- TABLE: impression_logs
-- Historique detaille des impressions (pour analyse et debug)
-- ============================================================================

CREATE TABLE IF NOT EXISTS impression_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,

  -- Contexte de l'impression
  couple_id UUID REFERENCES couples(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES chatbot_conversations(id) ON DELETE SET NULL,
  search_criteria JSONB,

  -- Position dans les resultats
  rank_position INTEGER, -- 1, 2, 3...
  score DECIMAL(5,2),

  -- Type d'evenement
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'contact', 'favorite', 'hide')),

  -- Metadata
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour analytics
CREATE INDEX IF NOT EXISTS idx_impression_logs_profile ON impression_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_impression_logs_service ON impression_logs(service_type);
CREATE INDEX IF NOT EXISTS idx_impression_logs_created ON impression_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_impression_logs_event ON impression_logs(event_type);

-- ============================================================================
-- FONCTIONS: Gestion des impressions
-- ============================================================================

-- Fonction pour enregistrer une impression
CREATE OR REPLACE FUNCTION record_impression(
  p_profile_id UUID,
  p_service_type TEXT,
  p_couple_id UUID DEFAULT NULL,
  p_conversation_id UUID DEFAULT NULL,
  p_rank_position INTEGER DEFAULT NULL,
  p_score DECIMAL DEFAULT NULL,
  p_search_criteria JSONB DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::date;
  v_month_start DATE := date_trunc('month', CURRENT_DATE)::date;
BEGIN
  -- Insert ou update dans provider_impressions
  INSERT INTO provider_impressions (
    profile_id, service_type,
    total_impressions, impressions_today, impressions_this_week, impressions_this_month,
    last_impression_at, today_reset_at, week_reset_at, month_reset_at
  )
  VALUES (
    p_profile_id, p_service_type,
    1, 1, 1, 1,
    now(), v_today, v_week_start, v_month_start
  )
  ON CONFLICT (profile_id, service_type) DO UPDATE SET
    -- Reset les compteurs si la periode a change
    impressions_today = CASE
      WHEN provider_impressions.today_reset_at < v_today THEN 1
      ELSE provider_impressions.impressions_today + 1
    END,
    impressions_this_week = CASE
      WHEN provider_impressions.week_reset_at < v_week_start THEN 1
      ELSE provider_impressions.impressions_this_week + 1
    END,
    impressions_this_month = CASE
      WHEN provider_impressions.month_reset_at < v_month_start THEN 1
      ELSE provider_impressions.impressions_this_month + 1
    END,
    total_impressions = provider_impressions.total_impressions + 1,
    last_impression_at = now(),
    today_reset_at = CASE WHEN provider_impressions.today_reset_at < v_today THEN v_today ELSE provider_impressions.today_reset_at END,
    week_reset_at = CASE WHEN provider_impressions.week_reset_at < v_week_start THEN v_week_start ELSE provider_impressions.week_reset_at END,
    month_reset_at = CASE WHEN provider_impressions.month_reset_at < v_month_start THEN v_month_start ELSE provider_impressions.month_reset_at END,
    updated_at = now();

  -- Log detaille
  INSERT INTO impression_logs (
    profile_id, service_type, couple_id, conversation_id,
    rank_position, score, event_type, search_criteria
  )
  VALUES (
    p_profile_id, p_service_type, p_couple_id, p_conversation_id,
    p_rank_position, p_score, 'impression', p_search_criteria
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour enregistrer un clic
CREATE OR REPLACE FUNCTION record_click(
  p_profile_id UUID,
  p_service_type TEXT,
  p_couple_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::date;
BEGIN
  UPDATE provider_impressions SET
    clicks_today = CASE
      WHEN today_reset_at < v_today THEN 1
      ELSE clicks_today + 1
    END,
    clicks_this_week = CASE
      WHEN week_reset_at < v_week_start THEN 1
      ELSE clicks_this_week + 1
    END,
    total_clicks = total_clicks + 1,
    last_click_at = now(),
    -- Recalculer le CTR
    click_through_rate = CASE
      WHEN total_impressions > 0 THEN (total_clicks + 1)::decimal / total_impressions
      ELSE 0
    END,
    updated_at = now()
  WHERE profile_id = p_profile_id AND service_type = p_service_type;

  -- Log detaille
  INSERT INTO impression_logs (profile_id, service_type, couple_id, event_type)
  VALUES (p_profile_id, p_service_type, p_couple_id, 'click');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour enregistrer un contact
CREATE OR REPLACE FUNCTION record_contact(
  p_profile_id UUID,
  p_service_type TEXT,
  p_couple_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::date;
BEGIN
  UPDATE provider_impressions SET
    contacts_this_week = CASE
      WHEN week_reset_at < v_week_start THEN 1
      ELSE contacts_this_week + 1
    END,
    total_contacts = total_contacts + 1,
    last_contact_at = now(),
    -- Recalculer le contact rate
    contact_rate = CASE
      WHEN total_clicks > 0 THEN (total_contacts + 1)::decimal / total_clicks
      ELSE 0
    END,
    updated_at = now()
  WHERE profile_id = p_profile_id AND service_type = p_service_type;

  -- Log detaille
  INSERT INTO impression_logs (profile_id, service_type, couple_id, event_type)
  VALUES (p_profile_id, p_service_type, p_couple_id, 'contact');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTION: Calcul du score d'equite
-- Retourne un score entre 0 et 1 (1 = plus equitable / moins expose)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_fairness_score(
  p_profile_id UUID,
  p_service_type TEXT
)
RETURNS DECIMAL AS $$
DECLARE
  v_provider_impressions INTEGER;
  v_avg_impressions DECIMAL;
  v_max_impressions INTEGER;
  v_fairness_score DECIMAL;
BEGIN
  -- Recuperer les impressions du prestataire cette semaine
  SELECT COALESCE(impressions_this_week, 0)
  INTO v_provider_impressions
  FROM provider_impressions
  WHERE profile_id = p_profile_id AND service_type = p_service_type;

  -- Si pas d'impressions, score max d'equite
  IF v_provider_impressions IS NULL OR v_provider_impressions = 0 THEN
    RETURN 1.0;
  END IF;

  -- Calculer la moyenne et max des impressions pour ce service_type
  SELECT
    COALESCE(AVG(impressions_this_week), 0),
    COALESCE(MAX(impressions_this_week), 1)
  INTO v_avg_impressions, v_max_impressions
  FROM provider_impressions
  WHERE service_type = p_service_type;

  -- Eviter division par zero
  IF v_max_impressions = 0 THEN
    RETURN 1.0;
  END IF;

  -- Calculer le score d'equite
  -- Plus le prestataire a d'impressions par rapport a la moyenne, plus son score baisse
  -- Score = 1 - (impressions / max_impressions)^0.5
  -- L'exposant 0.5 adoucit la penalite
  v_fairness_score := 1.0 - POWER(v_provider_impressions::decimal / v_max_impressions, 0.5);

  -- Borner entre 0.1 et 1.0 (on ne descend jamais en dessous de 0.1)
  RETURN GREATEST(0.1, LEAST(1.0, v_fairness_score));
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FONCTION: Obtenir les donnees d'equite pour le matching
-- ============================================================================

CREATE OR REPLACE FUNCTION get_fairness_data_for_matching(
  p_service_type TEXT,
  p_provider_ids UUID[]
)
RETURNS TABLE (
  profile_id UUID,
  impressions_this_week INTEGER,
  total_impressions INTEGER,
  fairness_score DECIMAL,
  click_through_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pi.profile_id,
    COALESCE(pi.impressions_this_week, 0) as impressions_this_week,
    COALESCE(pi.total_impressions, 0) as total_impressions,
    calculate_fairness_score(pi.profile_id, p_service_type) as fairness_score,
    COALESCE(pi.click_through_rate, 0) as click_through_rate
  FROM unnest(p_provider_ids) as provider_id
  LEFT JOIN provider_impressions pi ON pi.profile_id = provider_id AND pi.service_type = p_service_type;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE provider_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE impression_logs ENABLE ROW LEVEL SECURITY;

-- Les prestataires peuvent voir leurs propres stats
DROP POLICY IF EXISTS "Providers can view own impressions" ON provider_impressions;
CREATE POLICY "Providers can view own impressions" ON provider_impressions
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

-- Le systeme peut tout gerer (via SECURITY DEFINER functions)
DROP POLICY IF EXISTS "System can manage impressions" ON provider_impressions;
CREATE POLICY "System can manage impressions" ON provider_impressions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Les prestataires peuvent voir leurs propres logs
DROP POLICY IF EXISTS "Providers can view own logs" ON impression_logs;
CREATE POLICY "Providers can view own logs" ON impression_logs
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE provider_impressions IS 'Statistiques agregees des impressions par prestataire et service_type';
COMMENT ON TABLE impression_logs IS 'Historique detaille des impressions pour analytics';
COMMENT ON FUNCTION calculate_fairness_score IS 'Calcule un score d''equite (0-1) base sur l''exposition relative du prestataire';
COMMENT ON FUNCTION record_impression IS 'Enregistre une impression quand un prestataire est affiche dans les resultats';
COMMENT ON FUNCTION record_click IS 'Enregistre un clic quand un couple consulte le profil d''un prestataire';
COMMENT ON FUNCTION record_contact IS 'Enregistre une demande de contact/devis';
