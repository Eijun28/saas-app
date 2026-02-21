-- ─────────────────────────────────────────────────────────────────────────────
-- 068 · Gestion des invités & plan de table
-- ─────────────────────────────────────────────────────────────────────────────
-- Tables créées :
--   · couple_guests          – liste des invités avec RSVP
--   · couple_reception_tables – tables de réception (plan de salle)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Table des invités ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS couple_guests (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id            UUID        NOT NULL REFERENCES couples(id) ON DELETE CASCADE,

  -- Identité
  first_name           TEXT        NOT NULL,
  last_name            TEXT        NOT NULL DEFAULT '',
  email                TEXT,
  phone                TEXT,

  -- Classification
  side                 TEXT        NOT NULL DEFAULT 'commun'
                                   CHECK (side IN ('partner_1', 'partner_2', 'commun')),
  category             TEXT        NOT NULL DEFAULT 'autre'
                                   CHECK (category IN ('famille', 'ami', 'collegue', 'autre')),

  -- RSVP
  rsvp_status          TEXT        NOT NULL DEFAULT 'pending'
                                   CHECK (rsvp_status IN ('pending', 'confirmed', 'declined', 'maybe')),
  rsvp_responded_at    TIMESTAMPTZ,

  -- Informations supplémentaires
  dietary_restrictions TEXT[]      DEFAULT '{}',
  plus_one             BOOLEAN     NOT NULL DEFAULT false,
  plus_one_name        TEXT,

  -- Plan de table
  table_number         INT,

  -- Notes internes
  notes                TEXT,

  -- Suivi des invitations envoyées
  invitation_sent_at   TIMESTAMPTZ,

  -- Timestamps
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE couple_guests IS 'Liste des invités d''un couple avec suivi RSVP et plan de table.';
COMMENT ON COLUMN couple_guests.side IS 'Côté du couple auquel appartient l''invité : partner_1, partner_2 ou commun.';
COMMENT ON COLUMN couple_guests.rsvp_status IS 'Statut RSVP : pending (en attente), confirmed, declined, maybe.';
COMMENT ON COLUMN couple_guests.dietary_restrictions IS 'Restrictions alimentaires : végétarien, halal, sans gluten, etc.';
COMMENT ON COLUMN couple_guests.plus_one IS 'L''invité vient avec un(e) accompagnant(e).';
COMMENT ON COLUMN couple_guests.table_number IS 'Numéro de table assigné lors du plan de salle.';

-- ─── Table des tables de réception ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS couple_reception_tables (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id    UUID        NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  table_number INT         NOT NULL,
  table_name   TEXT,
  capacity     INT         NOT NULL DEFAULT 8,
  shape        TEXT        NOT NULL DEFAULT 'round'
                           CHECK (shape IN ('round', 'rectangular', 'oval')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (couple_id, table_number)
);

COMMENT ON TABLE couple_reception_tables IS 'Tables de réception pour le plan de salle du mariage.';

-- ─── Trigger updated_at ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_couple_guests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_couple_guests_updated_at
  BEFORE UPDATE ON couple_guests
  FOR EACH ROW EXECUTE FUNCTION update_couple_guests_updated_at();

-- ─── Index ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_couple_guests_couple_id    ON couple_guests (couple_id);
CREATE INDEX IF NOT EXISTS idx_couple_guests_rsvp_status  ON couple_guests (couple_id, rsvp_status);
CREATE INDEX IF NOT EXISTS idx_couple_guests_side         ON couple_guests (couple_id, side);
CREATE INDEX IF NOT EXISTS idx_couple_guests_table_number ON couple_guests (couple_id, table_number);
CREATE INDEX IF NOT EXISTS idx_reception_tables_couple    ON couple_reception_tables (couple_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE couple_guests           ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_reception_tables ENABLE ROW LEVEL SECURITY;

-- Helpers : évite de répéter la sous-requête partout
-- Le couple connecté ne peut accéder qu'à ses propres invités

CREATE POLICY "guests_select_own" ON couple_guests
  FOR SELECT USING (
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

CREATE POLICY "guests_insert_own" ON couple_guests
  FOR INSERT WITH CHECK (
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

CREATE POLICY "guests_update_own" ON couple_guests
  FOR UPDATE USING (
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

CREATE POLICY "guests_delete_own" ON couple_guests
  FOR DELETE USING (
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

CREATE POLICY "tables_select_own" ON couple_reception_tables
  FOR SELECT USING (
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

CREATE POLICY "tables_insert_own" ON couple_reception_tables
  FOR INSERT WITH CHECK (
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

CREATE POLICY "tables_update_own" ON couple_reception_tables
  FOR UPDATE USING (
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

CREATE POLICY "tables_delete_own" ON couple_reception_tables
  FOR DELETE USING (
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );
