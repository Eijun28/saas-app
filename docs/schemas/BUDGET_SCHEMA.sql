-- ============================================
-- SCHÉMA BUDGET - NUPLY
-- ============================================
-- Tables pour la gestion de budget des couples
-- ============================================

-- ============================================
-- TABLE 1 : couple_budgets
-- ============================================
-- Budget global du couple (min/max)
CREATE TABLE IF NOT EXISTS couple_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  budget_min NUMERIC(10, 2) NOT NULL,
  budget_max NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- TABLE 2 : budget_categories
-- ============================================
-- Catégories de dépenses avec budget prévu et dépensé
CREATE TABLE IF NOT EXISTS budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  budget_prevu NUMERIC(10, 2) DEFAULT 0,
  budget_depense NUMERIC(10, 2) DEFAULT 0,
  statut TEXT CHECK (statut IN ('non_defini', 'en_cours', 'valide')) DEFAULT 'non_defini',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 3 : budget_providers
-- ============================================
-- Prestataires liés au budget avec devis
CREATE TABLE IF NOT EXISTS budget_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  category TEXT NOT NULL,
  devis NUMERIC(10, 2) NOT NULL,
  statut TEXT CHECK (statut IN ('contacte', 'devis_recu', 'valide', 'paye')) DEFAULT 'contacte',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_couple_budgets_user ON couple_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_user ON budget_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_providers_user ON budget_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_providers_category ON budget_providers(category);
CREATE INDEX IF NOT EXISTS idx_budget_providers_statut ON budget_providers(statut);

-- ============================================
-- TRIGGERS POUR updated_at
-- ============================================
-- Fonction pour mettre à jour updated_at (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour chaque table
DROP TRIGGER IF EXISTS update_couple_budgets_updated_at ON couple_budgets;
CREATE TRIGGER update_couple_budgets_updated_at
  BEFORE UPDATE ON couple_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_categories_updated_at ON budget_categories;
CREATE TRIGGER update_budget_categories_updated_at
  BEFORE UPDATE ON budget_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_providers_updated_at ON budget_providers;
CREATE TRIGGER update_budget_providers_updated_at
  BEFORE UPDATE ON budget_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE couple_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_providers ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can manage own budget" ON couple_budgets;
DROP POLICY IF EXISTS "Users can view own budget" ON couple_budgets;
DROP POLICY IF EXISTS "Users can insert own budget" ON couple_budgets;
DROP POLICY IF EXISTS "Users can update own budget" ON couple_budgets;
DROP POLICY IF EXISTS "Users can delete own budget" ON couple_budgets;

DROP POLICY IF EXISTS "Users can manage own categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can view own categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON budget_categories;

DROP POLICY IF EXISTS "Users can manage own providers" ON budget_providers;
DROP POLICY IF EXISTS "Users can view own providers" ON budget_providers;
DROP POLICY IF EXISTS "Users can insert own providers" ON budget_providers;
DROP POLICY IF EXISTS "Users can update own providers" ON budget_providers;
DROP POLICY IF EXISTS "Users can delete own providers" ON budget_providers;

-- Policies pour couple_budgets
CREATE POLICY "Users can view own budget"
  ON couple_budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget"
  ON couple_budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget"
  ON couple_budgets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget"
  ON couple_budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour budget_categories
CREATE POLICY "Users can view own categories"
  ON budget_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON budget_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON budget_categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON budget_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour budget_providers
CREATE POLICY "Users can view own providers"
  ON budget_providers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own providers"
  ON budget_providers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own providers"
  ON budget_providers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own providers"
  ON budget_providers FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FONCTION POUR CALCULER LE BUDGET DÉPENSÉ PAR CATÉGORIE
-- ============================================
-- Cette fonction met à jour automatiquement budget_depense
-- en fonction des prestataires validés/payés
CREATE OR REPLACE FUNCTION update_category_budget_depense()
RETURNS TRIGGER AS $$
DECLARE
  affected_category TEXT;
  affected_user_id UUID;
BEGIN
  -- Déterminer la catégorie et l'utilisateur affectés
  IF TG_OP = 'DELETE' THEN
    affected_category := OLD.category;
    affected_user_id := OLD.user_id;
  ELSE
    affected_category := NEW.category;
    affected_user_id := NEW.user_id;
  END IF;

  -- Mettre à jour le budget_depense de la catégorie
  UPDATE budget_categories
  SET budget_depense = (
    SELECT COALESCE(SUM(devis), 0)
    FROM budget_providers
    WHERE user_id = affected_user_id
      AND category = affected_category
      AND statut IN ('valide', 'paye')
  ),
  updated_at = NOW()
  WHERE user_id = affected_user_id
    AND category_name = affected_category;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour automatiquement le budget_depense
DROP TRIGGER IF EXISTS trigger_update_category_budget ON budget_providers;
CREATE TRIGGER trigger_update_category_budget
  AFTER INSERT OR UPDATE OR DELETE ON budget_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_category_budget_depense();

-- ============================================
-- NOTES
-- ============================================
-- 1. Les utilisateurs ne peuvent accéder qu'à leurs propres données
-- 2. Le budget_depense est calculé automatiquement via trigger
-- 3. Les statuts sont validés par CHECK constraints
-- 4. Toutes les tables ont des timestamps created_at et updated_at

