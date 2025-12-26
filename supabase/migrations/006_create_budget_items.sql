-- ============================================
-- Migration: Création de la table budget_items
-- Date: 2024-12
-- ============================================

-- Table pour les items de budget des couples
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_budget_items_couple_id ON public.budget_items(couple_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category ON public.budget_items(category);
CREATE INDEX IF NOT EXISTS idx_budget_items_created_at ON public.budget_items(created_at);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_budget_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_budget_items_updated_at_trigger
  BEFORE UPDATE ON public.budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_items_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur budget_items
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- Policies pour budget_items
CREATE POLICY "Users can view own budget items"
  ON public.budget_items FOR SELECT
  USING (auth.uid() = couple_id);

CREATE POLICY "Users can insert own budget items"
  ON public.budget_items FOR INSERT
  WITH CHECK (auth.uid() = couple_id);

CREATE POLICY "Users can update own budget items"
  ON public.budget_items FOR UPDATE
  USING (auth.uid() = couple_id)
  WITH CHECK (auth.uid() = couple_id);

CREATE POLICY "Users can delete own budget items"
  ON public.budget_items FOR DELETE
  USING (auth.uid() = couple_id);

