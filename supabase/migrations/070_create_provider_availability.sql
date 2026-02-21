-- ─────────────────────────────────────────────────────────────────────────────
-- 070 · Disponibilités publiques des prestataires
-- ─────────────────────────────────────────────────────────────────────────────
-- Table créée :
--   · provider_availability – plages de disponibilité/indisponibilité
--     déclarées par le prestataire. Approche "blacklist" :
--     par défaut un prestataire est disponible, sauf sur les plages marquées.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_availability (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Plage de dates (inclusive des deux bornes)
  start_date   DATE        NOT NULL,
  end_date     DATE        NOT NULL,

  -- Statut du créneau
  status       TEXT        NOT NULL DEFAULT 'unavailable'
               CHECK (status IN ('unavailable', 'tentative')),
  --  unavailable : le prestataire est indisponible (mariage confirmé, congés…)
  --  tentative   : option posée, pas encore confirmée

  -- Note libre (visible publiquement si is_public = true)
  note         TEXT,

  -- Visibilité : si true le couple voit le statut, sinon seulement le prestataire
  is_public    BOOLEAN     NOT NULL DEFAULT true,

  -- Timestamps
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contrainte : end_date >= start_date
  CONSTRAINT availability_dates_check CHECK (end_date >= start_date)
);

COMMENT ON TABLE provider_availability IS 'Plages de disponibilité/indisponibilité déclarées par les prestataires. Par défaut un prestataire est disponible ; il marque les dates où il ne l''est pas.';
COMMENT ON COLUMN provider_availability.status IS 'unavailable = date bloquée (mariage, congés…) ; tentative = option posée non confirmée.';
COMMENT ON COLUMN provider_availability.is_public IS 'Si true, les couples voient le statut sur le profil public. Sinon, seul le prestataire voit l''entrée.';

-- ─── Trigger updated_at ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_provider_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_provider_availability_updated_at
  BEFORE UPDATE ON provider_availability
  FOR EACH ROW EXECUTE FUNCTION update_provider_availability_updated_at();

-- ─── Index ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_provider_availability_provider
  ON provider_availability (provider_id);

CREATE INDEX IF NOT EXISTS idx_provider_availability_dates
  ON provider_availability (provider_id, start_date, end_date);

-- Index pour la recherche publique : on ne filtre que les slots publics
CREATE INDEX IF NOT EXISTS idx_provider_availability_public
  ON provider_availability (provider_id, is_public, start_date, end_date)
  WHERE is_public = true;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;

-- Le prestataire voit tous ses créneaux (publics et privés)
CREATE POLICY "availability_select_own" ON provider_availability
  FOR SELECT USING (provider_id = auth.uid());

-- Les couples et visiteurs voient seulement les créneaux publics
-- (lecture via la route API publique qui n'utilise pas RLS, ou via anon key)
CREATE POLICY "availability_select_public" ON provider_availability
  FOR SELECT USING (is_public = true);

CREATE POLICY "availability_insert_own" ON provider_availability
  FOR INSERT WITH CHECK (provider_id = auth.uid());

CREATE POLICY "availability_update_own" ON provider_availability
  FOR UPDATE USING (provider_id = auth.uid());

CREATE POLICY "availability_delete_own" ON provider_availability
  FOR DELETE USING (provider_id = auth.uid());

-- ─── Vue publique simplifiée ─────────────────────────────────────────────────
-- Utilisée par les couples pour consulter la disponibilité d'un prestataire

CREATE OR REPLACE VIEW public_provider_availability AS
  SELECT
    id,
    provider_id,
    start_date,
    end_date,
    status,
    note
  FROM provider_availability
  WHERE is_public = true;

COMMENT ON VIEW public_provider_availability IS 'Disponibilités publiques des prestataires, sans informations privées.';
