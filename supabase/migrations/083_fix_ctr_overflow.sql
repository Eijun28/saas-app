-- Migration 083: Fix CTR et contact_rate pouvant dépasser 1.0
-- Recrée record_click() et record_contact() avec LEAST(1.0, ...) sur les taux

-- Fonction record_click : borner le CTR entre 0.0 et 1.0
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
    -- CTR borné entre 0.0 et 1.0 (un CTR > 1 est mathématiquement impossible)
    click_through_rate = LEAST(1.0, CASE
      WHEN total_impressions > 0 THEN (total_clicks + 1)::decimal / total_impressions
      ELSE 0
    END),
    updated_at = now()
  WHERE profile_id = p_profile_id AND service_type = p_service_type;

  -- Log détaillé
  INSERT INTO impression_logs (profile_id, service_type, couple_id, event_type)
  VALUES (p_profile_id, p_service_type, p_couple_id, 'click');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction record_contact : borner le contact_rate entre 0.0 et 1.0
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
    -- contact_rate borné entre 0.0 et 1.0
    contact_rate = LEAST(1.0, CASE
      WHEN total_clicks > 0 THEN (total_contacts + 1)::decimal / total_clicks
      ELSE 0
    END),
    updated_at = now()
  WHERE profile_id = p_profile_id AND service_type = p_service_type;

  -- Log détaillé
  INSERT INTO impression_logs (profile_id, service_type, couple_id, event_type)
  VALUES (p_profile_id, p_service_type, p_couple_id, 'contact');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Corriger les valeurs existantes qui auraient dépassé 1.0
UPDATE provider_impressions
SET
  click_through_rate = LEAST(1.0, click_through_rate),
  contact_rate = LEAST(1.0, contact_rate)
WHERE click_through_rate > 1.0 OR contact_rate > 1.0;
