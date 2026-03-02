-- 079_create_devis_signatures.sql
-- Signature numérique des devis par OTP email

-- Table pour stocker les OTP de signature et l'historique
CREATE TABLE IF NOT EXISTS devis_signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  devis_id UUID NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL, -- couples.id (pas auth.users.id)
  -- OTP (stocké hashé SHA-256, jamais en clair)
  otp_hash TEXT NOT NULL,
  otp_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  otp_attempts INTEGER DEFAULT 0 NOT NULL,
  -- Résultat de la signature
  signed_at TIMESTAMPTZ,
  signer_ip TEXT,
  signer_user_agent TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Un seul OTP actif par devis
  CONSTRAINT devis_signatures_devis_id_unique UNIQUE (devis_id)
);

-- Colonnes supplémentaires sur la table devis pour tracer la signature
ALTER TABLE devis ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS signed_pdf_url TEXT;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS signer_name TEXT;

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_devis_signatures_devis_id ON devis_signatures(devis_id);
CREATE INDEX IF NOT EXISTS idx_devis_signatures_couple_id ON devis_signatures(couple_id);

-- RLS
ALTER TABLE devis_signatures ENABLE ROW LEVEL SECURITY;

-- Les couples peuvent voir leurs propres enregistrements de signature
CREATE POLICY "Couples can view own devis signatures" ON devis_signatures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = devis_signatures.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- Les prestataires peuvent voir les signatures de leurs devis
CREATE POLICY "Prestataires can view signatures for their devis" ON devis_signatures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM devis
      WHERE devis.id = devis_signatures.devis_id
      AND devis.prestataire_id = auth.uid()
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_devis_signatures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_devis_signatures_updated_at
  BEFORE UPDATE ON devis_signatures
  FOR EACH ROW EXECUTE FUNCTION update_devis_signatures_updated_at();
