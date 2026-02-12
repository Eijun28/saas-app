-- Migration: Création de la table wedding_tasks
-- Table pour stocker les tâches de préparatifs de mariage par couple

CREATE TABLE IF NOT EXISTS public.wedding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  due_date DATE,
  -- Nombre de mois avant le mariage (pour calcul relatif)
  months_before_wedding INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  href TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes courantes
CREATE INDEX IF NOT EXISTS idx_wedding_tasks_couple_id ON public.wedding_tasks(couple_id);
CREATE INDEX IF NOT EXISTS idx_wedding_tasks_completed ON public.wedding_tasks(couple_id, completed);
CREATE INDEX IF NOT EXISTS idx_wedding_tasks_priority ON public.wedding_tasks(couple_id, priority);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_wedding_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.completed = true AND OLD.completed = false THEN
    NEW.completed_at = now();
  END IF;
  IF NEW.completed = false AND OLD.completed = true THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wedding_tasks_updated_at
  BEFORE UPDATE ON public.wedding_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_wedding_tasks_updated_at();

-- RLS Policies
ALTER TABLE public.wedding_tasks ENABLE ROW LEVEL SECURITY;

-- Couples can read their own tasks
CREATE POLICY "Couples can view their own tasks"
  ON public.wedding_tasks
  FOR SELECT
  USING (couple_id IN (
    SELECT id FROM public.couples WHERE user_id = auth.uid()
  ));

-- Couples can insert their own tasks
CREATE POLICY "Couples can insert their own tasks"
  ON public.wedding_tasks
  FOR INSERT
  WITH CHECK (couple_id IN (
    SELECT id FROM public.couples WHERE user_id = auth.uid()
  ));

-- Couples can update their own tasks
CREATE POLICY "Couples can update their own tasks"
  ON public.wedding_tasks
  FOR UPDATE
  USING (couple_id IN (
    SELECT id FROM public.couples WHERE user_id = auth.uid()
  ));

-- Couples can delete their own tasks
CREATE POLICY "Couples can delete their own tasks"
  ON public.wedding_tasks
  FOR DELETE
  USING (couple_id IN (
    SELECT id FROM public.couples WHERE user_id = auth.uid()
  ));
