-- Migration: Système de consentement facturation et infos billing couple
-- Date: 2025-01
-- Description: Crée les tables pour le flow de création de devis avec consentement

-- ============================================
-- TABLE 1: billing_consent_requests
-- Demandes d'accès aux infos de facturation
-- ============================================

CREATE TABLE IF NOT EXISTS public.billing_consent_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour billing_consent_requests
CREATE INDEX IF NOT EXISTS idx_billing_consent_conversation_id
  ON public.billing_consent_requests(conversation_id);
CREATE INDEX IF NOT EXISTS idx_billing_consent_prestataire_id
  ON public.billing_consent_requests(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_billing_consent_couple_id
  ON public.billing_consent_requests(couple_id);
CREATE INDEX IF NOT EXISTS idx_billing_consent_status
  ON public.billing_consent_requests(status);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_billing_consent_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_billing_consent_requests_updated_at_trigger
  ON public.billing_consent_requests;
CREATE TRIGGER update_billing_consent_requests_updated_at_trigger
  BEFORE UPDATE ON public.billing_consent_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_consent_requests_updated_at();

-- ============================================
-- TABLE 2: couple_billing_info
-- Infos de facturation des couples
-- ============================================

CREATE TABLE IF NOT EXISTS public.couple_billing_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL UNIQUE REFERENCES public.couples(id) ON DELETE CASCADE,
  nom_complet TEXT NOT NULL,
  adresse TEXT NOT NULL,
  code_postal VARCHAR(10),
  ville TEXT,
  pays TEXT DEFAULT 'France',
  email_facturation TEXT,
  telephone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour couple_billing_info
CREATE INDEX IF NOT EXISTS idx_couple_billing_info_couple_id
  ON public.couple_billing_info(couple_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_couple_billing_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_couple_billing_info_updated_at_trigger
  ON public.couple_billing_info;
CREATE TRIGGER update_couple_billing_info_updated_at_trigger
  BEFORE UPDATE ON public.couple_billing_info
  FOR EACH ROW
  EXECUTE FUNCTION update_couple_billing_info_updated_at();

-- ============================================
-- AJOUTER pdf_url à devis
-- ============================================

ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS devis_number TEXT;

-- Index pour devis_number (pour génération unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_devis_number ON public.devis(devis_number) WHERE devis_number IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- RLS pour billing_consent_requests
ALTER TABLE public.billing_consent_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prestataires can view own consent requests" ON public.billing_consent_requests;
DROP POLICY IF EXISTS "Couples can view consent requests for them" ON public.billing_consent_requests;
DROP POLICY IF EXISTS "Prestataires can create consent requests" ON public.billing_consent_requests;
DROP POLICY IF EXISTS "Couples can respond to consent requests" ON public.billing_consent_requests;

CREATE POLICY "Prestataires can view own consent requests"
  ON public.billing_consent_requests FOR SELECT
  USING (auth.uid() = prestataire_id);

CREATE POLICY "Couples can view consent requests for them"
  ON public.billing_consent_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = billing_consent_requests.couple_id
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Prestataires can create consent requests"
  ON public.billing_consent_requests FOR INSERT
  WITH CHECK (auth.uid() = prestataire_id);

CREATE POLICY "Couples can respond to consent requests"
  ON public.billing_consent_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = billing_consent_requests.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- RLS pour couple_billing_info
ALTER TABLE public.couple_billing_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couples can manage own billing info" ON public.couple_billing_info;
DROP POLICY IF EXISTS "Prestataires can view billing info with consent" ON public.couple_billing_info;

CREATE POLICY "Couples can manage own billing info"
  ON public.couple_billing_info FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = couple_billing_info.couple_id
      AND couples.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = couple_billing_info.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- Les prestataires peuvent voir les infos billing si consentement approuvé
CREATE POLICY "Prestataires can view billing info with consent"
  ON public.couple_billing_info FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.billing_consent_requests bcr
      WHERE bcr.couple_id = couple_billing_info.couple_id
      AND bcr.prestataire_id = auth.uid()
      AND bcr.status = 'approved'
    )
  );

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour générer un numéro de devis unique
CREATE OR REPLACE FUNCTION generate_devis_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INT;
  new_number TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');

  -- Trouver le prochain numéro séquentiel pour cette année
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(devis_number FROM 'DEV-' || year_part || '-(\d+)') AS INT)
  ), 0) + 1
  INTO seq_num
  FROM public.devis
  WHERE devis_number LIKE 'DEV-' || year_part || '-%';

  new_number := 'DEV-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
