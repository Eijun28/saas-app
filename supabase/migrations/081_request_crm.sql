-- 081 · CRM demandes — notes internes & tags prestataire
-- Description : Notes privées et labels colorés sur les demandes reçues
-- Tables : request_notes, request_tags

-- ─── Notes internes ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS request_notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID        NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  author_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL CHECK (length(trim(content)) > 0),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_request_notes_request ON request_notes (request_id, created_at DESC);

COMMENT ON TABLE request_notes IS 'Notes privées des prestataires sur leurs demandes reçues.';

-- ─── Tags colorés ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS request_tags (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID        NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  provider_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag         TEXT        NOT NULL CHECK (length(trim(tag)) > 0 AND length(tag) <= 50),
  color       TEXT        NOT NULL DEFAULT '#823F91',
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (request_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_request_tags_request    ON request_tags (request_id);
CREATE INDEX IF NOT EXISTS idx_request_tags_provider   ON request_tags (provider_id);

COMMENT ON TABLE request_tags IS 'Labels colorés (Chaud, Budget serré, Relancer…) sur les demandes.';

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE request_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_tags  ENABLE ROW LEVEL SECURITY;

-- request_notes : le prestataire propriétaire de la demande
CREATE POLICY "notes_provider_select" ON request_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_notes.request_id
        AND r.provider_id = auth.uid()
    )
  );

CREATE POLICY "notes_provider_insert" ON request_notes FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_notes.request_id
        AND r.provider_id = auth.uid()
    )
  );

CREATE POLICY "notes_provider_delete" ON request_notes FOR DELETE
  USING (author_id = auth.uid());

-- request_tags : le prestataire est propriétaire de ses tags
CREATE POLICY "tags_provider_all" ON request_tags FOR ALL
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());
