-- ============================================
-- Migration: Link timeline_events to requests
-- Adds event_id to requests so couples can find
-- providers for specific events (Henne, Sangeet, etc.)
-- Also creates event_providers junction table
-- referencing timeline_events (the active events system).
-- ============================================

-- 1. Add event_id to requests
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.timeline_events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS requests_event_id_idx
  ON public.requests (event_id)
  WHERE event_id IS NOT NULL;

-- 2. Junction table: timeline_events <-> providers
CREATE TABLE IF NOT EXISTS public.event_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.timeline_events(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'declined', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, provider_id)
);

CREATE INDEX IF NOT EXISTS event_providers_event_idx ON public.event_providers (event_id);
CREATE INDEX IF NOT EXISTS event_providers_provider_idx ON public.event_providers (provider_id);

ALTER TABLE public.event_providers ENABLE ROW LEVEL SECURITY;

-- Couples can manage their own event providers
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

-- Providers can view their own assignments
CREATE POLICY "Providers can view their event assignments"
  ON public.event_providers FOR SELECT
  USING (auth.uid() = provider_id);

-- 3. Trigger: auto-assign provider to event when request is accepted
CREATE OR REPLACE FUNCTION public.auto_assign_event_provider()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only on status change to accepted, and only if request has an event_id
  IF TG_OP = 'UPDATE'
     AND OLD.status <> 'accepted'
     AND NEW.status = 'accepted'
     AND NEW.event_id IS NOT NULL
  THEN
    INSERT INTO public.event_providers (event_id, provider_id, request_id, status)
    VALUES (NEW.event_id, NEW.provider_id, NEW.id, 'confirmed')
    ON CONFLICT (event_id, provider_id) DO UPDATE
      SET status = 'confirmed',
          request_id = EXCLUDED.request_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_assign_event_provider ON public.requests;
CREATE TRIGGER trg_auto_assign_event_provider
  AFTER UPDATE OF status ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_event_provider();
