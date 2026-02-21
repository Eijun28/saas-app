-- ============================================================
-- Migration 074: Google Calendar Sync
-- ============================================================
-- Crée la table evenements_prestataire (si absente)
-- Ajoute les colonnes de sync Google Calendar sur profiles et couples
-- Ajoute google_event_id sur les tables sources pour le tracking
-- ============================================================

-- ------------------------------------------------------------
-- 1. Table evenements_prestataire (agenda des prestataires)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evenements_prestataire (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prestataire_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titre             TEXT NOT NULL,
  date              DATE NOT NULL,
  heure_debut       TIME NOT NULL,
  heure_fin         TIME,
  lieu              TEXT,
  notes             TEXT,
  -- Google Calendar sync
  google_event_id   TEXT,          -- ID de l'event dans Google Calendar
  google_synced_at  TIMESTAMPTZ,   -- Dernière synchro réussie
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Si la table existait déjà avant cette migration, ajouter les colonnes manquantes
ALTER TABLE evenements_prestataire
  ADD COLUMN IF NOT EXISTS google_event_id  TEXT,
  ADD COLUMN IF NOT EXISTS google_synced_at TIMESTAMPTZ;

-- Index performance
CREATE INDEX IF NOT EXISTS idx_evenements_prestataire_prestataire_id
  ON evenements_prestataire(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_evenements_prestataire_date
  ON evenements_prestataire(date);
CREATE INDEX IF NOT EXISTS idx_evenements_prestataire_google_event
  ON evenements_prestataire(google_event_id)
  WHERE google_event_id IS NOT NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_evenements_prestataire_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_evenements_prestataire_updated_at ON evenements_prestataire;
CREATE TRIGGER trigger_evenements_prestataire_updated_at
  BEFORE UPDATE ON evenements_prestataire
  FOR EACH ROW EXECUTE FUNCTION update_evenements_prestataire_updated_at();

-- RLS
ALTER TABLE evenements_prestataire ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prestataires_manage_own_events" ON evenements_prestataire;
CREATE POLICY "prestataires_manage_own_events" ON evenements_prestataire
  FOR ALL
  USING (auth.uid() = prestataire_id)
  WITH CHECK (auth.uid() = prestataire_id);

-- Service role bypass
DROP POLICY IF EXISTS "service_role_full_access_events" ON evenements_prestataire;
CREATE POLICY "service_role_full_access_events" ON evenements_prestataire
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ------------------------------------------------------------
-- 2. Colonnes Google Calendar sur profiles (prestataires)
-- ------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS google_calendar_enabled       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_calendar_token         TEXT,        -- access_token chiffré
  ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,        -- refresh_token chiffré
  ADD COLUMN IF NOT EXISTS google_calendar_token_expiry  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_calendar_last_sync     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_calendar_id            TEXT DEFAULT 'primary'; -- ID calendrier Google


-- ------------------------------------------------------------
-- 3. Colonnes Google Calendar sur couples
-- ------------------------------------------------------------
ALTER TABLE couples
  ADD COLUMN IF NOT EXISTS google_calendar_enabled       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_calendar_token         TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_token_expiry  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_calendar_last_sync     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_calendar_id            TEXT DEFAULT 'primary';


-- ------------------------------------------------------------
-- 4. Colonnes google_event_id sur les tables sources (tracking)
-- ------------------------------------------------------------
-- provider_availability: pour savoir quels blocs viennent de Google
ALTER TABLE provider_availability
  ADD COLUMN IF NOT EXISTS google_event_id  TEXT,
  ADD COLUMN IF NOT EXISTS google_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_provider_availability_google_event
  ON provider_availability(google_event_id)
  WHERE google_event_id IS NOT NULL;

-- timeline_events: pour savoir quels jalons ont été pushés vers Google
ALTER TABLE timeline_events
  ADD COLUMN IF NOT EXISTS google_event_id  TEXT,
  ADD COLUMN IF NOT EXISTS google_synced_at TIMESTAMPTZ;


-- ------------------------------------------------------------
-- 5. RLS : prestataires voient UNIQUEMENT leurs propres tokens
--    (les colonnes google_calendar_* sur profiles sont déjà
--     protégées par les policies existantes sur profiles)
-- ------------------------------------------------------------
-- Note: Les policies existantes sur `profiles` couvrent déjà ces colonnes.
-- Un prestataire ne peut lire/modifier que son propre profil.
-- Aucune policy supplémentaire n'est nécessaire.
