-- Migration 075: Ensure collaborateurs table exists with all required columns
-- This migration is a safety net to ensure the table is present in all environments.

-- 1) Create table if not exists
CREATE TABLE IF NOT EXISTS public.collaborateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  message TEXT,
  invitation_token TEXT,
  invitation_expires_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Add missing columns if table already existed with an old schema
ALTER TABLE IF EXISTS public.collaborateurs
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS invitation_token TEXT,
  ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3) Indexes
CREATE INDEX IF NOT EXISTS idx_collaborateurs_couple_id
  ON public.collaborateurs(couple_id);

CREATE INDEX IF NOT EXISTS idx_collaborateurs_email
  ON public.collaborateurs(email);

CREATE UNIQUE INDEX IF NOT EXISTS collaborateurs_invitation_token_unique_idx
  ON public.collaborateurs(invitation_token)
  WHERE invitation_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS collaborateurs_invitation_token_idx
  ON public.collaborateurs(invitation_token);

-- 4) Enable RLS
ALTER TABLE public.collaborateurs ENABLE ROW LEVEL SECURITY;

-- 5) RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'collaborateurs'
      AND policyname = 'collaborateurs_select_own'
  ) THEN
    CREATE POLICY collaborateurs_select_own
      ON public.collaborateurs
      FOR SELECT
      TO authenticated
      USING (couple_id = auth.uid() OR user_id = auth.uid());
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'collaborateurs'
      AND policyname = 'collaborateurs_update_own'
  ) THEN
    CREATE POLICY collaborateurs_update_own
      ON public.collaborateurs
      FOR UPDATE
      TO authenticated
      USING (couple_id = auth.uid())
      WITH CHECK (couple_id = auth.uid());
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'collaborateurs'
      AND policyname = 'collaborateurs_delete_own'
  ) THEN
    CREATE POLICY collaborateurs_delete_own
      ON public.collaborateurs
      FOR DELETE
      TO authenticated
      USING (couple_id = auth.uid());
  END IF;
END;
$$;

-- 6) Trigger for updated_at
DO $$
BEGIN
  IF to_regproc('public.update_updated_at_column') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_trigger
       WHERE tgname = 'update_collaborateurs_updated_at'
     ) THEN
    CREATE TRIGGER update_collaborateurs_updated_at
      BEFORE UPDATE ON public.collaborateurs
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END;
$$;
