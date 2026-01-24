-- Migration: Création des tables devis et favoris
-- Date: 2025-01
-- Description: Crée les tables devis et favoris avec leurs colonnes et politiques RLS
--              Gère le cas où les tables existent déjà avec provider_id

-- ============================================
-- TABLE 1: devis
-- ============================================

-- Vérifier si la table existe déjà et renommer/ajouter prestataire_id si nécessaire
DO $$
BEGIN
  -- Si la table existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'devis'
  ) THEN
    -- Si elle a provider_id mais pas prestataire_id, renommer
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'devis' 
      AND column_name = 'provider_id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'devis' 
      AND column_name = 'prestataire_id'
    ) THEN
      ALTER TABLE public.devis RENAME COLUMN provider_id TO prestataire_id;
      RAISE NOTICE 'Colonne provider_id renommée en prestataire_id dans devis';
    -- Si elle n'a ni provider_id ni prestataire_id, ajouter prestataire_id
    ELSIF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'devis' 
      AND column_name = 'prestataire_id'
    ) THEN
      ALTER TABLE public.devis ADD COLUMN prestataire_id UUID;
      RAISE NOTICE 'Colonne prestataire_id ajoutée à devis';
    END IF;
  END IF;
END $$;

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id UUID REFERENCES public.requests(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  details TEXT,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'negotiating')),
  
  -- Colonnes supplémentaires (pour compatibilité avec migration 015)
  title TEXT,
  description TEXT,
  currency TEXT DEFAULT 'EUR',
  included_services TEXT[],
  excluded_services TEXT[],
  conditions TEXT,
  attachment_url TEXT,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter les colonnes manquantes si la table existe déjà
DO $$
BEGIN
  -- Ajouter valid_until si elle n'existe pas (peut être nommée validity_date)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'devis' 
    AND column_name = 'validity_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'devis' 
    AND column_name = 'valid_until'
  ) THEN
    ALTER TABLE public.devis RENAME COLUMN validity_date TO valid_until;
    RAISE NOTICE 'Colonne validity_date renommée en valid_until dans devis';
  END IF;
  
  -- Ajouter les autres colonnes si elles n'existent pas
  ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS title TEXT;
  ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';
  ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS included_services TEXT[];
  ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS excluded_services TEXT[];
  ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS conditions TEXT;
  ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS attachment_url TEXT;
  ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;
  ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
  ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
  ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
END $$;

-- Index pour devis (créer seulement s'ils n'existent pas)
CREATE INDEX IF NOT EXISTS idx_devis_couple_id ON public.devis(couple_id);
CREATE INDEX IF NOT EXISTS idx_devis_prestataire_id ON public.devis(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_devis_status ON public.devis(status);
CREATE INDEX IF NOT EXISTS idx_devis_demande_id ON public.devis(demande_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_devis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà avant de le recréer
DROP TRIGGER IF EXISTS update_devis_updated_at_trigger ON public.devis;
CREATE TRIGGER update_devis_updated_at_trigger
  BEFORE UPDATE ON public.devis
  FOR EACH ROW
  EXECUTE FUNCTION update_devis_updated_at();

-- ============================================
-- TABLE 2: favoris
-- ============================================

-- Vérifier si la table existe déjà et renommer/ajouter prestataire_id si nécessaire
DO $$
BEGIN
  -- Si la table existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'favoris'
  ) THEN
    -- Si elle a provider_id mais pas prestataire_id, renommer
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'favoris' 
      AND column_name = 'provider_id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'favoris' 
      AND column_name = 'prestataire_id'
    ) THEN
      ALTER TABLE public.favoris RENAME COLUMN provider_id TO prestataire_id;
      RAISE NOTICE 'Colonne provider_id renommée en prestataire_id dans favoris';
    -- Si elle n'a ni provider_id ni prestataire_id, ajouter prestataire_id
    ELSIF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'favoris' 
      AND column_name = 'prestataire_id'
    ) THEN
      ALTER TABLE public.favoris ADD COLUMN prestataire_id UUID;
      RAISE NOTICE 'Colonne prestataire_id ajoutée à favoris';
    END IF;
  END IF;
END $$;

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.favoris (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte unique pour éviter les doublons
  UNIQUE(couple_id, prestataire_id)
);

-- Ajouter la contrainte unique si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'favoris_couple_id_prestataire_id_key'
  ) THEN
    ALTER TABLE public.favoris ADD CONSTRAINT favoris_couple_id_prestataire_id_key 
    UNIQUE(couple_id, prestataire_id);
  END IF;
END $$;

-- Index pour favoris
CREATE INDEX IF NOT EXISTS idx_favoris_couple_id ON public.favoris(couple_id);
CREATE INDEX IF NOT EXISTS idx_favoris_prestataire_id ON public.favoris(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_favoris_created_at ON public.favoris(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur devis
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Couples can view own devis" ON public.devis;
DROP POLICY IF EXISTS "Prestataires can view own devis" ON public.devis;
DROP POLICY IF EXISTS "Couples can update own devis" ON public.devis;
DROP POLICY IF EXISTS "Prestataires can create devis" ON public.devis;

-- Politiques RLS pour devis
CREATE POLICY "Couples can view own devis"
  ON public.devis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = devis.couple_id
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Prestataires can view own devis"
  ON public.devis FOR SELECT
  USING (auth.uid() = prestataire_id);

CREATE POLICY "Couples can update own devis"
  ON public.devis FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = devis.couple_id
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Prestataires can create devis"
  ON public.devis FOR INSERT
  WITH CHECK (auth.uid() = prestataire_id);

-- Activer RLS sur favoris
ALTER TABLE public.favoris ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can manage own favoris" ON public.favoris;

-- Politique RLS pour favoris
CREATE POLICY "Users can manage own favoris"
  ON public.favoris
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = favoris.couple_id
      AND couples.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = favoris.couple_id
      AND couples.user_id = auth.uid()
    )
  );
