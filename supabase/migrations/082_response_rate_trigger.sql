-- Migration 082: Trigger auto-calcul du response_rate des prestataires
-- Se déclenche AFTER UPDATE sur requests quand un pending passe à accepted ou rejected
-- Compatible avec le trigger BEFORE existant (trg_requests_status_change)

CREATE OR REPLACE FUNCTION public.update_provider_response_rate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Uniquement quand une demande pending est répondue (accepted ou rejected)
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
    UPDATE profiles
    SET response_rate = (
      SELECT ROUND(
        COUNT(*) FILTER (WHERE status = 'accepted')::NUMERIC /
        NULLIF(COUNT(*) FILTER (WHERE status IN ('accepted', 'rejected')), 0),
        2
      )
      FROM requests
      WHERE provider_id = NEW.provider_id
    )
    WHERE id = NEW.provider_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_response_rate ON public.requests;
CREATE TRIGGER trg_update_response_rate
  AFTER UPDATE OF status ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_provider_response_rate();

-- Backfill: recalcul du response_rate pour tous les prestataires existants
UPDATE profiles p
SET response_rate = (
  SELECT ROUND(
    COUNT(*) FILTER (WHERE r.status = 'accepted')::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE r.status IN ('accepted', 'rejected')), 0),
    2
  )
  FROM requests r
  WHERE r.provider_id = p.id
)
WHERE p.role = 'prestataire';
