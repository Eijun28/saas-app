-- Migration: Créer la table timeline_events pour les événements de mariage
-- Date: 2024

-- 1. Créer la table timeline_events si elle n'existe pas
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_timeline_events_couple ON timeline_events(couple_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON timeline_events(event_date);

-- 3. Activer RLS (Row Level Security)
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS pour permettre aux couples de gérer leurs propres événements
DROP POLICY IF EXISTS "Users can view own timeline events" ON timeline_events;
CREATE POLICY "Users can view own timeline events"
  ON timeline_events FOR SELECT
  USING (auth.uid() = couple_id);

DROP POLICY IF EXISTS "Users can insert own timeline events" ON timeline_events;
CREATE POLICY "Users can insert own timeline events"
  ON timeline_events FOR INSERT
  WITH CHECK (auth.uid() = couple_id);

DROP POLICY IF EXISTS "Users can update own timeline events" ON timeline_events;
CREATE POLICY "Users can update own timeline events"
  ON timeline_events FOR UPDATE
  USING (auth.uid() = couple_id);

DROP POLICY IF EXISTS "Users can delete own timeline events" ON timeline_events;
CREATE POLICY "Users can delete own timeline events"
  ON timeline_events FOR DELETE
  USING (auth.uid() = couple_id);

-- 5. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_timeline_events_updated_at ON timeline_events;
CREATE TRIGGER update_timeline_events_updated_at
  BEFORE UPDATE ON timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Commentaires
COMMENT ON TABLE timeline_events IS 'Événements planifiés pour le mariage';
COMMENT ON COLUMN timeline_events.couple_id IS 'ID du couple propriétaire de l''événement';
COMMENT ON COLUMN timeline_events.title IS 'Titre de l''événement';
COMMENT ON COLUMN timeline_events.description IS 'Description détaillée de l''événement';
COMMENT ON COLUMN timeline_events.event_date IS 'Date de l''événement';

-- 7. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Table timeline_events créée avec succès avec les politiques RLS!';
END $$;

