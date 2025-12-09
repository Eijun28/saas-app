-- Migration: Créer la table budget_items pour les dépenses de mariage
-- Date: 2024

-- 1. Créer la table budget_items si elle n'existe pas
CREATE TABLE IF NOT EXISTS budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_budget_items_couple ON budget_items(couple_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category ON budget_items(category);

-- 3. Activer RLS (Row Level Security)
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS pour permettre aux couples de gérer leurs propres dépenses
DROP POLICY IF EXISTS "Users can view own budget items" ON budget_items;
CREATE POLICY "Users can view own budget items"
  ON budget_items FOR SELECT
  USING (auth.uid() = couple_id);

DROP POLICY IF EXISTS "Users can insert own budget items" ON budget_items;
CREATE POLICY "Users can insert own budget items"
  ON budget_items FOR INSERT
  WITH CHECK (auth.uid() = couple_id);

DROP POLICY IF EXISTS "Users can update own budget items" ON budget_items;
CREATE POLICY "Users can update own budget items"
  ON budget_items FOR UPDATE
  USING (auth.uid() = couple_id);

DROP POLICY IF EXISTS "Users can delete own budget items" ON budget_items;
CREATE POLICY "Users can delete own budget items"
  ON budget_items FOR DELETE
  USING (auth.uid() = couple_id);

-- 5. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_budget_items_updated_at ON budget_items;
CREATE TRIGGER update_budget_items_updated_at
  BEFORE UPDATE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Commentaires
COMMENT ON TABLE budget_items IS 'Dépenses enregistrées pour le mariage';
COMMENT ON COLUMN budget_items.couple_id IS 'ID du couple propriétaire de la dépense';
COMMENT ON COLUMN budget_items.title IS 'Titre de la dépense';
COMMENT ON COLUMN budget_items.category IS 'Catégorie de la dépense';
COMMENT ON COLUMN budget_items.amount IS 'Montant de la dépense en euros';

-- 7. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Table budget_items créée avec succès avec les politiques RLS!';
END $$;

