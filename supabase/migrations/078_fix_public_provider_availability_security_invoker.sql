-- ─────────────────────────────────────────────────────────────────────────────
-- 078 · Fix SECURITY DEFINER sur la vue public_provider_availability
-- ─────────────────────────────────────────────────────────────────────────────
-- Problème : la vue public_provider_availability était définie sans
--   security_invoker = true, ce qui lui conférait un comportement SECURITY
--   DEFINER (exécution avec les droits du créateur, bypass RLS).
-- Correction : recréer la vue avec security_invoker = true pour que les
--   politiques RLS de l'utilisateur courant soient appliquées.
-- ─────────────────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS public_provider_availability;

CREATE OR REPLACE VIEW public_provider_availability
  WITH (security_invoker = true)
AS
  SELECT
    id,
    provider_id,
    start_date,
    end_date,
    status,
    note
  FROM provider_availability
  WHERE is_public = true;

COMMENT ON VIEW public_provider_availability IS 'Disponibilités publiques des prestataires, sans informations privées. SECURITY INVOKER : respecte le RLS de l''utilisateur courant.';
