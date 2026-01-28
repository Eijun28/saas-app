-- Migration: Création de la table prestataire_banking_info
-- Date: 2025-01
-- Description: Crée la table pour stocker les informations bancaires (RIB) des prestataires
--              nécessaires à l'émission de factures

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.prestataire_banking_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Informations bancaires (RIB)
  iban TEXT,
  bic TEXT,
  nom_banque TEXT,
  nom_titulaire TEXT,
  adresse_banque TEXT,
  
  -- Informations fiscales (pour factures)
  siret TEXT,
  siren TEXT,
  tva_number TEXT,
  forme_juridique TEXT, -- SARL, EURL, Auto-entrepreneur, etc.
  adresse_siege TEXT,
  code_ape TEXT, -- Code APE/NAF
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_prestataire_banking_info_prestataire_id 
  ON public.prestataire_banking_info(prestataire_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_prestataire_banking_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_prestataire_banking_info_updated_at_trigger 
  ON public.prestataire_banking_info;
CREATE TRIGGER update_prestataire_banking_info_updated_at_trigger
  BEFORE UPDATE ON public.prestataire_banking_info
  FOR EACH ROW
  EXECUTE FUNCTION update_prestataire_banking_info_updated_at();

-- Activer RLS
ALTER TABLE public.prestataire_banking_info ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Prestataires can view own banking info" 
  ON public.prestataire_banking_info;
DROP POLICY IF EXISTS "Prestataires can manage own banking info" 
  ON public.prestataire_banking_info;

-- Politique RLS : les prestataires peuvent voir et gérer leurs propres informations bancaires
CREATE POLICY "Prestataires can view own banking info"
  ON public.prestataire_banking_info FOR SELECT
  USING (auth.uid() = prestataire_id);

CREATE POLICY "Prestataires can manage own banking info"
  ON public.prestataire_banking_info FOR ALL
  USING (auth.uid() = prestataire_id)
  WITH CHECK (auth.uid() = prestataire_id);
