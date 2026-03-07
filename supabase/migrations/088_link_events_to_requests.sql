-- ============================================
-- Migration: Lien events <-> requests + event_providers
-- ============================================

-- 1. Ajouter colonne event_id a requests
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.timeline_events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_requests_event_id
  ON public.requests(event_id)
  WHERE event_id IS NOT NULL;

-- 2. Table event_providers
CREATE TABLE IF NOT EXISTS public.event_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.timeline_events(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_event_providers_event_id
  ON public.event_providers(event_id);

CREATE INDEX IF NOT EXISTS idx_event_providers_provider_id
  ON public.event_providers(provider_id);

ALTER TABLE public.event_providers ENABLE ROW LEVEL SECURITY;

-- Couples can manage own event providers
CREATE POLICY "Couples can manage own event providers"
  ON public.event_providers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.timeline_events te
      JOIN public.couples c ON c.id = te.couple_id
      WHERE te.id = event_providers.event_id
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.timeline_events te
      JOIN public.couples c ON c.id = te.couple_id
      WHERE te.id = event_providers.event_id
      AND c.user_id = auth.uid()
    )
  );

-- Providers can view their assignments
CREATE POLICY "Providers can view their assignments"
  ON public.event_providers FOR SELECT
  USING (provider_id = auth.uid());
