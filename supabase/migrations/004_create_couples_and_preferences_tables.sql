-- Migration: Création des tables couples et couple_preferences
-- Date: 2024-12

-- ============================================
-- TABLE 1: couples (Données Essentielles)
-- ============================================
CREATE TABLE IF NOT EXISTS public.couples (
  -- Identifiants
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  
  -- Informations couple
  email TEXT NOT NULL,
  partner_1_name TEXT,
  partner_2_name TEXT,
  avatar_url TEXT,
  
  -- Informations mariage
  wedding_date DATE,
  wedding_location TEXT,
  guest_count INTEGER,
  
  -- Budget
  budget_min NUMERIC(10,2),
  budget_max NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Index pour couples
CREATE INDEX IF NOT EXISTS idx_couples_user_id ON public.couples(user_id);
CREATE INDEX IF NOT EXISTS idx_couples_email ON public.couples(email);
CREATE INDEX IF NOT EXISTS idx_couples_wedding_date ON public.couples(wedding_date);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_couples_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_couples_updated_at_trigger
  BEFORE UPDATE ON public.couples
  FOR EACH ROW
  EXECUTE FUNCTION update_couples_updated_at();

-- ============================================
-- TABLE 2: couple_preferences (Préférences)
-- ============================================
CREATE TABLE IF NOT EXISTS public.couple_preferences (
  -- Identifiant
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID UNIQUE NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  
  -- Cultures
  primary_culture_id UUID,
  secondary_culture_ids UUID[],
  
  -- Préférences culturelles
  cultural_preferences JSONB DEFAULT '{}',
  languages TEXT[] DEFAULT ARRAY['français'],
  
  -- Services (CHANGEMENT IMPORTANT !)
  essential_services TEXT[], -- Services OBLIGATOIRES (must-have)
  optional_services TEXT[],  -- Services ACCESSOIRES (nice-to-have)
  service_priorities JSONB DEFAULT '{}',
  
  -- Budget (généré par IA)
  budget_breakdown JSONB DEFAULT '{}',
  
  -- Autres
  special_requests TEXT,
  wedding_description TEXT,
  
  -- État profil
  profile_completed BOOLEAN DEFAULT FALSE,
  completion_percentage INTEGER DEFAULT 0,
  onboarding_step INTEGER DEFAULT 0,
  onboarding_completed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour couple_preferences
CREATE INDEX IF NOT EXISTS idx_couple_preferences_couple_id ON public.couple_preferences(couple_id);
CREATE INDEX IF NOT EXISTS idx_couple_preferences_primary_culture ON public.couple_preferences(primary_culture_id);
CREATE INDEX IF NOT EXISTS idx_couple_preferences_completed ON public.couple_preferences(profile_completed);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_couple_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_couple_preferences_updated_at_trigger
  BEFORE UPDATE ON public.couple_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_couple_preferences_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur couples
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

-- Policies pour couples
CREATE POLICY "Users can view own couple"
  ON public.couples FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own couple"
  ON public.couples FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own couple"
  ON public.couples FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own couple"
  ON public.couples FOR DELETE
  USING (auth.uid() = user_id);

-- Activer RLS sur couple_preferences
ALTER TABLE public.couple_preferences ENABLE ROW LEVEL SECURITY;

-- Policies pour couple_preferences
CREATE POLICY "Users can view own preferences"
  ON public.couple_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = couple_preferences.couple_id
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own preferences"
  ON public.couple_preferences FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = couple_preferences.couple_id
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own preferences"
  ON public.couple_preferences FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = couple_preferences.couple_id
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own preferences"
  ON public.couple_preferences FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = couple_preferences.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- ============================================
-- TABLE 3: timeline_events (si elle n'existe pas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_events_couple ON public.timeline_events(couple_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON public.timeline_events(event_date);

-- RLS pour timeline_events
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own timeline events"
  ON public.timeline_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = timeline_events.couple_id
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own timeline events"
  ON public.timeline_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = timeline_events.couple_id
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own timeline events"
  ON public.timeline_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = timeline_events.couple_id
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own timeline events"
  ON public.timeline_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = timeline_events.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- Trigger pour updated_at sur timeline_events
CREATE TRIGGER update_timeline_events_updated_at_trigger
  BEFORE UPDATE ON public.timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION update_couples_updated_at();

