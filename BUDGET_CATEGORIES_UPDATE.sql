-- ============================================
-- MISE À JOUR TABLE budget_categories
-- ============================================
-- Ajout des champs category_icon et order_index
-- ============================================

-- Ajouter les colonnes si elles n'existent pas
ALTER TABLE budget_categories 
ADD COLUMN IF NOT EXISTS category_icon TEXT DEFAULT '📦';

ALTER TABLE budget_categories 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Ajouter la contrainte UNIQUE si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'budget_categories_user_category_unique'
  ) THEN
    ALTER TABLE budget_categories 
    ADD CONSTRAINT budget_categories_user_category_unique 
    UNIQUE(user_id, category_name);
  END IF;
END $$;

-- Mettre à jour les catégories existantes avec des icônes par défaut
UPDATE budget_categories 
SET category_icon = CASE category_name
  WHEN 'Lieu de réception' THEN '🏛️'
  WHEN 'Traiteur' THEN '🍽️'
  WHEN 'Photographe/Vidéaste' THEN '📸'
  WHEN 'Fleurs & Décoration' THEN '💐'
  WHEN 'Tenue (robe, costume)' THEN '👗'
  WHEN 'DJ/Musicien' THEN '🎵'
  WHEN 'Alliances' THEN '💍'
  WHEN 'Faire-part' THEN '✉️'
  WHEN 'Cadeau invités' THEN '🎁'
  WHEN 'Coiffure/Maquillage' THEN '💄'
  WHEN 'Transport' THEN '🚗'
  WHEN 'Hébergement' THEN '🏨'
  ELSE '📦'
END
WHERE category_icon IS NULL OR category_icon = '📦';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_budget_categories_order ON budget_categories(user_id, order_index);

