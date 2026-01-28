-- Migration: Création de la table prestataire_billing_info
-- Date: 2025-01
-- Description: Crée la table pour stocker les informations de facturation des prestataires
--              (SIRET, RIB/IBAN, adresse, etc.) nécessaires pour générer les devis et factures

-- ============================================
-- TABLE: prestataire_billing_info
-- ===========================================

CREATE TABLE IF NOT EXISTS public.prestataire_billing_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations de l'entreprise
  nom_societe TEXT NOT NULL,
  siret TEXT,
  tva_intracommunautaire TEXT,
  
  -- Coordonnées bancaires
  rib TEXT, -- Relevé d'Identité Bancaire (ancien format français)
  iban TEXT, -- International Bank Account Number (format européen)
  bic TEXT, -- Bank Identifier Code
  
  -- Adresse
  adresse TEXT NOT NULL,
  code_postal TEXT NOT NULL,
  ville TEXT NOT NULL,
  pays TEXT NOT NULL DEFAULT 'France',
  
  -- Contact pour facturation
  telephone TEXT,
  email_facturation TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_prestataire_billing_info_user_id ON public.prestataire_billing_info(user_id);
CREATE INDEX IF NOT EXISTS idx_prestataire_billing_info_siret ON public.prestataire_billing_info(siret);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_prestataire_billing_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_prestataire_billing_info_updated_at_trigger ON public.prestataire_billing_info;
CREATE TRIGGER update_prestataire_billing_info_updated_at_trigger
  BEFORE UPDATE ON public.prestataire_billing_info
  FOR EACH ROW
  EXECUTE FUNCTION update_prestataire_billing_info_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Activer RLS
ALTER TABLE public.prestataire_billing_info ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Prestataires can view own billing info" ON public.prestataire_billing_info;
DROP POLICY IF EXISTS "Prestataires can insert own billing info" ON public.prestataire_billing_info;
DROP POLICY IF EXISTS "Prestataires can update own billing info" ON public.prestataire_billing_info;
DROP POLICY IF EXISTS "Prestataires can delete own billing info" ON public.prestataire_billing_info;

-- Politique RLS : Les prestataires peuvent voir leurs propres informations
CREATE POLICY "Prestataires can view own billing info"
  ON public.prestataire_billing_info FOR SELECT
  USING (auth.uid() = user_id);

-- Politique RLS : Les prestataires peuvent insérer leurs propres informations
CREATE POLICY "Prestataires can insert own billing info"
  ON public.prestataire_billing_info FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique RLS : Les prestataires peuvent mettre à jour leurs propres informations
CREATE POLICY "Prestataires can update own billing info"
  ON public.prestataire_billing_info FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique RLS : Les prestataires peuvent supprimer leurs propres informations
CREATE POLICY "Prestataires can delete own billing info"
  ON public.prestataire_billing_info FOR DELETE
  USING (auth.uid() = user_id);

-- Commentaires pour documentation
COMMENT ON TABLE public.prestataire_billing_info IS 'Informations de facturation des prestataires (SIRET, RIB, adresse, etc.)';
COMMENT ON COLUMN public.prestataire_billing_info.siret IS 'Numéro SIRET de l''entreprise (14 chiffres)';
COMMENT ON COLUMN public.prestataire_billing_info.rib IS 'Relevé d''Identité Bancaire (ancien format français)';
COMMENT ON COLUMN public.prestataire_billing_info.iban IS 'International Bank Account Number (format européen standard)';
COMMENT ON COLUMN public.prestataire_billing_info.bic IS 'Bank Identifier Code (code SWIFT)';
