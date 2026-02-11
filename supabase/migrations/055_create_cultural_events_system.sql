-- ============================================
-- Migration: Système d'événements culturels/religieux
-- Description: Tables pour gérer les événements culturels pré-mariage
--   comme le Henné, Sangeet, Khotba, Nikah, etc.
--   Chaque événement est un mini-projet indépendant avec
--   son propre budget, lieu, invités et prestataires.
-- ============================================

-- ============================================
-- TABLE 1: cultural_event_types (Référentiel)
-- Types d'événements prédéfinis par culture
-- ============================================
CREATE TABLE IF NOT EXISTS public.cultural_event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  culture_category_id TEXT NOT NULL,
  culture_ids TEXT[] DEFAULT '{}',
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cultural_event_types_culture ON cultural_event_types(culture_category_id);
CREATE INDEX idx_cultural_event_types_slug ON cultural_event_types(slug);

ALTER TABLE cultural_event_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cultural event types are viewable by everyone"
  ON cultural_event_types FOR SELECT
  USING (true);

-- ============================================
-- TABLE 2: couple_events (Événements du couple)
-- Chaque événement = un mini-projet indépendant
-- ============================================
CREATE TABLE IF NOT EXISTS public.couple_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,

  -- Identité de l'événement
  event_type_id UUID REFERENCES public.cultural_event_types(id) ON DELETE SET NULL,
  custom_event_name TEXT,
  title TEXT NOT NULL,
  description TEXT,

  -- Données de planification indépendantes
  event_date DATE,
  event_time TIME,
  venue TEXT,
  venue_address TEXT,
  guest_count INTEGER,

  -- Budget indépendant
  budget_min NUMERIC(10,2),
  budget_max NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',

  -- Suivi de statut
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,

  -- Ordre d'affichage
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_couple_events_couple ON couple_events(couple_id);
CREATE INDEX idx_couple_events_type ON couple_events(event_type_id);
CREATE INDEX idx_couple_events_date ON couple_events(event_date);
CREATE INDEX idx_couple_events_status ON couple_events(status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_couple_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_couple_events_updated_at_trigger
  BEFORE UPDATE ON public.couple_events
  FOR EACH ROW
  EXECUTE FUNCTION update_couple_events_updated_at();

-- RLS: Les couples ne gèrent que leurs propres événements
ALTER TABLE couple_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own couple events"
  ON couple_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = couple_events.couple_id
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own couple events"
  ON couple_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = couple_events.couple_id
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own couple events"
  ON couple_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = couple_events.couple_id
      AND couples.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = couple_events.couple_id
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own couple events"
  ON couple_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = couple_events.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- ============================================
-- TABLE 3: couple_event_providers (Prestataires par événement)
-- Lie les prestataires à des événements spécifiques
-- ============================================
CREATE TABLE IF NOT EXISTS public.couple_event_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_event_id UUID NOT NULL REFERENCES public.couple_events(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'completed')),
  notes TEXT,
  budget_allocated NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(couple_event_id, provider_id)
);

CREATE INDEX idx_couple_event_providers_event ON couple_event_providers(couple_event_id);
CREATE INDEX idx_couple_event_providers_provider ON couple_event_providers(provider_id);

ALTER TABLE couple_event_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own event providers"
  ON couple_event_providers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM couple_events
      JOIN couples ON couples.id = couple_events.couple_id
      WHERE couple_events.id = couple_event_providers.couple_event_id
      AND couples.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couple_events
      JOIN couples ON couples.id = couple_events.couple_id
      WHERE couple_events.id = couple_event_providers.couple_event_id
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can view their event assignments"
  ON couple_event_providers FOR SELECT
  USING (auth.uid() = provider_id);

-- ============================================
-- TABLE 4: provider_event_types (Couverture prestataire)
-- Les prestataires déclarent quels types d'événements ils couvrent
-- ============================================
CREATE TABLE IF NOT EXISTS public.provider_event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type_id UUID NOT NULL REFERENCES public.cultural_event_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, event_type_id)
);

CREATE INDEX idx_provider_event_types_profile ON provider_event_types(profile_id);
CREATE INDEX idx_provider_event_types_event_type ON provider_event_types(event_type_id);

ALTER TABLE provider_event_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider event types are viewable by everyone"
  ON provider_event_types FOR SELECT
  USING (true);

CREATE POLICY "Providers can manage their own event types"
  ON provider_event_types FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Providers can delete their own event types"
  ON provider_event_types FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

-- ============================================
-- SEED: Types d'événements culturels prédéfinis
-- ============================================
INSERT INTO cultural_event_types (slug, label, description, culture_category_id, culture_ids, icon, display_order) VALUES
  -- Maghrébin
  ('henne', 'Henné', 'Cérémonie traditionnelle de décoration au henné', 'maghrebin', '{}', 'paintbrush', 1),
  ('khotba', 'Khotba', 'Cérémonie de demande en mariage traditionnelle', 'maghrebin', '{}', 'scroll', 2),
  ('hammam-mariee', 'Hammam de la mariée', 'Rituel de purification au hammam avant le mariage', 'maghrebin', '{}', 'sparkles', 3),
  ('aaqd', 'Aaqd / Fatiha', 'Cérémonie religieuse islamique du contrat de mariage', 'maghrebin', '{}', 'book-open', 4),
  ('amariya', 'Amariya', 'Cérémonie du trône / portage de la mariée', 'maghrebin', ARRAY['marocain'], 'crown', 5),
  ('waada', 'Waada', 'Rencontre officielle des deux familles', 'maghrebin', ARRAY['algerien'], 'users', 6),

  -- Indien
  ('sangeet', 'Sangeet', 'Soirée musicale et dansante pré-mariage', 'indien', '{}', 'music', 1),
  ('mehndi', 'Mehndi', 'Cérémonie de décoration au henné indien', 'indien', '{}', 'paintbrush', 2),
  ('haldi', 'Haldi', 'Cérémonie de pâte de curcuma pour purifier les mariés', 'indien', '{}', 'sun', 3),
  ('baraat', 'Baraat', 'Procession du marié vers le lieu de cérémonie', 'indien', '{}', 'party-popper', 4),
  ('mandap', 'Mandap / Vivah', 'Cérémonie de mariage hindou sous le mandap sacré', 'indien', '{}', 'flame', 5),
  ('reception-indienne', 'Réception indienne', 'Grande réception post-cérémonie', 'indien', '{}', 'utensils-crossed', 6),

  -- Pakistanais
  ('dholki', 'Dholki', 'Soirée musicale pré-mariage avec percussions', 'pakistanais', '{}', 'music', 1),
  ('mayun', 'Mayun', 'Cérémonie de réclusion de la mariée avec pâte de curcuma', 'pakistanais', '{}', 'sparkles', 2),
  ('nikah', 'Nikah', 'Cérémonie de mariage islamique', 'pakistanais', '{}', 'book-open', 3),
  ('valima', 'Valima', 'Réception de mariage offerte par la famille du marié', 'pakistanais', '{}', 'utensils-crossed', 4),
  ('rukhsati', 'Rukhsati', 'Cérémonie de départ de la mariée vers son nouveau foyer', 'pakistanais', '{}', 'heart', 5),

  -- Turc
  ('kina-gecesi', 'Kına Gecesi', 'Nuit du henné turque, cérémonie traditionnelle de la mariée', 'turc', '{}', 'paintbrush', 1),
  ('soez-kesme', 'Söz Kesme', 'Cérémonie officielle de fiançailles turque', 'turc', '{}', 'gem', 2),
  ('dugun', 'Düğün', 'Grande cérémonie de mariage turque', 'turc', '{}', 'party-popper', 3),

  -- Africain
  ('dot', 'Dot / Bride Price', 'Cérémonie de la dot traditionnelle africaine', 'africain', '{}', 'gift', 1),
  ('ceremonie-traditionnelle-africaine', 'Cérémonie traditionnelle', 'Rites coutumiers du mariage africain', 'africain', '{}', 'crown', 2),
  ('soiree-griot', 'Soirée Griot', 'Soirée de célébration avec griot/djeli', 'africain', '{}', 'music', 3),
  ('introduction-familiale', 'Introduction familiale', 'Présentation officielle aux familles', 'africain', '{}', 'users', 4),

  -- Antillais
  ('ti-punch-ceremony', 'Cérémonie Ti-Punch', 'Cérémonie conviviale antillaise de célébration', 'antillais', '{}', 'wine', 1),
  ('soiree-zouk', 'Soirée Zouk / Kompa', 'Soirée dansante antillaise pré-mariage', 'antillais', '{}', 'music', 2),

  -- Asiatique
  ('ceremonie-the', 'Cérémonie du thé', 'Cérémonie traditionnelle de respect aux aînés', 'asiatique', ARRAY['chinois', 'vietnamien'], 'coffee', 1),
  ('guo-da-li', 'Guo Da Li', 'Cérémonie chinoise de cadeaux pré-mariage du marié', 'asiatique', ARRAY['chinois'], 'gift', 2),
  ('an-hoi', 'An Hỏi', 'Cérémonie vietnamienne de fiançailles', 'asiatique', ARRAY['vietnamien'], 'gift', 3),

  -- Moyen-Orient
  ('zaffa', 'Zaffa', 'Procession musicale traditionnelle vers le mariage', 'moyen-orient', '{}', 'music', 1),
  ('katb-el-kitab', 'Katb El-Kitab', 'Signature religieuse du contrat de mariage', 'moyen-orient', '{}', 'file-text', 2),
  ('henne-oriental', 'Henné oriental', 'Soirée de henné avant le mariage', 'moyen-orient', '{}', 'paintbrush', 3),

  -- Européen
  ('repetition-diner', 'Dîner de répétition', 'Dîner de répétition la veille du mariage', 'europeen', '{}', 'utensils-crossed', 1),
  ('evjf-evg', 'EVJF / EVG', 'Enterrement de vie de jeune fille ou garçon', 'europeen', '{}', 'party-popper', 2),

  -- Amérique latine
  ('despedida-de-soltera', 'Despedida de Soltera', 'Fête de célibataire latino-américaine', 'amerique-latine', '{}', 'party-popper', 1),
  ('pedida-de-mano', 'Pedida de Mano', 'Cérémonie de demande en mariage officielle', 'amerique-latine', '{}', 'gem', 2),

  -- Universel (disponible pour toutes les cultures)
  ('ceremonie-civile', 'Cérémonie civile', 'Mariage civil à la mairie', 'universel', '{}', 'building-2', 1),
  ('ceremonie-religieuse', 'Cérémonie religieuse', 'Cérémonie religieuse (église, mosquée, synagogue, temple)', 'universel', '{}', 'church', 2),
  ('reception', 'Réception / Fête', 'Réception principale du mariage', 'universel', '{}', 'party-popper', 3),
  ('brunch-lendemain', 'Brunch du lendemain', 'Brunch post-mariage avec les proches', 'universel', '{}', 'coffee', 4)
ON CONFLICT (slug) DO NOTHING;
