-- ─────────────────────────────────────────────────────────────────────────────
-- 069 · Programme du Jour J
-- ─────────────────────────────────────────────────────────────────────────────
-- Table créée :
--   · wedding_day_program – planning heure par heure de la journée de mariage
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wedding_day_program (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id    UUID        NOT NULL REFERENCES couples(id) ON DELETE CASCADE,

  -- Horaires
  start_time   TIME        NOT NULL,
  end_time     TIME,

  -- Contenu
  title        TEXT        NOT NULL,
  description  TEXT,
  location     TEXT,

  -- Personne responsable (nom libre, pas forcément un utilisateur)
  responsible  TEXT,

  -- Prestataire lié (optionnel – FK vers profiles)
  provider_id  UUID        REFERENCES profiles(id) ON DELETE SET NULL,

  -- Catégorie pour le code couleur et le regroupement
  category     TEXT        NOT NULL DEFAULT 'autre'
               CHECK (category IN (
                 'ceremonie', 'cocktail', 'repas', 'animation',
                 'logistique', 'beaute', 'photos', 'autre'
               )),

  -- Visible par les prestataires liés (futur partage)
  is_public    BOOLEAN     NOT NULL DEFAULT true,

  -- Ordre d'affichage (calculé sur start_time, mais permet de trier les égalités)
  sort_order   INT         NOT NULL DEFAULT 0,

  -- Timestamps
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE wedding_day_program IS 'Planning heure par heure de la journée de mariage du couple.';
COMMENT ON COLUMN wedding_day_program.category IS 'Catégorie de l''événement : ceremonie, cocktail, repas, animation, logistique, beaute, photos, autre.';
COMMENT ON COLUMN wedding_day_program.is_public IS 'Si true, visible par les prestataires liés lors d''un futur partage.';
COMMENT ON COLUMN wedding_day_program.sort_order IS 'Ordre secondaire pour les créneaux à l''heure identique.';

-- ─── Trigger updated_at ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_wedding_day_program_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wedding_day_program_updated_at
  BEFORE UPDATE ON wedding_day_program
  FOR EACH ROW EXECUTE FUNCTION update_wedding_day_program_updated_at();

-- ─── Index ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_wedding_day_program_couple     ON wedding_day_program (couple_id);
CREATE INDEX IF NOT EXISTS idx_wedding_day_program_start_time ON wedding_day_program (couple_id, start_time);
CREATE INDEX IF NOT EXISTS idx_wedding_day_program_category   ON wedding_day_program (couple_id, category);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE wedding_day_program ENABLE ROW LEVEL SECURITY;

CREATE POLICY "day_program_select_own" ON wedding_day_program
  FOR SELECT USING (
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

CREATE POLICY "day_program_insert_own" ON wedding_day_program
  FOR INSERT WITH CHECK (
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

CREATE POLICY "day_program_update_own" ON wedding_day_program
  FOR UPDATE USING (
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

CREATE POLICY "day_program_delete_own" ON wedding_day_program
  FOR DELETE USING (
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );
