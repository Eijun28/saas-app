-- 078_improve_timeline_events.sql
-- Amélioration de la table timeline_events
-- Ajout : statut, horaires (début/fin), lieu, catégorie

ALTER TABLE timeline_events
  ADD COLUMN IF NOT EXISTS status     TEXT NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning', 'confirmed', 'completed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time   TIME,
  ADD COLUMN IF NOT EXISTS location   TEXT,
  ADD COLUMN IF NOT EXISTS category   TEXT;

-- Index pour le statut (filtres fréquents)
CREATE INDEX IF NOT EXISTS idx_timeline_events_status
  ON timeline_events(status);

COMMENT ON COLUMN timeline_events.status     IS 'Statut : planning | confirmed | completed | cancelled';
COMMENT ON COLUMN timeline_events.start_time IS 'Heure de début de l''événement';
COMMENT ON COLUMN timeline_events.end_time   IS 'Heure de fin de l''événement';
COMMENT ON COLUMN timeline_events.location   IS 'Lieu ou adresse de l''événement';
COMMENT ON COLUMN timeline_events.category   IS 'Catégorie : ceremony-civil | ceremony-religious | ceremony-cultural | cocktail | dinner | party | photo | fitting | meeting | other';
