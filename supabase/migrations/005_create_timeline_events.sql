-- Migration: Création de la table timeline_events
-- Date: 2024-12
-- Description: Table pour stocker les événements de la timeline de mariage des couples

-- ============================================
-- TABLE: timeline_events
-- ============================================
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_timeline_events_couple ON public.timeline_events(couple_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON public.timeline_events(event_date);
CREATE INDEX IF NOT EXISTS idx_timeline_events_couple_date ON public.timeline_events(couple_id, event_date);

-- Trigger pour updated_at
CREATE TRIGGER update_timeline_events_updated_at
  BEFORE UPDATE ON public.timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur la table
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies (si elles existent)
DROP POLICY IF EXISTS "Users can view own timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Users can insert own timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Users can update own timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Users can delete own timeline events" ON public.timeline_events;

-- Lecture : L'utilisateur peut voir ses propres événements
CREATE POLICY "Users can view own timeline events"
  ON public.timeline_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = timeline_events.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- Insertion : L'utilisateur peut créer ses propres événements
CREATE POLICY "Users can insert own timeline events"
  ON public.timeline_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = timeline_events.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- Mise à jour : L'utilisateur peut mettre à jour ses propres événements
CREATE POLICY "Users can update own timeline events"
  ON public.timeline_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = timeline_events.couple_id
      AND couples.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = timeline_events.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- Suppression : L'utilisateur peut supprimer ses propres événements
CREATE POLICY "Users can delete own timeline events"
  ON public.timeline_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = timeline_events.couple_id
      AND couples.user_id = auth.uid()
    )
  );