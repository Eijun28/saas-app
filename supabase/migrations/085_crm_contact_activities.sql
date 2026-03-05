-- 085 · CRM contact activities — activity log pour le suivi des contacts
-- Description : Journal d'activites pour chaque demande/contact dans le CRM prestataire

CREATE TABLE IF NOT EXISTS contact_activities (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID        NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  provider_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN ('note_added', 'tag_added', 'tag_removed', 'status_changed', 'message_sent', 'devis_sent', 'call_logged', 'follow_up_set', 'custom')),
  description TEXT        NOT NULL CHECK (length(trim(description)) > 0),
  metadata    JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_activities_request ON contact_activities (request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_activities_provider ON contact_activities (provider_id);

COMMENT ON TABLE contact_activities IS 'Journal d activites CRM pour le suivi des contacts prestataire.';

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE contact_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_provider_select" ON contact_activities FOR SELECT
  USING (provider_id = auth.uid());

CREATE POLICY "activities_provider_insert" ON contact_activities FOR INSERT
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "activities_provider_delete" ON contact_activities FOR DELETE
  USING (provider_id = auth.uid());
