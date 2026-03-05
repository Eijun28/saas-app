-- 086 · CRM contacts autonomes — contacts manuels et importes
-- Description : Table de contacts CRM independante des demandes, avec source tracking

CREATE TABLE IF NOT EXISTS crm_contacts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Identite
  first_name    TEXT        NOT NULL DEFAULT '',
  last_name     TEXT        NOT NULL DEFAULT '',
  email         TEXT,
  phone         TEXT,
  -- Mariage
  wedding_date  DATE,
  wedding_location TEXT,
  budget        INTEGER,
  guest_count   INTEGER,
  -- CRM
  status        TEXT        NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'contacted', 'meeting', 'proposal', 'won', 'lost')),
  source        TEXT        NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv_import', 'nuply_request')),
  notes         TEXT        DEFAULT '',
  -- Lien optionnel vers une demande Nuply
  request_id    UUID        REFERENCES requests(id) ON DELETE SET NULL,
  couple_id     UUID,
  -- Metadata
  custom_fields JSONB       DEFAULT '{}',
  tags          TEXT[]       DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_provider ON crm_contacts (provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts (provider_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_source ON crm_contacts (provider_id, source);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_request ON crm_contacts (request_id) WHERE request_id IS NOT NULL;

COMMENT ON TABLE crm_contacts IS 'Contacts CRM autonomes des prestataires - manuels, importes CSV, ou lies aux demandes Nuply.';

-- ─── Trigger updated_at ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_crm_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_crm_contacts_updated_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_contacts_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_contacts_provider_all" ON crm_contacts FOR ALL
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());
